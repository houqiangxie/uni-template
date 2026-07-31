/**
 * 跨端二维码图片解码（基于 jsQR）
 * - H5：Image + Canvas
 * - 小程序 / App：OffscreenCanvas + getImageData
 */
import jsQR from 'jsqr'

export interface QrDecodeResult {
  result: string
  scanType: 'qrCode'
}

export interface QrPoint {
  x: number
  y: number
}

export interface QrLocation {
  topLeft: QrPoint
  topRight: QrPoint
  bottomLeft: QrPoint
  bottomRight: QrPoint
}

export interface QrBounds {
  left: number
  top: number
  width: number
  height: number
}

export interface DetectedQr extends QrDecodeResult {
  location: QrLocation
  bounds: QrBounds
}

/** 像素数据（跨端，不依赖 DOM ImageData） */
export interface PixelData {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface ImageQrDetectResult {
  codes: DetectedQr[]
  imageWidth: number
  imageHeight: number
}

const JSQR_OPTIONS = { inversionAttempts: 'attemptBoth' as const }
const MAX_QR_CODES = 10
const MAX_SCAN_DIMENSION = 2400

/** 从 jsQR location 计算包围盒 */
export function getBoundsFromLocation(location: QrLocation): QrBounds {
  const xs = [location.topLeft.x, location.topRight.x, location.bottomLeft.x, location.bottomRight.x]
  const ys = [location.topLeft.y, location.topRight.y, location.bottomLeft.y, location.bottomRight.y]
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  return {
    left,
    top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  }
}

function clonePixelData(source: PixelData): PixelData {
  return {
    data: new Uint8ClampedArray(source.data),
    width: source.width,
    height: source.height,
  }
}

/** 将已识别区域涂黑，便于迭代识别下一个码 */
function maskQrRegion(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bounds: QrBounds,
  padding = 16,
) {
  const left = Math.max(0, Math.floor(bounds.left - padding))
  const top = Math.max(0, Math.floor(bounds.top - padding))
  const right = Math.min(width, Math.ceil(bounds.left + bounds.width + padding))
  const bottom = Math.min(height, Math.ceil(bounds.top + bounds.height + padding))

  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      const i = (y * width + x) * 4
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
}

/** jsQR 返回的 location 字段名映射 */
function normalizeJsQrLocation(location: {
  topLeftCorner: QrPoint
  topRightCorner: QrPoint
  bottomLeftCorner: QrPoint
  bottomRightCorner: QrPoint
}): QrLocation {
  return {
    topLeft: location.topLeftCorner,
    topRight: location.topRightCorner,
    bottomLeft: location.bottomLeftCorner,
    bottomRight: location.bottomRightCorner,
  }
}

/** 提升对比度，减轻水印对识别的干扰 */
function enhanceContrast(pixels: PixelData): PixelData {
  const src = pixels.data
  const data = new Uint8ClampedArray(src.length)
  for (let i = 0; i < src.length; i += 4) {
    const gray = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]
    const v = gray < 140 ? Math.max(0, gray - 40) : Math.min(255, gray + 40)
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
    data[i + 3] = src[i + 3]
  }
  return { data, width: pixels.width, height: pixels.height }
}

function offsetLocation(location: QrLocation, dx: number, dy: number): QrLocation {
  return {
    topLeft: { x: location.topLeft.x + dx, y: location.topLeft.y + dy },
    topRight: { x: location.topRight.x + dx, y: location.topRight.y + dy },
    bottomLeft: { x: location.bottomLeft.x + dx, y: location.bottomLeft.y + dy },
    bottomRight: { x: location.bottomRight.x + dx, y: location.bottomRight.y + dy },
  }
}

function scaleDetectedQr(code: DetectedQr, ratio: number): DetectedQr {
  const scalePoint = (p: QrPoint) => ({ x: p.x * ratio, y: p.y * ratio })
  const location: QrLocation = {
    topLeft: scalePoint(code.location.topLeft),
    topRight: scalePoint(code.location.topRight),
    bottomLeft: scalePoint(code.location.bottomLeft),
    bottomRight: scalePoint(code.location.bottomRight),
  }
  return {
    ...code,
    location,
    bounds: getBoundsFromLocation(location),
  }
}

function boundsOverlap(a: QrBounds, b: QrBounds): boolean {
  const overlapW = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
  const overlapH = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
  if (overlapW <= 0 || overlapH <= 0)
    return false
  const minArea = Math.min(a.width * a.height, b.width * b.height)
  return (overlapW * overlapH) / minArea > 0.35
}

function mergeDetectedCodes(codes: DetectedQr[]): DetectedQr[] {
  const merged: DetectedQr[] = []
  for (const code of codes) {
    const duplicate = merged.some(existing =>
      existing.result === code.result || boundsOverlap(existing.bounds, code.bounds),
    )
    if (!duplicate)
      merged.push(code)
  }
  return merged
}

function extractTile(full: PixelData, x: number, y: number, w: number, h: number): PixelData {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const srcIdx = ((y + row) * full.width + (x + col)) * 4
      const dstIdx = (row * w + col) * 4
      data[dstIdx] = full.data[srcIdx]
      data[dstIdx + 1] = full.data[srcIdx + 1]
      data[dstIdx + 2] = full.data[srcIdx + 2]
      data[dstIdx + 3] = full.data[srcIdx + 3]
    }
  }
  return { data, width: w, height: h }
}

/**
 * 从像素数据中识别全部二维码（迭代遮罩）
 */
export function decodeAllQrFromImageData(pixels: PixelData, maxCodes = MAX_QR_CODES): DetectedQr[] {
  const tryDecode = (source: PixelData) => {
    const working = clonePixelData(source)
    const results: DetectedQr[] = []
    const seen = new Set<string>()

    while (results.length < maxCodes) {
      const code = jsQR(working.data, working.width, working.height, JSQR_OPTIONS)
      if (!code?.data)
        break

      const location = normalizeJsQrLocation(code.location)
      if (seen.has(code.data)) {
        maskQrRegion(working.data, working.width, working.height, getBoundsFromLocation(location))
        continue
      }
      seen.add(code.data)

      const bounds = getBoundsFromLocation(location)
      results.push({ result: code.data, scanType: 'qrCode', location, bounds })
      maskQrRegion(working.data, working.width, working.height, bounds)
    }
    return results
  }

  const fromOriginal = tryDecode(pixels)
  const fromEnhanced = tryDecode(enhanceContrast(pixels))
  return mergeDetectedCodes([...fromOriginal, ...fromEnhanced]).slice(0, maxCodes)
}

/**
 * 从像素数据中识别单个二维码
 */
export function decodeQrFromImageData(pixels: PixelData): QrDecodeResult | null {
  const codes = decodeAllQrFromImageData(pixels, 1)
  return codes[0] ?? null
}

/**
 * 分块扫描：整图含多个码时 jsQR 容易失败，按区域分别识别
 */
function decodeAllFromTiles(
  fullPixels: PixelData,
  canvasW: number,
  canvasH: number,
  scaleToOriginal: number,
): DetectedQr[] {
  const results: DetectedQr[] = []
  const gridSizes = [
    { cols: 2, rows: 2 },
    { cols: 3, rows: 3 },
    { cols: 4, rows: 4 },
  ]

  for (const { cols, rows } of gridSizes) {
    const tileW = Math.ceil(canvasW / cols)
    const tileH = Math.ceil(canvasH / rows)
    const padX = Math.floor(tileW * 0.2)
    const padY = Math.floor(tileH * 0.2)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = Math.max(0, col * tileW - padX)
        const y = Math.max(0, row * tileH - padY)
        const w = Math.min(canvasW - x, tileW + padX * 2)
        const h = Math.min(canvasH - y, tileH + padY * 2)
        if (w < 80 || h < 80)
          continue

        const tileData = extractTile(fullPixels, x, y, w, h)
        const codes = decodeAllQrFromImageData(tileData)
        for (const code of codes) {
          const offsetLoc = offsetLocation(code.location, x, y)
          results.push({
            ...code,
            location: offsetLoc,
            bounds: getBoundsFromLocation(offsetLoc),
          })
        }
      }
    }
  }

  return mergeDetectedCodes(results).map(code => scaleDetectedQr(code, scaleToOriginal))
}

/**
 * 多策略识别：全图多尺度 + 分块扫描
 */
function detectAllFromScales(
  originalWidth: number,
  originalHeight: number,
  renderAtScale: (scale: number) => PixelData | null,
): DetectedQr[] {
  const maxDim = Math.max(originalWidth, originalHeight)
  const baseScale = maxDim > MAX_SCAN_DIMENSION ? MAX_SCAN_DIMENSION / maxDim : 1
  const scales = [baseScale, baseScale * 0.6, baseScale * 0.8, baseScale * 1.2, baseScale * 1.5]
    .filter((s, i, arr) => s > 0 && arr.indexOf(s) === i)

  const allCodes: DetectedQr[] = []

  for (const scale of scales) {
    const pixels = renderAtScale(scale)
    if (!pixels)
      continue

    const { width: w, height: h } = pixels
    const fullCodes = decodeAllQrFromImageData(pixels)
      .map(code => scaleDetectedQr(code, 1 / scale))
    allCodes.push(...fullCodes)

    const tileCodes = decodeAllFromTiles(pixels, w, h, 1 / scale)
    allCodes.push(...tileCodes)
  }

  return mergeDetectedCodes(allCodes).slice(0, MAX_QR_CODES)
}

/**
 * 计算 aspectFit 模式下图片的实际显示区域
 */
export function calcAspectFitRect(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number,
) {
  const containerRatio = containerW / containerH
  const imageRatio = imgW / imgH

  if (imageRatio > containerRatio) {
    const width = containerW
    const height = containerW / imageRatio
    return { offsetX: 0, offsetY: (containerH - height) / 2, width, height }
  }

  const height = containerH
  const width = containerH * imageRatio
  return { offsetX: (containerW - width) / 2, offsetY: 0, width, height }
}

/**
 * 将二维码 bounds 映射到显示坐标（px）
 */
export function mapBoundsToDisplay(
  bounds: QrBounds,
  imageWidth: number,
  imageHeight: number,
  displayRect: { offsetX: number, offsetY: number, width: number, height: number },
) {
  const scaleX = displayRect.width / imageWidth
  const scaleY = displayRect.height / imageHeight
  return {
    left: displayRect.offsetX + bounds.left * scaleX,
    top: displayRect.offsetY + bounds.top * scaleY,
    width: bounds.width * scaleX,
    height: bounds.height * scaleY,
  }
}

// #ifdef H5
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0)
    })
  })
}

/** 分块扫描（轻量版，仅 2×2 / 3×3，每块 yield 避免卡 UI） */
async function decodeAllFromTilesAsync(
  fullPixels: PixelData,
  canvasW: number,
  canvasH: number,
  scaleToOriginal: number,
): Promise<DetectedQr[]> {
  const results: DetectedQr[] = []
  const gridSizes = [{ cols: 2, rows: 2 }, { cols: 3, rows: 3 }, { cols: 4, rows: 4 }]

  for (const { cols, rows } of gridSizes) {
    const tileW = Math.ceil(canvasW / cols)
    const tileH = Math.ceil(canvasH / rows)
    const padX = Math.floor(tileW * 0.2)
    const padY = Math.floor(tileH * 0.2)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        await yieldToMain()

        const x = Math.max(0, col * tileW - padX)
        const y = Math.max(0, row * tileH - padY)
        const w = Math.min(canvasW - x, tileW + padX * 2)
        const h = Math.min(canvasH - y, tileH + padY * 2)
        if (w < 80 || h < 80)
          continue

        const tileData = extractTile(fullPixels, x, y, w, h)
        const codes = decodeAllQrFromImageData(tileData)
        for (const code of codes) {
          const offsetLoc = offsetLocation(code.location, x, y)
          results.push({
            ...code,
            location: offsetLoc,
            bounds: getBoundsFromLocation(offsetLoc),
          })
        }
      }
    }

  }

  return mergeDetectedCodes(results).map(code => scaleDetectedQr(code, scaleToOriginal))
}

/** 分尺度异步识别，每步 yield 避免阻塞 UI */
async function detectAllFromImageSourceAsync(
  image: CanvasImageSource,
  width: number,
  height: number,
): Promise<DetectedQr[]> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return []

  const maxDim = Math.max(width, height)
  const baseScale = maxDim > MAX_SCAN_DIMENSION ? MAX_SCAN_DIMENSION / maxDim : 1
  const scales = [baseScale, baseScale * 0.6, baseScale * 0.8, baseScale * 1.2, baseScale * 1.5]
    .filter((s, i, arr) => s > 0 && arr.indexOf(s) === i)

  const allCodes: DetectedQr[] = []

  for (const scale of scales) {
    await yieldToMain()

    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    if (w < 120 || h < 120 || w > MAX_SCAN_DIMENSION || h > MAX_SCAN_DIMENSION)
      continue

    canvas.width = w
    canvas.height = h
    ctx.drawImage(image, 0, 0, w, h)
    const pixels = ctx.getImageData(0, 0, w, h)

    allCodes.push(
      ...decodeAllQrFromImageData(pixels).map(code => scaleDetectedQr(code, 1 / scale)),
    )

    await yieldToMain()
    allCodes.push(...await decodeAllFromTilesAsync(pixels, w, h, 1 / scale))

    if (mergeDetectedCodes(allCodes).length > 1)
      return mergeDetectedCodes(allCodes).slice(0, MAX_QR_CODES)
  }

  return mergeDetectedCodes(allCodes).slice(0, MAX_QR_CODES)
}

/** 多尺度分块补扫：单尺度只找到 1 码时，换尺度再扫 */
async function detectTilesMultiScaleFromImageSourceAsync(
  image: CanvasImageSource,
  width: number,
  height: number,
): Promise<DetectedQr[]> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return []

  const maxDim = Math.max(width, height)
  const baseScale = maxDim > MAX_SCAN_DIMENSION ? MAX_SCAN_DIMENSION / maxDim : 1
  const scales = [baseScale * 0.6, baseScale * 0.75, baseScale * 1.25, baseScale * 1.5]
    .filter((s, i, arr) => s > 0 && arr.indexOf(s) === i)

  const allCodes: DetectedQr[] = []
  for (const scale of scales) {
    await yieldToMain()
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    if (w < 120 || h < 120 || w > MAX_SCAN_DIMENSION || h > MAX_SCAN_DIMENSION)
      continue

    canvas.width = w
    canvas.height = h
    ctx.drawImage(image, 0, 0, w, h)
    const pixels = ctx.getImageData(0, 0, w, h)
    allCodes.push(...await decodeAllFromTilesAsync(pixels, w, h, 1 / scale))

    if (mergeDetectedCodes(allCodes).length > 1)
      return mergeDetectedCodes(allCodes)
  }

  return mergeDetectedCodes(allCodes)
}

/** 相册 / 图片多码识别主流程 */
async function detectAllCodesFromImageSource(
  image: CanvasImageSource,
  width: number,
  height: number,
): Promise<DetectedQr[]> {
  await yieldToMain()
  const quickCodes = detectQuickFromImageSource(image, width, height)
  if (quickCodes.length > 1)
    return quickCodes

  await yieldToMain()
  const tileCodes = await detectTilesOnlyFromImageSourceAsync(image, width, height)
  const merged = mergeDetectedCodes([...quickCodes, ...tileCodes])
  // 快速 + 分块已找到码则直接返回，避免单码仍走完整多尺度扫描
  if (merged.length >= 1)
    return merged

  await yieldToMain()
  const multiScaleCodes = await detectTilesMultiScaleFromImageSourceAsync(image, width, height)
  const withMultiScale = mergeDetectedCodes([...merged, ...multiScaleCodes])
  if (withMultiScale.length >= 1)
    return withMultiScale

  await yieldToMain()
  const fullCodes = await detectAllFromImageSourceAsync(image, width, height)
  return mergeDetectedCodes([...withMultiScale, ...fullCodes]).slice(0, MAX_QR_CODES)
}

/** 单尺度分块补扫：快速路径只找到 1 码时，先补扫再决定是否走完整多尺度 */
async function detectTilesOnlyFromImageSourceAsync(
  image: CanvasImageSource,
  width: number,
  height: number,
): Promise<DetectedQr[]> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return []

  const maxDim = Math.max(width, height)
  const scale = maxDim > MAX_SCAN_DIMENSION ? MAX_SCAN_DIMENSION / maxDim : 1
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  if (w < 120 || h < 120)
    return []

  canvas.width = w
  canvas.height = h
  ctx.drawImage(image, 0, 0, w, h)
  const pixels = ctx.getImageData(0, 0, w, h)
  return decodeAllFromTilesAsync(pixels, w, h, 1 / scale)
}

/**
 * 从图片 URL 识别全部二维码（H5）
 */
export function detectAllQrFromImageUrl(url: string): Promise<ImageQrDetectResult> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    if (!url.startsWith('blob:') && !url.startsWith('data:'))
      image.crossOrigin = 'anonymous'

    const timeout = window.setTimeout(() => {
      reject(new Error('图片加载超时'))
    }, 15000)

    image.onload = () => {
      void (async () => {
        try {
          clearTimeout(timeout)
          const imageWidth = image.naturalWidth
          const imageHeight = image.naturalHeight
          if (!imageWidth || !imageHeight) {
            reject(new Error('图片尺寸无效'))
            return
          }

          const codes = await detectAllCodesFromImageSource(image, imageWidth, imageHeight)
          resolve({ codes, imageWidth, imageHeight })
        }
        catch (err) {
          reject(err instanceof Error ? err : new Error('图片识别失败'))
        }
      })()
    }
    image.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('图片加载失败'))
    }
    image.src = url
  })
}

/** 单尺度快速识别（相册选图优先走此路径，避免多尺度分块阻塞主线程） */
function detectQuickFromImageSource(
  image: CanvasImageSource,
  width: number,
  height: number,
): DetectedQr[] {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return []

  const maxDim = Math.max(width, height)
  const scale = maxDim > MAX_SCAN_DIMENSION ? MAX_SCAN_DIMENSION / maxDim : 1
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  if (w < 120 || h < 120)
    return []

  canvas.width = w
  canvas.height = h
  ctx.drawImage(image, 0, 0, w, h)
  const pixels = ctx.getImageData(0, 0, w, h)
  const ratio = 1 / scale
  return decodeAllQrFromImageData(pixels).map(code => scaleDetectedQr(code, ratio))
}

export function decodeQrFromImageUrl(url: string): Promise<QrDecodeResult | null> {
  return detectAllQrFromImageUrl(url).then(({ codes }) => codes[0] ?? null)
}

function loadFileAsImageSource(file: File): Promise<{
  source: HTMLImageElement
  width: number
  height: number
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    const timeout = window.setTimeout(() => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载超时'))
    }, 10000)

    image.onload = () => {
      clearTimeout(timeout)
      const width = image.naturalWidth
      const height = image.naturalHeight
      if (!width || !height) {
        URL.revokeObjectURL(url)
        reject(new Error('图片尺寸无效'))
        return
      }
      resolve({ source: image, width, height })
    }
    image.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    image.src = url
  })
}

export function detectAllQrFromFile(file: File): Promise<ImageQrDetectResult & { path: string }> {
  const path = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => {
      URL.revokeObjectURL(path)
      reject(new Error('图片加载超时'))
    }, 10000)

    image.onload = () => {
      void (async () => {
        try {
          clearTimeout(timeout)
          const width = image.naturalWidth
          const height = image.naturalHeight
          if (!width || !height) {
            URL.revokeObjectURL(path)
            reject(new Error('图片尺寸无效'))
            return
          }

          await yieldToMain()
          const codes = await detectAllCodesFromImageSource(image, width, height)
          resolve({
            codes,
            imageWidth: width,
            imageHeight: height,
            path,
          })
        }
        catch (err) {
          URL.revokeObjectURL(path)
          reject(err instanceof Error ? err : new Error('图片识别失败'))
        }
      })()
    }
    image.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(path)
      reject(new Error('图片加载失败'))
    }
    image.src = path
  })
}

/** @deprecated 使用 pickImageFileH5 + ComScanCode 解码流程 */
export async function pickAndDetectAllQrH5(): Promise<ImageQrDetectResult & { path: string }> {
  const file = await pickImageFileH5()
  if (!file)
    throw new Error('用户取消选图')
  const detected = await detectAllQrFromFile(file)
  if (detected.codes.length === 0) {
    URL.revokeObjectURL(detected.path)
    throw new Error('未识别到二维码')
  }
  return detected
}

export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices?.getUserMedia)
}

export function isDesktopH5(): boolean {
  if (typeof window === 'undefined')
    return false
  const ua = navigator.userAgent
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const hasTouch = navigator.maxTouchPoints > 0
  return !isMobileUa && !hasTouch
}
// #endif

// #ifndef H5
interface OffscreenCanvasLike {
  getContext(type: '2d'): {
    drawImage: (img: unknown, x: number, y: number, w: number, h: number) => void
    getImageData: (x: number, y: number, w: number, h: number) => PixelData
  } | null
  createImage: () => {
    onload: (() => void) | null
    onerror: (() => void) | null
    src: string
  }
}

function renderPathToPixels(path: string, width: number, height: number): Promise<PixelData> {
  return new Promise((resolve, reject) => {
    if (typeof uni.createOffscreenCanvas !== 'function') {
      reject(new Error('当前环境不支持离屏 Canvas，无法识别图片'))
      return
    }

    const canvas = uni.createOffscreenCanvas({ type: '2d', width, height }) as OffscreenCanvasLike
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas 初始化失败'))
      return
    }

    const img = canvas.createImage()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height)
      resolve(ctx.getImageData(0, 0, width, height))
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = path
  })
}

function detectAllFromPathSync(path: string, width: number, height: number): Promise<DetectedQr[]> {
  const cache = new Map<number, PixelData>()

  const renderAtScale = (scale: number): PixelData | null => {
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    if (w < 120 || h < 120 || w > MAX_SCAN_DIMENSION || h > MAX_SCAN_DIMENSION)
      return null
    return cache.get(scale) ?? null
  }

  const scales = (() => {
    const maxDim = Math.max(width, height)
    const baseScale = maxDim > MAX_SCAN_DIMENSION ? MAX_SCAN_DIMENSION / maxDim : 1
    return [baseScale, baseScale * 0.6, baseScale * 0.8, baseScale * 1.2, baseScale * 1.5]
      .filter((s, i, arr) => s > 0 && arr.indexOf(s) === i)
  })()

  return scales.reduce<Promise<void>>(
    (chain, scale) => chain.then(async () => {
      const w = Math.round(width * scale)
      const h = Math.round(height * scale)
      if (w < 120 || h < 120 || w > MAX_SCAN_DIMENSION || h > MAX_SCAN_DIMENSION)
        return
      const pixels = await renderPathToPixels(path, w, h)
      cache.set(scale, pixels)
    }),
    Promise.resolve(),
  ).then(() => detectAllFromScales(width, height, renderAtScale))
}
// #endif

/**
 * 从本地图片路径识别全部二维码（跨端）
 */
export function detectAllQrFromPath(path: string): Promise<ImageQrDetectResult & { path: string }> {
  // #ifdef H5
  return detectAllQrFromImageUrl(path).then(res => ({ ...res, path }))
  // #endif

  // #ifndef H5
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: path,
      success: (info) => {
        const imageWidth = info.width
        const imageHeight = info.height
        if (!imageWidth || !imageHeight) {
          reject(new Error('图片尺寸无效'))
          return
        }
        detectAllFromPathSync(path, imageWidth, imageHeight)
          .then(codes => resolve({ codes, imageWidth, imageHeight, path }))
          .catch(err => reject(err instanceof Error ? err : new Error('图片识别失败')))
      },
      fail: () => reject(new Error('图片信息获取失败')),
    })
  })
  // #endif
}

export function decodeQrFromPath(path: string): Promise<(QrDecodeResult & { path?: string }) | null> {
  return detectAllQrFromPath(path).then(({ codes, path: p }) =>
    codes[0] ? { ...codes[0], path: p } : null,
  )
}

/** H5：弹出文件选择器（须同步调用 click，保留用户手势） */
export function pickImageFileH5(): Promise<File | null> {
  // #ifdef H5
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none'

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (file) {
        input.remove()
        resolve(file)
        return
      }
      // 极少数 WebView 需延迟读取；延迟前不能 remove input
      window.setTimeout(() => {
        const delayed = input.files?.[0]
        input.remove()
        resolve(delayed ?? null)
      }, 100)
    }, { once: true })

    document.body.appendChild(input)
    input.click()
  })
  // #endif
  // #ifndef H5
  return Promise.resolve(null)
  // #endif
}
