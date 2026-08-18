/**
 * 跨端扫码 composable
 * - 统一 API：scanCode / scanCodeFromImage / decodeQrImage
 * - 相册 / 图片多码：三端均 jsQR + ComScanCode 点选
 * - 相机：H5 / 微信小程序 `<camera>` + jsQR（扫描线 + 多码）；App 等 uni.scanCode
 */

import type { DetectedQr } from '@/utils/qrDecode'

export type ScanType = 'barCode' | 'qrCode' | 'datamatrix' | 'pdf417'

/** 扫码模式：相机 / 图片 / 两者都支持 */
export type ScanMode = 'camera' | 'image' | 'both'

export interface ScanCodeOptions {
  mode?: ScanMode
  /** 兼容旧参数：true 等价于 mode: 'camera' */
  onlyFromCamera?: boolean
  scanType?: ScanType[]
  /**
   * 仅相机模式下是否严格禁用相册（默认 false）
   * - false：H5 桌面仍显示相册按钮并引导选图（摄像头兜底）
   * - true：任意端均隐藏相册、提示语不引导相册
   */
  strictCameraOnly?: boolean
}

export interface ScanCodeResult {
  result: string
  scanType: string
  charSet?: string
  path?: string
}

/** 多码点选数据 */
export interface ScanMultiPickState {
  imageUrl: string
  codes: DetectedQr[]
  imageWidth: number
  imageHeight: number
}

/** 扫码弹层状态，供 ComScanCode 组件消费 */
export const scanState = reactive({
  visible: false,
  options: {} as ScanCodeOptions,
  /** 外部传入的多码点选（如 decodeQrImage 检测到多个码） */
  multiPick: null as ScanMultiPickState | null,
  /** 相册选图后交给 ComScanCode 解码（H5 File / 原生 path） */
  pendingAlbumFile: null as File | null,
  pendingAlbumPath: null as string | null,
})

/** @deprecated 使用 scanState */
export const h5ScanState = scanState

let pendingResolve: ((value: ScanCodeResult) => void) | null = null
let pendingReject: ((reason: Error) => void) | null = null

function normalizeOptions(options: ScanCodeOptions = {}): ScanCodeOptions {
  if (options.onlyFromCamera)
    return { ...options, mode: 'camera' }
  if (!options.mode)
    return { ...options, mode: 'both' }
  return options
}

function clearPendingAlbum() {
  scanState.pendingAlbumFile = null
  scanState.pendingAlbumPath = null
}

function clearPending() {
  pendingResolve = null
  pendingReject = null
}

/** 扫码成功回调 */
export function resolveScan(result: ScanCodeResult) {
  scanState.visible = false
  scanState.multiPick = null
  clearPendingAlbum()
  pendingResolve?.(result)
  clearPending()
}

/** @deprecated 使用 resolveScan */
export const resolveH5Scan = resolveScan

/** 扫码失败 / 取消回调 */
export function rejectScan(error: Error) {
  scanState.visible = false
  scanState.multiPick = null
  clearPendingAlbum()
  pendingReject?.(error)
  clearPending()
}

/** @deprecated 使用 rejectScan */
export const rejectH5Scan = rejectScan

/** 强制重置扫码状态（异常恢复用） */
export function resetScan() {
  scanState.visible = false
  scanState.multiPick = null
  clearPendingAlbum()
  clearPending()
}

/** @deprecated 使用 resetScan */
export const resetH5Scan = resetScan

function ensureScanIdle() {
  if (pendingResolve && !scanState.visible)
    clearPending()
  if (pendingResolve)
    throw new Error('扫码进行中，请稍后再试')
}

/** 打开多码点选弹层并等待用户选择 */
function openMultiPick(pick: ScanMultiPickState): Promise<ScanCodeResult> {
  ensureScanIdle()
  return new Promise((resolve, reject) => {
    pendingResolve = resolve
    pendingReject = reject
    scanState.multiPick = pick
    scanState.visible = true
  })
}

/** 识别路径，多码时进入点选 */
async function detectPathAndResolve(path: string): Promise<ScanCodeResult> {
  const detected = await detectAllQrFromPath(path)
  if (detected.codes.length === 0)
    throw new Error('未识别到二维码')
  if (detected.codes.length === 1)
    return { ...detected.codes[0], path: detected.path }

  return openMultiPick({
    imageUrl: detected.path,
    codes: detected.codes,
    imageWidth: detected.imageWidth,
    imageHeight: detected.imageHeight,
  })
}

type ImageDetectResult = Awaited<ReturnType<typeof detectAllQrFromPath>>

/** 相册选图解码：单码直接返回，多码打开点选层（不依赖 ComScanCode watch 消费 pending） */
function finishAlbumDetect(
  detected: ImageDetectResult,
  options: ScanCodeOptions,
) {
  scanState.options = { ...options, mode: 'image' }
  scanState.multiPick = null
  clearPendingAlbum()

  if (detected.codes.length === 0) {
    rejectScan(new Error('未识别到二维码'))
    return
  }
  if (detected.codes.length === 1) {
    resolveScan({
      result: detected.codes[0].result,
      scanType: detected.codes[0].scanType,
      path: detected.path,
    })
    return
  }
  scanState.multiPick = {
    imageUrl: detected.path,
    codes: detected.codes,
    imageWidth: detected.imageWidth,
    imageHeight: detected.imageHeight,
  }
  // 延后打开弹层，确保 multiPick 已写入，避免 visible watch 误判为需再次选图
  void nextTick(() => {
    scanState.visible = true
  })
}

function decodeAlbumPath(path: string, options: ScanCodeOptions) {
  uni.showLoading({ title: '正在识别...', mask: true })
  detectAllQrFromPath(path)
    .then(detected => finishAlbumDetect(detected, options))
    .catch((err) => {
      rejectScan(err instanceof Error ? err : new Error('图片识别失败'))
    })
    .finally(() => uni.hideLoading())
}

// #ifdef H5
function decodeAlbumFile(file: File, options: ScanCodeOptions) {
  uni.showLoading({ title: '正在识别...', mask: true })
  detectAllQrFromFile(file)
    .then(detected => finishAlbumDetect(detected, options))
    .catch((err) => {
      rejectScan(err instanceof Error ? err : new Error('图片识别失败'))
    })
    .finally(() => uni.hideLoading())
}

/** H5：同步弹出选图，再交给 ComScanCode 解码（与扫码页内点相册同一路径） */
function pickAndResolveDesktop(options: ScanCodeOptions): Promise<ScanCodeResult> {
  ensureScanIdle()

  return new Promise((resolve, reject) => {
    pendingResolve = resolve
    pendingReject = reject

    pickImageFileH5().then((file) => {
      if (!file) {
        rejectScan(new Error('用户取消选图'))
        return
      }
      decodeAlbumFile(file, options)
    })
  })
}
// #endif

// #ifndef H5
/** 原生端：选图后交给 ComScanCode 解码 */
function chooseImageAndResolve(options: ScanCodeOptions): Promise<ScanCodeResult> {
  ensureScanIdle()

  return new Promise((resolve, reject) => {
    pendingResolve = resolve
    pendingReject = reject

    uni.chooseImage({
      count: 1,
      sourceType: ['album'],
      success: (res) => {
        const path = res.tempFilePaths[0]
        if (!path) {
          rejectScan(new Error('未选择图片'))
          return
        }
        decodeAlbumPath(path, options)
      },
      fail: () => rejectScan(new Error('用户取消选图')),
    })
  })
}
// #endif

/**
 * 从相册识别二维码（三端一致：jsQR + 多码点选）
 */
export function scanCodeFromImage(options: Pick<ScanCodeOptions, 'scanType'> = {}): Promise<ScanCodeResult> {
  const normalized = { scanType: options.scanType }
  // #ifdef H5
  return pickAndResolveDesktop(normalized)
  // #endif

  // #ifndef H5
  return chooseImageAndResolve(normalized)
  // #endif
}

/**
 * 识别已有图片路径中的二维码，多码时打开点选弹层
 */
export function decodeQrImage(path: string): Promise<ScanCodeResult> {
  return detectPathAndResolve(path)
}

/**
 * 统一扫码入口
 * - 相册模式：scanCodeFromImage
 * - 其余：打开 ComScanCode（H5 摄像头 / 小程序 App 原生扫码 + 相册）
 */
export function scanCode(options: ScanCodeOptions = {}): Promise<ScanCodeResult> {
  const normalized = normalizeOptions(options)

  if (normalized.mode === 'image')
    return scanCodeFromImage({ scanType: normalized.scanType })

  ensureScanIdle()

  return new Promise((resolve, reject) => {
    pendingResolve = resolve
    pendingReject = reject
    scanState.options = normalized
    scanState.multiPick = null
    clearPendingAlbum()
    scanState.visible = true
  })
}
