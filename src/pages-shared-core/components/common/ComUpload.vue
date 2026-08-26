<template>
  <view>
    <wd-upload
      v-model:file-list="previewList" :accept="accept" :source-type="['camera', 'album']"
      :custom-evoke-class="{ 'opacity-0': disabled }" :capture="['camera', 'album']" :multiple="multiple"
      :before-preview="beforePreview" :disabled="disabled" :limit="disabled ? 1 : limit" :before-upload="beforeUpload"
      :upload-method="customUpload"
    >
      <template #default>
        <view class="bg-[#f5f5f5] w-15 h-15 flex flex-col items-center justify-center">
          <wd-icon :name="accept == 'all' ? 'file' : 'camera-fill'" size="24px" color="#b8b8b8" />
          <view class="mt-2 text-sm text-[#b8b8b8]">
            ({{ previewList.length ?? 0 }}/{{ limit }})
          </view>
        </view>
      </template>
    </wd-upload>
    <wd-root-portal>
      <wd-img-cropper
        v-model="cropperShow" style="z-index: 10000" :img-src="cropperSrc" :aspect-ratio="aspectRatio"
        @confirm="handleConfirmUpload" @cancel="handleCancel"
      />
    </wd-root-portal>
    <!-- 小程序 PNG→JPG 旧版 canvas 兜底（PC/Mac 常无 OffscreenCanvas） -->
    <!-- #ifndef H5 -->
    <canvas
      :canvas-id="legacyCanvasId"
      :id="legacyCanvasId"
      class="compress-legacy-canvas"
      :style="{ width: legacyCanvas.w + 'px', height: legacyCanvas.h + 'px' }"
      :width="legacyCanvas.w"
      :height="legacyCanvas.h"
    />
    <!-- #endif -->
  </view>
</template>

<script setup>
import {
  COMPRESS_LEGACY_CANVAS_ID,
  compressSingle,
  registerCompressLegacyCanvas,
  unregisterCompressLegacyCanvas,
} from '@/pages-shared-core/utils/compress.js'

defineOptions({
  inheritAttrs: false,
})
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  accept: {
    type: String,
    default: 'image',
  },
  limit: {
    type: [Number, String],
    default: 9,
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  maxSize: {
    type: Number,
    default: 30,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  // 是否压缩
  compress: {
    type: Boolean,
    default: false,
  },
  // 是否裁减
  cropper: {
    type: Boolean,
    default: false,
  },
  // 裁减比例
  aspectRatio: {
    type: String,
    default: '16:9',
  },
})
const emit = defineEmits(['update:modelValue', 'change'])
const router = useRouter()
let upUrl = `${apiPrefix}/system/sys/file/upload`
// #ifndef H5
upUrl = baseUrl + upUrl
// #endif

const userStore = useUserStore()

const legacyCanvas = reactive({ w: 100, h: 100 })
const instance = getCurrentInstance()
const legacyCanvasId = `${COMPRESS_LEGACY_CANVAS_ID}_${instance?.uid ?? Math.random().toString(36).slice(2, 8)}`
let legacyApi = null

// #ifndef H5
onMounted(() => {
  legacyApi = {
    component: instance?.proxy,
    canvasId: legacyCanvasId,
    setSize(w, h) {
      legacyCanvas.w = Math.max(1, w)
      legacyCanvas.h = Math.max(1, h)
    },
  }
  registerCompressLegacyCanvas(legacyApi)
})
onUnmounted(() => {
  unregisterCompressLegacyCanvas(legacyApi)
  legacyApi = null
})
// #endif

const acceptTypes = computed(() => {
  return props.accept === 'image' ? ['jpg', 'jpeg', 'png', 'heif', 'heic', 'jfif'] : []
})

const previewList = computed({
  get() {
    if (!props.modelValue || (props.modelValue && Object.keys(props.modelValue).length == 0))
      return []
    return (Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]).map((item) => {
      const fileId = item.fileId || item.filePath || item.fileUrl || item.url || item.id
      const filePath = item.filePath || fileId || item.fileUrl
      const fileUrl = item.fileUrl || filePath || fileId
      return {
        ...item,
        name: item.name || item.fileName,
        fileName: item.fileName || item.name,
        fileId,
        filePath,
        fileUrl,
        url: formatUrl(fileId),
      }
    }).filter(v => (v.status && v.status !== 'fail') || !v.status)
  },
  set(val) {
    const vals = val?.filter(v => (v.status && v.status !== 'fail') || !v.status)
    const value = props.limit == 1 ? vals[0] : vals
    emit('update:modelValue', value)
    emit('change', value)
  },
})

function beforePreview({ file, resolve }) {
  const isVideo = file.fileName?.toLowerCase()?.match(/\.(mp4)$/)
  const isImage = acceptTypes.value.length ? acceptTypes.value.includes(file.name?.slice(file.name.lastIndexOf('.') + 1)?.toLowerCase()) : file.name?.toLowerCase().match(/\.(jpg|jpeg|png|heif|heic|jfif)$/)
  if (isImage || isVideo) {
    resolve(true)
  }
  else {
    new Download(file.url, file.name, false)
    resolve(false)
  }
}

function beforeUpload({ files }) {
  if (files.length + (props.modelValue?.length || 0) > props.limit) {
    uni.$toast.show(`最多上传${props.limit}张!`)
    return false
  }
  if (acceptTypes.value.length) {
    const correct = files.every((item) => {
      const suffix = item.name ? item.name.slice(item.name.lastIndexOf('.') + 1) : item.path ? item.path.slice(item.path.lastIndexOf('.') + 1) : item.url.slice(item.url.lastIndexOf('.') + 1)
      return acceptTypes.value.includes(suffix?.toLowerCase())
    })
    if (!correct) {
      uni.$toast.show('文件格式不正确!')
      return false
    }
  }
  const lt = files.every(item => item.size / 1024 / 1024 <= props.maxSize)
  if (!lt) {
    uni.$toast.show(`上传文件不能超过 ${props.maxSize} MB!`)
    return false
  }
  if (props.cropper) {
    cropperSrc.value = files[0].path
    cropperShow.value = true
    return false
  }
  return true
}

async function customUpload(file, formData, options) {
  let compressed = null
  if (props.accept === 'image') {
    compressed = await compressSingle(file, {
      ...(props.compress ? { quality: 20, targetKB: 100, qualityMin: 0.2 } : { quality: 40, targetKB: 300 }),
      canvasComponent: instance?.proxy,
    })
  }
  // H5 压缩后有 File 对象时传 file，小程序/APP 传 filePath（uni.uploadFile 官方支持）
  // 注意：小程序无 File 全局对象，不能直接 instanceof File
  const fileObj = compressed?.file || file.file
  const useFileObj = typeof File !== 'undefined' && fileObj instanceof File
  const uploadConfig = {
    url: upUrl,
    header: {
      Authorization: userStore.userInfo?.token,
      platformType,
    },
    name: 'file',
    formData: {
      uploadSource: '1',
    },
    ...(useFileObj ? { file: fileObj } : { filePath: compressed?.url || file.url || file.path }),
  }
  const handleSuccess = (res) => {
    // res 结构：{ statusCode, data }
    let response
    try {
      response = typeof res.data === 'string' ? JSON.parse(res.data) : (res.data || {})
    }
    catch (e) {
      response = { data: null, code: res.statusCode }
    }
    const { data, code } = response || {}
    if (res.statusCode === 200 && code === 200) {
      // 设置上传成功
      file.fileId = data.id
      file.name = data.fileName
      file.fileName = data.fileName
      file.filePath = data.id
      if (props.cropper) {
        previewList.value.push(file)
        const value = props.limit == 1 ? previewList.value[0] : previewList.value
        emit('update:modelValue', value)
        emit('change', value)
        return
      }
      options?.onSuccess(data, file, formData)
    }
    else {
      const message = code == 401 ? '登录已过期,请重新登录' : response?.message || '上传失败'
      if (uni.$notify?.showNotify) {
        uni.$notify.showNotify({
          type: 'danger',
          message,
          safeHeight: uni.getSystemInfoSync().statusBarHeight,
        })
      }
      else {
        uni.showToast({ title: message, icon: 'none' })
      }
      // 设置上传失败
      options?.onError({ ...res, errMsg: res.errMsg || '' }, file, formData)
      if (code === 401)
        router.replace('/pages/login/index')
    }
  }

  const handleFail = (err) => {
    options?.onError(err, file, formData)
  }

  const uploadTask = uni.uploadFile({
    ...uploadConfig,
    success(res) { handleSuccess(res) },
    fail(err) { handleFail(err) },
  })

  // 设置当前文件加载的百分比
  uploadTask && uploadTask.onProgressUpdate && uploadTask.onProgressUpdate((res) => {
    options?.onProgress?.(res, file)
  })
}

const cropperShow = ref(false)
const cropperSrc = ref('')
function handleConfirmUpload(e) {
  customUpload({ url: e.tempFilePath }, {}, { name: 'file' })
}
function handleCancel() {
  cropperShow.value = false
}
</script>

<style lang="scss" scoped>
.compress-legacy-canvas {
  position: fixed;
  left: -9999px;
  top: 0;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
</style>
