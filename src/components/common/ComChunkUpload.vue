<template>
  <view class="com-chunk-upload">
    <view v-if="showOverallProgress && (internalList.length || activeQueue.length)" class="com-chunk-upload__overall">
      <view class="com-chunk-upload__overall-head">
        <text class="com-chunk-upload__overall-text">
          总进度 {{ overallProgress }}%
        </text>
        <view class="com-chunk-upload__overall-actions">
          <wd-button
            v-if="!autoUpload && hasPending"
            size="small"
            type="primary"
            plain
            @click="startAll"
          >
            全部上传
          </wd-button>
          <wd-button
            v-if="hasUploading"
            size="small"
            plain
            @click="pauseAll"
          >
            暂停
          </wd-button>
          <wd-button
            v-if="hasResumable"
            size="small"
            type="primary"
            plain
            @click="resumeAll"
          >
            继续全部
          </wd-button>
        </view>
      </view>
      <wd-progress :percentage="overallProgress" :show-percent="false" />
    </view>

    <wd-upload
      v-model:file-list="internalList"
      :accept="accept"
      :source-type="sourceType"
      :capture="capture"
      :multiple="multiple"
      :disabled="disabled"
      :limit="disabled ? 0 : limit"
      :before-upload="handleBeforeUpload"
      :before-preview="handleBeforePreview"
      :upload-method="handleCustomUpload"
      :custom-evoke-class="{ 'opacity-0': disabled }"
    >
      <template #default>
        <view class="com-chunk-upload__trigger">
          <wd-icon :name="accept === 'all' ? 'file' : 'camera-fill'" size="24px" color="#b8b8b8" />
          <view class="com-chunk-upload__trigger-count">
            ({{ successCount }}/{{ limit }})
          </view>
        </view>
      </template>
    </wd-upload>

    <view
      v-for="item in activeQueue"
      :key="item.uid"
      class="com-chunk-upload__item"
    >
      <view class="com-chunk-upload__item-head">
        <text class="com-chunk-upload__item-name">{{ item.name }}</text>
        <text class="com-chunk-upload__item-size">{{ formatSize(item.size) }}</text>
      </view>
      <wd-progress :percentage="item.progress" />
      <view class="com-chunk-upload__item-foot">
        <text class="com-chunk-upload__item-status">{{ statusText(item) }}</text>
        <view class="com-chunk-upload__item-actions">
          <wd-button
            v-if="item.status === 'uploading' || item.status === 'hashing'"
            size="small"
            plain
            @click="pauseFile(item.uid)"
          >
            暂停
          </wd-button>
          <wd-button
            v-if="item.status === 'paused'"
            size="small"
            type="primary"
            plain
            @click="resumeFile(item.uid)"
          >
            继续
          </wd-button>
          <wd-button
            v-if="item.status === 'error'"
            size="small"
            type="warning"
            plain
            @click="retryFile(item.uid)"
          >
            重试
          </wd-button>
          <wd-button
            v-if="item.status !== 'success'"
            size="small"
            type="error"
            plain
            @click="handleCancelFile(item.uid)"
          >
            取消
          </wd-button>
          <wd-button
            v-if="!autoUpload && item.status === 'waiting'"
            size="small"
            type="primary"
            plain
            @click="startUpload(item.uid)"
          >
            上传
          </wd-button>
        </view>
      </view>
      <text v-if="item.error" class="com-chunk-upload__item-error">{{ resolveErrorMessage(item.error) }}</text>
    </view>

    <view v-if="cachedTasks.length" class="com-chunk-upload__cache">
      <view class="com-chunk-upload__cache-title">
        检测到未完成的上传任务（本地缓存）
      </view>
      <view
        v-for="cache in cachedTasks"
        :key="cache.hash"
        class="com-chunk-upload__cache-item"
      >
        <view class="com-chunk-upload__cache-info">
          <text>{{ cache.fileName }}</text>
          <text class="com-chunk-upload__cache-meta">
            已上传 {{ cache.uploadedChunks?.length || 0 }} 个分片
          </text>
        </view>
        <view class="com-chunk-upload__cache-actions">
          <wd-button size="small" type="primary" plain @click="resumeCachedTask(cache.hash)">
            继续
          </wd-button>
          <wd-button size="small" plain @click="dismissCache(cache.hash)">
            取消
          </wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  modelValue: {
    type: [Array, Object],
    default: () => [],
  },
  accept: {
    type: String,
    default: 'all',
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
    default: 500,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  chunkSize: {
    type: Number,
    default: 2 * 1024 * 1024,
  },
  maxRetry: {
    type: Number,
    default: 3,
  },
  concurrent: {
    type: Number,
    default: 1,
  },
  autoUpload: {
    type: Boolean,
    default: true,
  },
  /** 会话 ID，配合 persistOnNavigate 可在页面切换后继续上传 */
  sessionId: {
    type: String,
    default: '',
  },
  persistOnNavigate: {
    type: Boolean,
    default: false,
  },
  /** 持久化队列与文件（断电/重启后可恢复），建议配合 sessionId */
  persistQueue: {
    type: Boolean,
    default: false,
  },
  /** 回到页面时自动继续上传（默认 false，需手动点「继续」） */
  autoResumeOnShow: {
    type: Boolean,
    default: false,
  },
  showOverallProgress: {
    type: Boolean,
    default: true,
  },
  sourceType: {
    type: Array,
    default: () => ['camera', 'album'],
  },
  capture: {
    type: Array,
    default: () => ['camera', 'album'],
  },
  apiBase: {
    type: String,
    default: '',
  },
  endpoints: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'progress', 'success', 'error'])

const acceptTypes = computed(() => {
  if (props.accept === 'image')
    return ['jpg', 'jpeg', 'png', 'heif', 'heic', 'jfif', 'gif', 'webp']
  if (props.accept === 'video')
    return ['mp4', 'mov', 'avi', 'mkv']
  return []
})

const {
  queue,
  cachedTasks,
  overallProgress,
  hasUploading,
  hasPaused,
  hasError,
  hasPending,
  hasResumable,
  addFiles,
  removeFile,
  cancelFile,
  startUpload,
  startAll,
  pauseFile,
  resumeFile,
  retryFile,
  pauseAll,
  resumeAll,
  resumeCachedTask,
  dismissCache,
  refreshCachedTasks,
  restoreQueue,
  getSuccessValue,
} = useChunkUpload({
  chunkSize: props.chunkSize,
  maxRetry: props.maxRetry,
  concurrent: props.concurrent,
  autoUpload: props.autoUpload,
  sessionId: props.sessionId || undefined,
  persistOnNavigate: props.persistOnNavigate || !!props.sessionId,
  persistQueue: props.persistQueue || !!props.sessionId,
  apiBase: props.apiBase || undefined,
  endpoints: props.endpoints,
  onProgress: (item, progress, total) => {
    emit('progress', { item, progress, total })
  },
  onSuccess: (item, data) => {
    syncModelValue()
    emit('success', { item, data })
  },
  onError: (item, error) => {
    emit('error', { item, error })
  },
})

const uidMap = new Map()
const uploadWatchers = new Map()

async function handleCancelFile(uid) {
  notifyUploadCanceled(uid)
  await cancelFile(uid)
}

const activeQueue = computed(() =>
  queue.value.filter(item => item.status !== 'success'),
)

const successCount = computed(() =>
  queue.value.filter(item => item.status === 'success').length,
)

const internalList = computed({
  get() {
    const source = props.modelValue
    if (!source || (typeof source === 'object' && !Array.isArray(source) && Object.keys(source).length === 0))
      return []
    const list = Array.isArray(source) ? source : [source]
    return list.map((item) => {
      const normalized = {
        ...item,
        name: item.name || item.fileName,
        fileName: item.fileName || item.name,
        fileId: item.fileId || item.filePath || item.id,
        filePath: item.filePath || item.fileId,
        url: item.url || formatUrl(item.fileId || item.filePath, '', /\.(mp4)$/i.test(item.fileName || item.name || '')),
        status: item.status || 'success',
        percent: item.percent ?? 100,
      }
      return normalized
    }).filter(v => v.status !== 'fail')
  },
  set(val) {
    const removed = internalList.value.filter(old =>
      !val.some(v => (v.uid && v.uid === old.uid) || (v.fileId && v.fileId === old.fileId)),
    )
    removed.forEach((item) => {
      const uid = item.uid || uidMap.get(item.fileId || item.url)
      if (uid)
        removeFile(uid)
    })
    syncModelValue(val.filter(v => v.status === 'success' || v.percent === 100 || v.fileId))
  },
})

onMounted(async () => {
  await handlePageShow()
  // #ifdef H5
  document.addEventListener('visibilitychange', handleVisibilityChange)
  // #endif
})

onShow(async () => {
  await handlePageShow()
})

onHide(() => {
  pauseAll()
})

// #ifdef H5
function handleVisibilityChange() {
  if (document.hidden)
    pauseAll()
  else
    handlePageShow()
}

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
// #endif

async function handlePageShow() {
  await restoreQueue()
  refreshCachedTasks()
  if (queue.value.some(item => item.status === 'success'))
    syncModelValue()
  if (props.autoResumeOnShow && hasResumable.value)
    resumeAll()
}

function syncModelValue(fallbackList) {
  const value = getSuccessValue(Number(props.limit) === 1 ? 1 : 0)
  const next = Number(props.limit) === 1 ? (value || null) : value
  emit('update:modelValue', next)
  emit('change', next)
}

function formatSize(size) {
  if (!size)
    return '0B'
  if (size < 1024)
    return `${size}B`
  if (size < 1024 * 1024)
    return `${(size / 1024).toFixed(1)}KB`
  if (size < 1024 * 1024 * 1024)
    return `${(size / 1024 / 1024).toFixed(1)}MB`
  return `${(size / 1024 / 1024 / 1024).toFixed(1)}GB`
}

function statusText(item) {
  const map = {
    waiting: '等待中',
    hashing: '校验中',
    uploading: '上传中',
    paused: '已暂停',
    success: '已完成',
    error: '上传失败',
  }
  const base = map[item.status] || item.status
  if (item.progress > 0 && item.status !== 'success')
    return `${base} ${item.progress}%`
  return base
}

function resolveErrorMessage(error) {
  if (error === 'fileExpired')
    return '文件已失效，请取消后重新选择同一文件可续传'
  return error
}

function handleBeforeUpload({ files, fileList }) {
  const currentCount = Math.max(
    fileList?.length || 0,
    internalList.value.length,
    queue.value.filter(item => item.status !== 'success').length,
    successCount.value,
  )
  if (files.length + currentCount > Number(props.limit)) {
    uni.$toast.show(`最多上传 ${props.limit} 个文件`)
    return false
  }

  if (acceptTypes.value.length) {
    const valid = files.every((item) => {
      const suffix = getFileSuffix(item)
      return acceptTypes.value.includes(suffix)
    })
    if (!valid) {
      uni.$toast.show('文件格式不正确')
      return false
    }
  }

  const validSize = files.every(item => (item.size || 0) / 1024 / 1024 <= props.maxSize)
  if (!validSize) {
    uni.$toast.show(`文件不能超过 ${props.maxSize} MB`)
    return false
  }

  return true
}

function getFileSuffix(item) {
  const name = item.name || item.path || item.url || ''
  return name.slice(name.lastIndexOf('.') + 1).toLowerCase()
}

function handleBeforePreview({ file, resolve }) {
  const suffix = getFileSuffix(file)
  const isMedia = /\.(jpg|jpeg|png|gif|webp|heif|heic|jfif|mp4|mov)$/i.test(`.${suffix}`)
  if (isMedia) {
    resolve(true)
    return
  }
  new Download(file.url, file.name, false)
  resolve(false)
}

async function handleCustomUpload(file, formData, options) {
  const list = await addFiles([file])
  const queueItem = list[0]
  if (!queueItem)
    return

  uidMap.set(file.uid || queueItem.uid, queueItem.uid)
  options?.onProgress?.({ progress: queueItem.progress || 0 }, file, formData)

  const stopWatch = watch(
    () => queue.value.find(v => v.uid === queueItem.uid),
    (item) => {
      if (!item)
        return
      options?.onProgress?.({ progress: item.progress }, file, formData)
      if (item.status === 'success') {
        file.fileId = item.fileId
        file.fileName = item.fileName
        file.filePath = item.filePath
        file.name = item.fileName
        file.url = formatUrl(item.fileId, '', /\.(mp4)$/i.test(item.fileName || ''))
        options?.onSuccess?.({ id: item.fileId, fileName: item.fileName }, file, formData)
        stopWatch()
        uploadWatchers.delete(queueItem.uid)
      }
      if (item.status === 'error') {
        options?.onError?.({ errMsg: resolveErrorMessage(item.error) || 'upload failed' }, file, formData)
        stopWatch()
        uploadWatchers.delete(queueItem.uid)
      }
    },
    { deep: true },
  )
  uploadWatchers.set(queueItem.uid, { stop: stopWatch, file, formData, options })
}

function notifyUploadCanceled(uid) {
  const watcher = uploadWatchers.get(uid)
  if (!watcher)
    return
  watcher.stop?.()
  watcher.options?.onError?.({ errMsg: '已取消' }, watcher.file, watcher.formData)
  uploadWatchers.delete(uid)
}

defineExpose({
  startAll,
  startUpload,
  cancelFile: handleCancelFile,
  removeFile: handleCancelFile,
  pauseAll,
  resumeAll,
  resumeCachedTask,
  hasPending,
  hasResumable,
  hasUploading,
  queue,
  getSuccessValue,
})
</script>

<style lang="scss" scoped>
.com-chunk-upload {
  width: 100%;

  &__overall {
    margin-bottom: 16rpx;
    padding: 16rpx 20rpx;
    background: #f7f8fa;
    border-radius: 12rpx;
  }

  &__overall-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
  }

  &__overall-text {
    font-size: 24rpx;
    color: #4e5969;
  }

  &__overall-actions {
    display: flex;
    gap: 12rpx;
  }

  &__trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 120rpx;
    height: 120rpx;
    background: #f5f5f5;
  }

  &__trigger-count {
    margin-top: 8rpx;
    font-size: 24rpx;
    color: #b8b8b8;
  }

  &__item {
    margin-top: 16rpx;
    padding: 16rpx 20rpx;
    background: #fafafa;
    border-radius: 12rpx;
  }

  &__item-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8rpx;
  }

  &__item-name {
    flex: 1;
    overflow: hidden;
    font-size: 26rpx;
    color: #1d2129;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-size {
    margin-left: 16rpx;
    font-size: 22rpx;
    color: #86909c;
  }

  &__item-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8rpx;
  }

  &__item-status {
    font-size: 22rpx;
    color: #86909c;
  }

  &__item-actions {
    display: flex;
    gap: 8rpx;
  }

  &__item-error {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #f53f3f;
  }

  &__cache {
    margin-top: 20rpx;
    padding: 16rpx 20rpx;
    background: #fff7e8;
    border-radius: 12rpx;
  }

  &__cache-title {
    margin-bottom: 12rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #ff7d00;
  }

  &__cache-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12rpx 0;

    & + & {
      border-top: 1px solid rgba(255, 125, 0, 0.15);
    }
  }

  &__cache-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8rpx;
    margin-left: 12rpx;
  }

  &__cache-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    font-size: 24rpx;
    color: #1d2129;
  }

  &__cache-meta {
    margin-top: 4rpx;
    font-size: 22rpx;
    color: #86909c;
  }
}
</style>
