import {
  CHUNK_STATUS,
  ChunkUploader,
  computeProgressFromCache,
  createFileUid,
  getChunkApiBase,
  hydrateFileItem,
  listUploadCaches,
  loadQueueSession,
  loadUploadCache,
  persistFile,
  removePersistedFile,
  removeQueueSession,
  removeUploadCache,
  saveQueueSession,
  verifyFileAccessible,
} from '@/utils/chunkUpload'

const DEFAULT_ENDPOINTS = {
  init: '/init',
  chunk: '/upload',
  check: '/check',
  merge: '/merge',
}

/** 跨页面 / 断电恢复：内存会话 */
const sessionStore = new Map()

const INTERRUPTED_STATUSES = new Set([
  CHUNK_STATUS.UPLOADING,
  CHUNK_STATUS.HASHING,
])

function normalizeFileItem(raw) {
  const filePath = raw.path || raw.url || raw.tempFilePath || raw.persistPath || ''
  const fileName = raw.name || raw.fileName || filePath.split('/').pop() || 'file'
  return {
    uid: raw.uid || createFileUid(),
    name: fileName,
    fileName,
    size: raw.size || 0,
    url: raw.url || filePath,
    path: filePath,
    persistPath: raw.persistPath || '',
    storeType: raw.storeType || '',
    file: raw.file || null,
    status: raw.status || CHUNK_STATUS.WAITING,
    progress: raw.progress || 0,
    fileId: raw.fileId || '',
    filePath: raw.filePath || '',
    fileUrl: raw.fileUrl || '',
    error: raw.error || '',
    hash: raw.hash || '',
    uploadId: raw.uploadId || '',
  }
}

function createUploadSession(initialOptions = {}) {
  let options = { ...initialOptions }
  const callbacks = {
    onProgress: options.onProgress,
    onSuccess: options.onSuccess,
    onError: options.onError,
  }

  const sessionId = options.sessionId || 'default'
  const chunkSize = options.chunkSize || 2 * 1024 * 1024
  const maxRetry = options.maxRetry ?? 3
  let concurrent = options.concurrent ?? 1
  let autoUpload = options.autoUpload ?? true
  let persistQueue = options.persistQueue ?? !!options.sessionId
  const endpoints = { ...DEFAULT_ENDPOINTS, ...(options.endpoints || {}) }
  let apiBase = options.apiBase

  const userStore = useUserStore()
  const userInfo = userStore.userInfo

  if (!apiBase)
    apiBase = getChunkApiBase(userStore.userType)

  const headers = computed(() => ({
    Authorization: userInfo?.token,
    platformType,
    ...(options.headers || {}),
  }))

  const queue = ref([])
  const uploaders = new Map()
  const cachedTasks = ref([])
  const runningCount = ref(0)
  let persistTimer = null
  let restored = false

  const overallProgress = computed(() => {
    if (!queue.value.length)
      return 0
    const total = queue.value.reduce((sum, item) => sum + (item.size || 0), 0)
    if (!total)
      return 0
    const uploaded = queue.value.reduce((sum, item) => {
      return sum + (item.size || 0) * (item.progress || 0) / 100
    }, 0)
    return Math.floor((uploaded / total) * 100)
  })

  const hasUploading = computed(() =>
    queue.value.some(item => item.status === CHUNK_STATUS.UPLOADING || item.status === CHUNK_STATUS.HASHING),
  )

  const hasPaused = computed(() =>
    queue.value.some(item => item.status === CHUNK_STATUS.PAUSED),
  )

  const hasError = computed(() =>
    queue.value.some(item => item.status === CHUNK_STATUS.ERROR),
  )

  const hasPending = computed(() =>
    queue.value.some(item =>
      item.status === CHUNK_STATUS.WAITING
      || item.status === CHUNK_STATUS.PAUSED
      || item.status === CHUNK_STATUS.ERROR,
    ),
  )

  const hasResumable = computed(() =>
    queue.value.some(item =>
      item.status === CHUNK_STATUS.PAUSED
      || item.status === CHUNK_STATUS.ERROR
      || item.status === CHUNK_STATUS.WAITING,
    ),
  )

  const completedFiles = computed(() =>
    queue.value.filter(item => item.status === CHUNK_STATUS.SUCCESS),
  )

  function setCallbacks(next = {}) {
    if (next.onProgress !== undefined)
      callbacks.onProgress = next.onProgress
    if (next.onSuccess !== undefined)
      callbacks.onSuccess = next.onSuccess
    if (next.onError !== undefined)
      callbacks.onError = next.onError
  }

  function updateOptions(next = {}) {
    options = { ...options, ...next }
    if (next.concurrent !== undefined)
      concurrent = next.concurrent
    if (next.autoUpload !== undefined)
      autoUpload = next.autoUpload
    if (next.persistQueue !== undefined)
      persistQueue = next.persistQueue
    if (next.apiBase !== undefined)
      apiBase = next.apiBase || getChunkApiBase(userStore.userType)
  }

  function schedulePersist() {
    if (!persistQueue)
      return
    clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      saveQueueSession(sessionId, queue.value)
    }, 200)
  }

  function syncQueueItem(uid, patch) {
    const index = queue.value.findIndex(item => item.uid === uid)
    if (index === -1)
      return
    queue.value[index] = { ...queue.value[index], ...patch }
    schedulePersist()
  }

  function refreshCachedTasks() {
    const queueHashes = new Set(queue.value.map(item => item.hash).filter(Boolean))
    cachedTasks.value = listUploadCaches().filter(cache => !queueHashes.has(cache.hash))
  }

  async function hydrateItem(item) {
    await hydrateFileItem(item)
    if (item.hash) {
      const cache = loadUploadCache(item.hash)
      if (cache) {
        item.uploadId = item.uploadId || cache.uploadId || ''
        item.progress = Math.max(item.progress || 0, computeProgressFromCache(cache, chunkSize))
      }
    }
    const accessible = await verifyFileAccessible(item)
    if (!accessible) {
      item.status = CHUNK_STATUS.ERROR
      item.error = item.error || 'fileExpired'
    }
    else if (INTERRUPTED_STATUSES.has(item.status)) {
      item.status = CHUNK_STATUS.PAUSED
    }
    return item
  }

  async function restoreQueue() {
    if (restored || !persistQueue)
      return
    restored = true

    const savedItems = loadQueueSession(sessionId)
    const restoredItems = []
    for (const raw of savedItems) {
      if (raw.status === CHUNK_STATUS.SUCCESS) {
        restoredItems.push(normalizeFileItem(raw))
        continue
      }
      restoredItems.push(await hydrateItem(normalizeFileItem(raw)))
    }

    const existingHashes = new Set(restoredItems.map(item => item.hash).filter(Boolean))
    const orphanCaches = listUploadCaches().filter(cache => !existingHashes.has(cache.hash))
    for (const cache of orphanCaches) {
      restoredItems.push(await hydrateItem(normalizeFileItem({
        uid: cache.persistUid || createFileUid(),
        name: cache.fileName,
        fileName: cache.fileName,
        size: cache.fileSize,
        path: cache.filePath,
        persistPath: cache.persistPath || cache.filePath,
        storeType: cache.storeType || (cache.persistPath ? 'path' : ''),
        hash: cache.hash,
        uploadId: cache.uploadId,
        progress: computeProgressFromCache(cache, chunkSize),
        status: CHUNK_STATUS.PAUSED,
      })))
    }

    queue.value = restoredItems
    refreshCachedTasks()
    schedulePersist()

    restoredItems
      .filter(item => item.status === CHUNK_STATUS.SUCCESS)
      .forEach(item => callbacks.onSuccess?.(item, { id: item.fileId, fileName: item.fileName }))

    return restoredItems
  }

  async function addFiles(files) {
    const rawList = Array.isArray(files) ? files : [files]
    const list = []

    for (const raw of rawList) {
      const item = normalizeFileItem(raw)
      try {
        const persisted = await persistFile(item.uid, raw)
        item.persistPath = persisted.persistPath
        item.storeType = persisted.storeType
        item.path = item.storeType === 'path' ? item.persistPath : item.path
      }
      catch (e) {
        console.warn('[useChunkUpload] persist file failed', e)
      }
      list.push(item)
    }

    queue.value.push(...list)
    schedulePersist()

    if (autoUpload)
      list.forEach(item => startUpload(item.uid))

    return list
  }

  async function removeFile(uid) {
    const item = queue.value.find(v => v.uid === uid)
    const uploader = uploaders.get(uid)
    if (uploader?.isRunning)
      runningCount.value = Math.max(0, runningCount.value - 1)
    uploader?.abort()
    uploaders.delete(uid)

    if (item?.hash)
      removeUploadCache(item.hash)
    if (item)
      await removePersistedFile(item)

    queue.value = queue.value.filter(v => v.uid !== uid)
    refreshCachedTasks()
    schedulePersist()
  }

  function getUploaderOptions(item) {
    return {
      file: item,
      filePath: item.path || item.url,
      persistPath: item.storeType === 'path' ? item.persistPath : item.path,
      persistUid: item.uid,
      storeType: item.storeType,
      fileName: item.name,
      fileSize: item.size,
      chunkSize,
      maxRetry,
      headers: headers.value,
      apiBase,
      endpoints,
      onEvent: (event, payload) => handleUploaderEvent(item.uid, event, payload),
    }
  }

  function handleUploaderEvent(uid, event, payload) {
    switch (event) {
      case 'status':
        syncQueueItem(uid, { status: payload.status })
        break
      case 'hash':
        syncQueueItem(uid, {
          hash: payload.hash,
          progress: payload.progress,
        })
        break
      case 'progress':
        syncQueueItem(uid, { progress: payload.progress })
        callbacks.onProgress?.(queue.value.find(v => v.uid === uid), payload.progress, overallProgress.value)
        break
      case 'success': {
        const data = payload || {}
        syncQueueItem(uid, {
          status: CHUNK_STATUS.SUCCESS,
          progress: 100,
          fileId: data.id || data.fileId,
          fileName: data.fileName || queue.value.find(v => v.uid === uid)?.name,
          filePath: data.id || data.filePath || data.fileId,
          fileUrl: data.fileUrl || data.url || data.id,
          error: '',
        })
        runningCount.value = Math.max(0, runningCount.value - 1)
        processWaitingQueue()
        callbacks.onSuccess?.(queue.value.find(v => v.uid === uid), data)
        refreshCachedTasks()
        break
      }
      case 'error':
        syncQueueItem(uid, { status: CHUNK_STATUS.ERROR, error: payload.error })
        runningCount.value = Math.max(0, runningCount.value - 1)
        processWaitingQueue()
        callbacks.onError?.(queue.value.find(v => v.uid === uid), payload.error)
        break
    }
  }

  function processWaitingQueue() {
    if (runningCount.value >= concurrent)
      return
    const next = queue.value.find(item => item.status === CHUNK_STATUS.WAITING)
    if (next)
      startUpload(next.uid)
  }

  async function startUpload(uid) {
    const item = queue.value.find(v => v.uid === uid)
    if (!item || item.status === CHUNK_STATUS.SUCCESS || item.status === CHUNK_STATUS.UPLOADING)
      return

    if (runningCount.value >= concurrent) {
      syncQueueItem(uid, { status: CHUNK_STATUS.WAITING })
      return
    }

    await hydrateFileItem(item)
    const accessible = await verifyFileAccessible(item)
    if (!accessible) {
      syncQueueItem(uid, {
        status: CHUNK_STATUS.ERROR,
        error: 'fileExpired',
      })
      return
    }

    let uploader = uploaders.get(uid)
    if (!uploader) {
      uploader = new ChunkUploader(getUploaderOptions(item))
      uploaders.set(uid, uploader)
    }

    runningCount.value++
    syncQueueItem(uid, { status: CHUNK_STATUS.UPLOADING, error: '' })

    try {
      await uploader.start()
    }
    catch (e) {
      // handled in event
    }
  }

  function startAll() {
    queue.value.forEach((item) => {
      if (
        item.status === CHUNK_STATUS.WAITING
        || item.status === CHUNK_STATUS.PAUSED
        || item.status === CHUNK_STATUS.ERROR
      )
        startUpload(item.uid)
    })
  }

  function pauseFile(uid) {
    uploaders.get(uid)?.pause()
    syncQueueItem(uid, { status: CHUNK_STATUS.PAUSED })
    runningCount.value = Math.max(0, runningCount.value - 1)
  }

  function resumeFile(uid) {
    const item = queue.value.find(v => v.uid === uid)
    if (!item)
      return
    if (item.status === CHUNK_STATUS.ERROR) {
      syncQueueItem(uid, { status: CHUNK_STATUS.PAUSED, error: '' })
    }
    const uploader = uploaders.get(uid)
    if (uploader && uploader.status === CHUNK_STATUS.PAUSED) {
      runningCount.value++
      uploader.resume()
      return
    }
    startUpload(uid)
  }

  function retryFile(uid) {
    const uploader = uploaders.get(uid)
    uploader?.abort()
    uploaders.delete(uid)
    syncQueueItem(uid, { status: CHUNK_STATUS.WAITING, error: '' })
    startUpload(uid)
  }

  function cancelFile(uid) {
    return removeFile(uid)
  }

  function pauseAll() {
    queue.value.forEach((item) => {
      if (item.status === CHUNK_STATUS.UPLOADING || item.status === CHUNK_STATUS.HASHING)
        pauseFile(item.uid)
    })
    schedulePersist()
  }

  function resumeAll() {
    queue.value.forEach((item) => {
      if (
        item.status === CHUNK_STATUS.PAUSED
        || item.status === CHUNK_STATUS.ERROR
        || item.status === CHUNK_STATUS.WAITING
      )
        resumeFile(item.uid)
    })
  }

  async function resumeCachedTask(hash) {
    const cache = loadUploadCache(hash)
    if (!cache)
      return
    const existing = queue.value.find(item => item.hash === hash)
    if (existing)
      return resumeFile(existing.uid)

    const item = await hydrateItem(normalizeFileItem({
      uid: cache.persistUid || createFileUid(),
      name: cache.fileName,
      fileName: cache.fileName,
      size: cache.fileSize,
      path: cache.filePath,
      persistPath: cache.persistPath || cache.filePath,
      storeType: cache.storeType || (cache.persistPath ? 'path' : ''),
      hash: cache.hash,
      uploadId: cache.uploadId,
      progress: computeProgressFromCache(cache, chunkSize),
      status: CHUNK_STATUS.PAUSED,
    }))
    queue.value.push(item)
    refreshCachedTasks()
    schedulePersist()
    resumeFile(item.uid)
  }

  async function dismissCache(hash) {
    removeUploadCache(hash)
    const item = queue.value.find(v => v.hash === hash)
    if (item)
      await removeFile(item.uid)
    refreshCachedTasks()
  }

  function getSuccessValue(limit = 0) {
    const files = completedFiles.value.map(item => ({
      fileId: item.fileId,
      fileName: item.fileName || item.name,
      filePath: item.filePath || item.fileId,
      fileUrl: item.fileUrl || item.filePath,
      name: item.fileName || item.name,
      url: formatUrl(item.fileId || item.filePath, '', /\.(mp4)$/i.test(item.name || '')),
    }))
    if (limit === 1)
      return files[0] || null
    return files
  }

  async function destroy() {
    clearTimeout(persistTimer)
    uploaders.forEach(uploader => uploader.abort())
    uploaders.clear()
    for (const item of queue.value)
      await removePersistedFile(item)
    queue.value = []
    runningCount.value = 0
    removeQueueSession(sessionId)
    cachedTasks.value = []
  }

  restoreQueue()

  return {
    queue,
    cachedTasks,
    overallProgress,
    hasUploading,
    hasPaused,
    hasError,
    hasPending,
    hasResumable,
    completedFiles,
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
    refreshCachedTasks,
    dismissCache,
    getSuccessValue,
    restoreQueue,
    setCallbacks,
    updateOptions,
    destroy,
  }
}

export function useChunkUpload(options = {}) {
  const sessionId = options.sessionId
  const persistOnNavigate = options.persistOnNavigate ?? !!sessionId

  let session
  if (sessionId) {
    if (!sessionStore.has(sessionId))
      sessionStore.set(sessionId, createUploadSession({ ...options, sessionId }))
    session = sessionStore.get(sessionId)
    session.updateOptions(options)
    session.setCallbacks({
      onProgress: options.onProgress,
      onSuccess: options.onSuccess,
      onError: options.onError,
    })
  }
  else {
    session = createUploadSession(options)
  }

  onBeforeUnmount(() => {
    if (sessionId) {
      if (!persistOnNavigate) {
        session.destroy()
        sessionStore.delete(sessionId)
      }
      else {
        session.pauseAll()
        session.setCallbacks({})
      }
    }
    else {
      session.pauseAll()
      session.setCallbacks({})
    }
  })

  return {
    queue: session.queue,
    cachedTasks: session.cachedTasks,
    overallProgress: session.overallProgress,
    hasUploading: session.hasUploading,
    hasPaused: session.hasPaused,
    hasError: session.hasError,
    hasPending: session.hasPending,
    hasResumable: session.hasResumable,
    completedFiles: session.completedFiles,
    addFiles: session.addFiles,
    removeFile: session.removeFile,
    cancelFile: session.cancelFile,
    startUpload: session.startUpload,
    startAll: session.startAll,
    pauseFile: session.pauseFile,
    resumeFile: session.resumeFile,
    retryFile: session.retryFile,
    pauseAll: session.pauseAll,
    resumeAll: session.resumeAll,
    resumeCachedTask: session.resumeCachedTask,
    refreshCachedTasks: session.refreshCachedTasks,
    dismissCache: session.dismissCache,
    getSuccessValue: session.getSuccessValue,
    restoreQueue: session.restoreQueue,
  }
}

/** 销毁指定会话（如表单重置时手动调用） */
export function destroyChunkUploadSession(sessionId) {
  const session = sessionStore.get(sessionId)
  if (session) {
    session.destroy()
    sessionStore.delete(sessionId)
  }
  else {
    removeQueueSession(sessionId)
  }
}
