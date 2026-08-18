<script setup lang="ts">
import type { ScanCodeResult } from '@/composables/useScanCode'
import type { DetectedQr, PixelData, QrBounds } from '@/utils/qrDecode'

const instance = getCurrentInstance()

// #ifdef H5
const isDesktop = isDesktopH5()
const SCAN_VIDEO_ID = 'com-scan-code-video'
const videoRef = ref<HTMLVideoElement | null>(null)
// #endif

const PICKER_CONTAINER_ID = 'com-scan-code-picker'

const scanning = ref(false)
const decoding = ref(false)
/** 相册识别代次，用于取消进行中的识别 */
let decodeGeneration = 0
/** visible watch 代次，避免 async watch 过期回调重复拉起相册 */
let visibleWatchGeneration = 0
// #ifdef H5
const cameraFailed = ref(false)
// #endif

function createDefaultTipText() {
  const mode = scanState.options.mode ?? 'both'
  const strictCamera = !!scanState.options.strictCameraOnly
  // #ifdef H5
  if (mode === 'camera') {
    if (isDesktop && !strictCamera)
      return 'PC 端可用摄像头对准二维码，或点击下方选择图片'
    return isDesktop ? 'PC 端可用摄像头对准二维码' : '将二维码放入框内，即可自动扫描'
  }
  return isDesktop ? 'PC 端可用摄像头对准二维码，或点击下方选择图片' : '将二维码放入框内，即可自动扫描'
  // #endif
  // #ifdef MP-WEIXIN
  return '将二维码放入框内，即可自动扫描'
  // #endif
  // #ifndef H5
  // #ifndef MP-WEIXIN
  if (mode === 'camera')
    return '点击下方扫描按钮'
  return '点击下方扫描按钮，或从相册选择图片'
  // #endif
  // #endif
}

const tipText = ref(createDefaultTipText())

/** 多码点选模式 */
const pickerMode = ref(false)
const pickerImage = ref('')
const pickerCodes = ref<DetectedQr[]>([])
const pickerImageSize = ref({ width: 0, height: 0 })
const pickerDisplayRect = ref({ offsetX: 0, offsetY: 0, width: 0, height: 0 })

const scanMode = computed(() => scanState.options.mode ?? 'both')
const isCameraOnly = computed(() => scanMode.value === 'camera')
const strictCameraOnly = computed(() => !!scanState.options.strictCameraOnly)
/** 仅相机 + 未开 strict 时，H5 桌面仍保留相册兜底 */
const allowAlbumInCameraMode = computed(() => {
  if (!isCameraOnly.value || strictCameraOnly.value)
    return false
  // #ifdef H5
  return isDesktop
  // #endif
  return false
})
const isStrictCameraOnly = computed(() => isCameraOnly.value && !allowAlbumInCameraMode.value)

const showAlbum = computed(() => {
  if (pickerMode.value)
    return false
  if (allowAlbumInCameraMode.value)
    return true
  if (isCameraOnly.value)
    return false
  // #ifdef H5
  return scanMode.value === 'both' || scanMode.value === 'image' || isDesktop
  // #endif
  // #ifndef H5
  return scanMode.value === 'both' || scanMode.value === 'image'
  // #endif
})

// #ifdef H5 || MP-WEIXIN
const useCamera = computed(() => {
  const mode = scanState.options.mode ?? 'both'
  return (mode === 'both' || mode === 'camera') && !pickerMode.value
})

let lastMultiScanAt = 0

/** 相机帧解码（H5 / 小程序共用） */
function processCameraPixels(
  pixels: PixelData,
  onMultiple: (codes: DetectedQr[]) => void,
): boolean {
  const now = Date.now()
  if (now - lastMultiScanAt < 400)
    return false

  lastMultiScanAt = now
  const codes = decodeAllQrFromImageData(pixels)
  if (codes.length === 1) {
    handleSuccess(codes[0].result)
    return true
  }
  if (codes.length > 1) {
    onMultiple(codes)
    return true
  }
  return false
}
// #endif

/** 扫描线：H5/小程序随相机模式显示；App 等原生端随 scanning 状态显示 */
const showScanLine = computed(() => {
  if (pickerMode.value)
    return false
  const mode = scanState.options.mode ?? 'both'
  if (mode !== 'both' && mode !== 'camera')
    return false
  // #ifdef H5 || MP-WEIXIN
  return true
  // #endif
  // #ifndef H5
  // #ifndef MP-WEIXIN
  return scanning.value
  // #endif
  // #endif
})

// #ifdef H5
let mediaStream: MediaStream | null = null
let animationId = 0
let scanCanvas: HTMLCanvasElement | null = null

function getScanCanvas() {
  if (!scanCanvas)
    scanCanvas = document.createElement('canvas')
  return scanCanvas
}

function getVideoEl(): HTMLVideoElement | null {
  if (videoRef.value instanceof HTMLVideoElement)
    return videoRef.value

  const el = document.getElementById(SCAN_VIDEO_ID)
  if (el instanceof HTMLVideoElement)
    return el
  return el?.querySelector('video') ?? null
}
// #endif

// #ifdef MP-WEIXIN
let cameraFrameListener: { stop: () => void } | null = null

function stopMpCameraFrame() {
  cameraFrameListener?.stop()
  cameraFrameListener = null
}

function startMpCameraFrame() {
  stopMpCameraFrame()
  lastMultiScanAt = 0
  scanning.value = true
  tipText.value = '将二维码放入框内，即可自动扫描'

  const ctx = uni.createCameraContext()
  const listener = ctx.onCameraFrame((frame) => {
    if (scanned || pickerMode.value)
      return

    const pixels: PixelData = {
      data: new Uint8ClampedArray(frame.data),
      width: frame.width,
      height: frame.height,
    }

    processCameraPixels(pixels, () => {
      stopCamera()
      ctx.takePhoto({
        quality: 'high',
        success: res => decodeImagePath(res.tempImagePath),
        fail: () => uni.showToast({ title: '拍照失败', icon: 'none' }),
      })
    })
  })
  listener.start()
  cameraFrameListener = listener
}

function onMpCameraInit() {
  if (useCamera.value && scanState.visible)
    startMpCameraFrame()
}

function onMpCameraError() {
  scanning.value = false
  tipText.value = isStrictCameraOnly.value
    ? '无法访问摄像头，请检查权限后重试'
    : '无法访问摄像头，请检查权限或从相册选择'
  uni.showToast({ title: '摄像头权限被拒绝', icon: 'none' })
}
// #endif

function stopCamera() {
  // #ifdef H5
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = 0
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  const video = getVideoEl()
  if (video)
    video.srcObject = null
  // #endif
  // #ifdef MP-WEIXIN
  stopMpCameraFrame()
  // #endif
  scanning.value = false
}

let scanned = false

function resetPicker() {
  pickerMode.value = false
  pickerImage.value = ''
  pickerCodes.value = []
  pickerImageSize.value = { width: 0, height: 0 }
  pickerDisplayRect.value = { offsetX: 0, offsetY: 0, width: 0, height: 0 }
}

function handleClose() {
  decodeGeneration++
  decoding.value = false
  stopCamera()
  resetPicker()
  rejectScan(new Error('用户取消扫码'))
}

function onCloseTap() {
  if (pickerMode.value)
    handlePickerBack()
  else
    handleClose()
}

function handleSuccess(result: string) {
  if (scanned)
    return
  scanned = true
  stopCamera()
  resetPicker()
  resolveScan({
    result,
    scanType: 'qrCode',
  })
}

async function enterPickerMode(
  imageUrl: string,
  codes: DetectedQr[],
  imageSize: { width: number; height: number },
) {
  stopCamera()
  decoding.value = false
  pickerMode.value = true
  pickerImage.value = imageUrl
  pickerCodes.value = codes
  pickerImageSize.value = imageSize
  tipText.value = `识别到 ${codes.length} 个二维码，请点击要识别的码`
  await nextTick()
  updatePickerDisplayRect()
}

function handlePickCode(code: DetectedQr) {
  handleSuccess(code.result)
}

function updatePickerDisplayRect() {
  if (!pickerImageSize.value.width)
    return

  // #ifdef H5
  const container = document.getElementById(PICKER_CONTAINER_ID)
  if (!container)
    return
  const rect = container.getBoundingClientRect()
  pickerDisplayRect.value = calcAspectFitRect(
    rect.width,
    rect.height,
    pickerImageSize.value.width,
    pickerImageSize.value.height,
  )
  // #endif

  // #ifndef H5
  const query = uni.createSelectorQuery()
  if (instance)
    query.in(instance)
  query.select(`#${PICKER_CONTAINER_ID}`).boundingClientRect((rect) => {
    if (!rect || Array.isArray(rect))
      return
    pickerDisplayRect.value = calcAspectFitRect(
      rect.width,
      rect.height,
      pickerImageSize.value.width,
      pickerImageSize.value.height,
    )
  }).exec()
  // #endif
}

function getMarkerStyle(bounds: QrBounds) {
  const display = mapBoundsToDisplay(
    bounds,
    pickerImageSize.value.width,
    pickerImageSize.value.height,
    pickerDisplayRect.value,
  )
  return {
    left: `${display.left}px`,
    top: `${display.top}px`,
    width: `${display.width}px`,
    height: `${display.height}px`,
  }
}

function onPickerImageLoad() {
  updatePickerDisplayRect()
}

async function handleDetectResult(
  codes: DetectedQr[],
  imageUrl: string,
  imageSize: { width: number; height: number },
) {
  if (!scanState.visible)
    return

  if (codes.length === 0) {
    uni.showToast({ title: '未识别到二维码', icon: 'none' })
    restoreTipAfterAlbum('未识别到二维码，请重新选择图片')
    resumeCameraAfterAlbum()
    return
  }
  if (codes.length === 1) {
    handleSuccess(codes[0].result)
    return
  }
  await enterPickerMode(imageUrl, codes, imageSize)
}

function handleFrameTap() {
  // #ifndef H5
  // #ifndef MP-WEIXIN
  const mode = scanState.options.mode ?? 'both'
  if (mode !== 'image')
    startNativeScan()
  // #endif
  // #endif
}

// #ifndef H5
// #ifndef MP-WEIXIN
function startNativeScan() {
  uni.scanCode({
    onlyFromCamera: true,
    scanType: scanState.options.scanType ?? ['qrCode', 'barCode'],
    success: (res) => {
      scanned = true
      stopCamera()
      resetPicker()
      resolveScan(res as ScanCodeResult)
    },
    fail: (err) => {
      const msg = err.errMsg || ''
      if (msg.includes('cancel') || msg.includes('取消'))
        rejectScan(new Error('用户取消扫码'))
    },
  })
}
// #endif
// #endif

// #ifdef H5
async function startCamera() {
  if (!isCameraSupported()) {
    cameraFailed.value = true
    tipText.value = isStrictCameraOnly.value
      ? '当前浏览器不支持摄像头'
      : '当前浏览器不支持摄像头，请从相册选择二维码图片'
    return
  }

  scanning.value = true

  try {
    const videoConstraints: MediaTrackConstraints = isDesktop
      ? { width: { ideal: 1280 }, height: { ideal: 720 } }
      : {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    })

    await nextTick()
    const video = getVideoEl()
    if (!video) {
      rejectScan(new Error('视频组件初始化失败'))
      return
    }

    video.srcObject = mediaStream
    await video.play()
    cameraFailed.value = false
    lastMultiScanAt = 0
    scanFrame()
  }
  catch {
    cameraFailed.value = true
    scanning.value = false
    tipText.value = isStrictCameraOnly.value
      ? '无法访问摄像头，请检查权限后重试'
      : isDesktop
        ? '无法访问摄像头，请使用下方「选择图片」模拟扫码'
        : '无法访问摄像头，请检查权限或从相册选择'
    uni.showToast({ title: '摄像头权限被拒绝', icon: 'none' })
  }
}

function scanFrame() {
  const video = getVideoEl()
  const canvas = getScanCanvas()
  if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
    animationId = requestAnimationFrame(scanFrame)
    return
  }

  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) {
    animationId = requestAnimationFrame(scanFrame)
    return
  }

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    animationId = requestAnimationFrame(scanFrame)
    return
  }

  ctx.drawImage(video, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)

  if (processCameraPixels(imageData, (codes) => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    void handleDetectResult(codes, dataUrl, { width, height })
  }))
    return

  animationId = requestAnimationFrame(scanFrame)
}

const DECODE_TIMEOUT_MS = 60000

/** uni-app H5 下 template ref 不是原生 input，需动态创建 */
let h5FilePickerOpening = false

function openH5FilePicker() {
  if (h5FilePickerOpening || decoding.value || pickerMode.value)
    return

  h5FilePickerOpening = true
  void pickImageFileH5().then((file) => {
    h5FilePickerOpening = false
    if (file)
      void decodeImageFile(file)
  })
}

function withDecodeTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('识别超时，请换一张图片重试')), DECODE_TIMEOUT_MS)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

async function decodeImageFile(file: File) {
  const generation = ++decodeGeneration
  stopCamera()
  decoding.value = true
  tipText.value = '正在识别...'
  await nextTick()
  // 让 loading 先渲染，避免大图解码阻塞 UI
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  try {
    const { codes, imageWidth, imageHeight, path } = await withDecodeTimeout(detectAllQrFromFile(file))
    if (generation !== decodeGeneration || !scanState.visible)
      return
    await handleDetectResult(codes, path, { width: imageWidth, height: imageHeight })
  }
  catch (err) {
    if (generation !== decodeGeneration || !scanState.visible)
      return
    const msg = err instanceof Error ? err.message : '图片识别失败'
    uni.showToast({ title: msg, icon: 'none' })
    restoreTipAfterAlbum(`${msg}，请重新选择图片`)
    resumeCameraAfterAlbum()
  }
  finally {
    if (generation === decodeGeneration && !pickerMode.value)
      decoding.value = false
  }
}
// #endif

function handleChooseAlbum() {
  if (decoding.value)
    return

  // #ifdef H5
  openH5FilePicker()
  return
  // #endif

  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: res => decodeImagePath(res.tempFilePaths[0]),
    fail: () => { /* 用户取消选图，保持当前扫码页 */ },
  })
}

async function decodeImagePath(path?: string) {
  if (!path)
    return

  const generation = ++decodeGeneration
  stopCamera()
  decoding.value = true
  tipText.value = '正在识别...'
  await nextTick()
  try {
    const { codes, imageWidth, imageHeight } = await detectAllQrFromPath(path)
    if (generation !== decodeGeneration || !scanState.visible)
      return
    await handleDetectResult(codes, path, { width: imageWidth, height: imageHeight })
  }
  catch {
    if (generation !== decodeGeneration || !scanState.visible)
      return
    uni.showToast({ title: '图片识别失败', icon: 'none' })
    restoreTipAfterAlbum('图片识别失败，请重新选择图片')
    resumeCameraAfterAlbum()
  }
  finally {
    if (generation === decodeGeneration && !pickerMode.value)
      decoding.value = false
  }
}

/** 相册识别结束且未进入点选时，恢复相机预览 */
function resumeCameraAfterAlbum() {
  if (pickerMode.value || !scanState.visible)
    return

  const mode = scanState.options.mode ?? 'both'
  if (mode === 'image')
    return

  // #ifdef H5
  if (useCamera.value && !cameraFailed.value)
    void startCamera()
  // #endif
  // #ifdef MP-WEIXIN
  if (useCamera.value)
    startMpCameraFrame()
  // #endif
}

function applyExternalMultiPick() {
  const pick = scanState.multiPick
  if (!pick)
    return
  void enterPickerMode(pick.imageUrl, pick.codes, {
    width: pick.imageWidth,
    height: pick.imageHeight,
  })
  scanState.multiPick = null
}

/** 消费 scanCodeFromImage 传入的待解码相册资源 */
function consumePendingAlbum() {
  // #ifdef H5
  if (scanState.pendingAlbumFile) {
    const file = scanState.pendingAlbumFile
    scanState.pendingAlbumFile = null
    void decodeImageFile(file)
    return true
  }
  // #endif

  if (scanState.pendingAlbumPath) {
    const path = scanState.pendingAlbumPath
    scanState.pendingAlbumPath = null
    void decodeImagePath(path)
    return true
  }

  return false
}

function handlePickerBack() {
  resetPicker()
  restoreTipAfterAlbum()

  const mode = scanState.options.mode ?? 'both'
  if (mode === 'image') {
    tipText.value = '请点击下方「相册」重新选择'
    return
  }
  // #ifdef H5
  if (useCamera.value && !cameraFailed.value)
    startCamera()
  // #endif
  // #ifdef MP-WEIXIN
  if (useCamera.value)
    startMpCameraFrame()
  // #endif
}

function resetTipText() {
  tipText.value = createDefaultTipText()
}

function restoreTipAfterAlbum(errorMsg?: string) {
  if (errorMsg) {
    tipText.value = errorMsg
    return
  }
  // #ifdef H5
  if (cameraFailed.value) {
    tipText.value = isStrictCameraOnly.value
      ? '无法访问摄像头，请检查权限后重试'
      : isDesktop
        ? '无法访问摄像头，请使用下方「选择图片」'
        : '无法访问摄像头，请点击下方「相册」选择图片'
    return
  }
  // #endif
  resetTipText()
}

watch(
  () => scanState.visible,
  async (visible) => {
    const watchGen = ++visibleWatchGeneration
    if (visible) {
      scanned = false
      decoding.value = false
      resetPicker()
      scanning.value = false
      resetTipText()
      // #ifdef H5
      cameraFailed.value = false
      // #endif

      // 外部相册选图：须先于 decodeGeneration++，否则 decodeImageFile 结果会被代次校验丢弃
      if (consumePendingAlbum())
        return

      decodeGeneration++
      await nextTick()
      if (watchGen !== visibleWatchGeneration)
        return

      if (scanState.multiPick) {
        applyExternalMultiPick()
        return
      }

      const mode = scanState.options.mode ?? 'both'
      // 仅相册模式：scanCodeFromImage 已在选图后直接解码，不再自动弹文件选择器
      if (mode === 'image') {
        await nextTick()
        if (watchGen !== visibleWatchGeneration)
          return
        if (consumePendingAlbum())
          return
        tipText.value = '请点击下方「相册」选择图片'
        return
      }

      // #ifdef H5
      if (useCamera.value)
        startCamera()
      // #endif

      // #ifndef H5
      // #ifndef MP-WEIXIN
      if (mode === 'camera')
        startNativeScan()
      // #endif
      // #endif
    }
    else {
      stopCamera()
      resetPicker()
    }
  },
  { immediate: true },
)

watch(
  () => scanState.multiPick,
  (pick) => {
    if (pick && scanState.visible)
      applyExternalMultiPick()
  },
)

onMounted(() => {
  // #ifdef H5
  window.addEventListener('resize', updatePickerDisplayRect)
  // #endif
})

onBeforeUnmount(() => {
  // #ifdef H5
  window.removeEventListener('resize', updatePickerDisplayRect)
  // #endif
  stopCamera()
})
</script>

<template>
  <view v-if="scanState.visible" class="scan-code">
    <!-- #ifdef H5 -->
    <video
      v-show="!pickerMode && !decoding && scanning"
      :id="SCAN_VIDEO_ID"
      ref="videoRef"
      class="scan-code__video"
      autoplay
      playsinline
      muted
    />
    <!-- #endif -->

    <!-- #ifdef MP-WEIXIN -->
    <camera
      v-if="useCamera"
      v-show="!pickerMode"
      class="scan-code__video"
      device-position="back"
      flash="auto"
      frame-size="medium"
      @initdone="onMpCameraInit"
      @error="onMpCameraError"
    />
    <!-- #endif -->

    <!-- 多码点选模式 -->
    <view v-if="pickerMode" :id="PICKER_CONTAINER_ID" class="scan-code__picker">
      <!-- #ifdef H5 -->
      <img
        :src="pickerImage"
        class="scan-code__picker-img"
        @load="onPickerImageLoad"
      >
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <image
        :src="pickerImage"
        class="scan-code__picker-img"
        mode="aspectFit"
        @load="onPickerImageLoad"
      />
      <!-- #endif -->
      <view class="scan-code__picker-markers">
        <!-- #ifdef H5 -->
        <view
          v-for="(code, index) in pickerCodes"
          :key="index"
          class="scan-code__marker"
          :style="getMarkerStyle(code.bounds)"
          @click.stop="handlePickCode(code)"
        >
          <view class="scan-code__marker-corner scan-code__marker-corner--tl" />
          <view class="scan-code__marker-corner scan-code__marker-corner--tr" />
          <view class="scan-code__marker-corner scan-code__marker-corner--bl" />
          <view class="scan-code__marker-corner scan-code__marker-corner--br" />
          <view class="scan-code__marker-badge">
            <text class="scan-code__marker-index">
              {{ index + 1 }}
            </text>
          </view>
        </view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view
          v-for="(code, index) in pickerCodes"
          :key="index"
          class="scan-code__marker"
          :style="getMarkerStyle(code.bounds)"
          @tap="handlePickCode(code)"
        >
          <view class="scan-code__marker-corner scan-code__marker-corner--tl" />
          <view class="scan-code__marker-corner scan-code__marker-corner--tr" />
          <view class="scan-code__marker-corner scan-code__marker-corner--bl" />
          <view class="scan-code__marker-corner scan-code__marker-corner--br" />
          <view class="scan-code__marker-badge">
            <text class="scan-code__marker-index">
              {{ index + 1 }}
            </text>
          </view>
        </view>
        <!-- #endif -->
      </view>
    </view>

    <view class="scan-code__mask" :class="{ 'scan-code__mask--picker': pickerMode }">
      <view class="scan-code__header">
        <!-- #ifdef H5 -->
        <view class="scan-code__close" @click.stop="onCloseTap">
          <text class="scan-code__close-icon">
            {{ pickerMode ? '‹' : '×' }}
          </text>
        </view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="scan-code__close" @tap="onCloseTap">
          <text class="scan-code__close-icon">
            {{ pickerMode ? '‹' : '×' }}
          </text>
        </view>
        <!-- #endif -->
        <text class="scan-code__title">
          {{ pickerMode ? '选择二维码' : '扫一扫' }}
        </text>
      </view>

      <!-- 相机扫描框 -->
      <view v-if="!pickerMode" class="scan-code__frame-wrap">
        <!-- #ifndef H5 -->
        <!-- #ifndef MP-WEIXIN -->
        <view class="scan-code__native-bg" />
        <!-- #endif -->
        <!-- #endif -->
        <view class="scan-code__frame" @tap="handleFrameTap">
          <view class="scan-code__corner scan-code__corner--tl" />
          <view class="scan-code__corner scan-code__corner--tr" />
          <view class="scan-code__corner scan-code__corner--bl" />
          <view class="scan-code__corner scan-code__corner--br" />
          <view v-if="showScanLine && !decoding" class="scan-code__line" />
          <!-- #ifndef H5 -->
          <!-- #ifndef MP-WEIXIN -->
          <view v-if="scanState.options.mode !== 'camera'" class="scan-code__native-hint">
            <text class="scan-code__native-hint-text">
              点击扫描
            </text>
          </view>
          <!-- #endif -->
          <!-- #endif -->
        </view>
        <text class="scan-code__tip">
          {{ tipText }}
        </text>
      </view>

      <!-- 多码点选提示 -->
      <view v-if="pickerMode" class="scan-code__picker-tip-wrap">
        <text class="scan-code__tip">
          {{ tipText }}
        </text>
      </view>

      <!-- 识别中遮罩 -->
      <view v-if="decoding" class="scan-code__decoding">
        <view class="scan-code__decoding-spinner" />
        <text class="scan-code__decoding-text">
          正在识别...
        </text>
      </view>

      <view v-if="showAlbum && !decoding" class="scan-code__footer">
        <!-- #ifdef H5 -->
        <view class="scan-code__album" @click.stop="openH5FilePicker">
          <text class="scan-code__album-text">
            {{ isDesktop ? '选择图片' : '相册' }}
          </text>
        </view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view class="scan-code__album" @tap="handleChooseAlbum">
          <text class="scan-code__album-text">
            相册
          </text>
        </view>
        <!-- #endif -->
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.scan-code {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;

  &__album {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120rpx;
    height: 120rpx;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    cursor: pointer;
  }

  &__decoding {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
    pointer-events: none;
  }

  &__decoding-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(255, 255, 255, 0.25);
    border-top-color: #07c160;
    border-radius: 50%;
    animation: scan-spin 0.8s linear infinite;
  }

  &__decoding-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
  }

  &__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__native-bg {
    position: absolute;
    inset: 0;
    background: #111;
  }

  &__picker {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__picker-img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__picker-markers {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__marker {
    position: absolute;
    pointer-events: auto;
    border: 2px solid rgba(7, 193, 96, 0.6);
    background: rgba(7, 193, 96, 0.08);
    transition: background 0.15s, border-color 0.15s;

    &:active {
      background: rgba(7, 193, 96, 0.25);
      border-color: #07c160;
    }
  }

  &__marker-corner {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 3px solid #07c160;

    &--tl {
      top: -2px;
      left: -2px;
      border-right: none;
      border-bottom: none;
    }

    &--tr {
      top: -2px;
      right: -2px;
      border-left: none;
      border-bottom: none;
    }

    &--bl {
      bottom: -2px;
      left: -2px;
      border-top: none;
      border-right: none;
    }

    &--br {
      right: -2px;
      bottom: -2px;
      border-top: none;
      border-left: none;
    }
  }

  &__marker-badge {
    position: absolute;
    top: -14px;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #07c160;
    border-radius: 50%;
    transform: translateX(-50%);
  }

  &__marker-index {
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    color: #fff;
  }

  &__picker-tip-wrap {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 48rpx;
    pointer-events: none;
  }

  &__mask {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.35);
    pointer-events: none;

    > .scan-code__header,
    > .scan-code__frame-wrap,
    > .scan-code__picker-tip-wrap,
    > .scan-code__decoding,
    > .scan-code__footer {
      pointer-events: auto;
    }

    &--picker {
      background: transparent;

      > .scan-code__header,
      > .scan-code__frame-wrap,
      > .scan-code__picker-tip-wrap,
      > .scan-code__decoding,
      > .scan-code__footer {
        pointer-events: none;
      }

      > .scan-code__header,
      > .scan-code__footer {
        pointer-events: auto;
      }
    }
  }

  &__header {
    position: relative;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 88rpx;
    padding-top: env(safe-area-inset-top);
  }

  &__close {
    position: absolute;
    left: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64rpx;
    height: 64rpx;
  }

  &__close-icon {
    font-size: 56rpx;
    line-height: 1;
    color: #fff;
  }

  &__title {
    font-size: 34rpx;
    font-weight: 500;
    color: #fff;
  }

  &__frame-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__frame {
    position: relative;
    width: 520rpx;
    height: 520rpx;
    overflow: hidden;
    background: transparent;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
  }

  &__native-hint {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__native-hint-text {
    padding: 16rpx 40rpx;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    background: rgba(0, 0, 0, 0.35);
    border-radius: 40rpx;
  }

  &__corner {
    position: absolute;
    width: 48rpx;
    height: 48rpx;
    border: 6rpx solid #07c160;

    &--tl {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }

    &--tr {
      top: 0;
      right: 0;
      border-left: none;
      border-bottom: none;
    }

    &--bl {
      bottom: 0;
      left: 0;
      border-top: none;
      border-right: none;
    }

    &--br {
      right: 0;
      bottom: 0;
      border-top: none;
      border-left: none;
    }
  }

  &__line {
    position: absolute;
    z-index: 2;
    left: 3%;
    right: 3%;
    top: 3%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #07c160, transparent);
    animation: scan-line 2s linear infinite;
  }

  &__tip {
    margin-top: 40rpx;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.85);
  }

  &__picker-tip-wrap &__tip {
    margin-top: 0;
  }

  &__footer {
    position: relative;
    z-index: 20;
    display: flex;
    justify-content: center;
    padding: 48rpx 0 calc(48rpx + env(safe-area-inset-bottom));
  }

  &__album-text {
    font-size: 26rpx;
    color: #fff;
  }
}

@keyframes scan-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes scan-line {
  0% {
    top: 3%;
  }

  100% {
    top: calc(97% - 2px);
  }
}
</style>
