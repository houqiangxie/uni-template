/**
 * 分片上传本地持久化（队列 + 文件本体）
 * - H5：IndexedDB 存 Blob，刷新/断电后可恢复
 * - 小程序 / App：复制到用户目录持久路径
 */
export const QUEUE_SESSION_PREFIX = 'chunk_upload_session_'

const IDB_NAME = 'uni_chunk_upload'
const IDB_VERSION = 1
const IDB_STORE = 'files'

function getQueueSessionKey(sessionId) {
  return `${QUEUE_SESSION_PREFIX}${sessionId || 'default'}`
}

export function saveQueueSession(sessionId, items) {
  try {
    const payload = (items || []).map(item => ({
      uid: item.uid,
      name: item.name,
      fileName: item.fileName,
      size: item.size,
      path: item.path,
      persistPath: item.persistPath,
      storeType: item.storeType,
      status: item.status,
      progress: item.progress,
      hash: item.hash,
      uploadId: item.uploadId,
      fileId: item.fileId,
      filePath: item.filePath,
      fileUrl: item.fileUrl,
      error: item.error,
    }))
    uni.setStorageSync(getQueueSessionKey(sessionId), {
      items: payload,
      updatedAt: Date.now(),
    })
  }
  catch (e) {
    console.warn('[chunkUploadPersist] save queue failed', e)
  }
}

export function loadQueueSession(sessionId) {
  try {
    return uni.getStorageSync(getQueueSessionKey(sessionId))?.items || []
  }
  catch (e) {
    return []
  }
}

export function removeQueueSession(sessionId) {
  try {
    uni.removeStorageSync(getQueueSessionKey(sessionId))
  }
  catch (e) {
    console.warn('[chunkUploadPersist] remove queue failed', e)
  }
}

function getPersistentFilePath(uid, fileName) {
  const safeName = (fileName || 'file').replace(/[/\\?%*:|"<>]/g, '_')
  // #ifdef MP-WEIXIN
  return `${wx.env.USER_DATA_PATH}/chunk_upload_${uid}_${safeName}`
  // #endif
  // #ifndef MP-WEIXIN
  return `_doc/chunk_upload_${uid}_${safeName}`
  // #endif
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE))
        db.createObjectStore(IDB_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    // #endif
    // #ifndef H5
    reject(new Error('IndexedDB only on H5'))
    // #endif
  })
}

async function idbPut(uid, value) {
  const db = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, uid)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function idbGet(uid) {
  const db = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(uid)
    req.onsuccess = () => {
      db.close()
      resolve(req.result || null)
    }
    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
}

async function idbDelete(uid) {
  const db = await openIndexedDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).delete(uid)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function resolveBlob(raw) {
  if (raw?.file instanceof Blob)
    return raw.file
  if (raw?.file instanceof File)
    return raw.file
  const path = raw?.path || raw?.url || raw?.tempFilePath
  if (path) {
    // #ifdef H5
    const resp = await fetch(path)
    return resp.blob()
    // #endif
  }
  throw new Error('无法读取文件')
}

export async function persistFile(uid, raw) {
  const fileName = raw?.name || raw?.fileName || 'file'
  const size = raw?.size || 0

  // #ifdef H5
  try {
    const blob = await resolveBlob(raw)
    await idbPut(uid, { blob, name: fileName, size, type: blob.type })
    return { storeType: 'idb', persistPath: uid }
  }
  catch (e) {
    console.warn('[chunkUploadPersist] H5 persist failed', e)
    throw e
  }
  // #endif

  // #ifndef H5
  const srcPath = raw?.path || raw?.url || raw?.tempFilePath
  if (!srcPath)
    throw new Error('缺少文件路径')

  const destPath = getPersistentFilePath(uid, fileName)
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    fs.copyFile({
      srcPath,
      destPath,
      success: () => resolve({ storeType: 'path', persistPath: destPath }),
      fail: () => {
        uni.saveFile({
          tempFilePath: srcPath,
          success: res => resolve({ storeType: 'path', persistPath: res.savedFilePath }),
          fail: err => reject(err),
        })
      },
    })
  })
  // #endif
}

export async function hydrateFileItem(item) {
  if (!item?.uid)
    return item

  // #ifdef H5
  if (item.storeType === 'idb' || (!item.storeType && item.persistPath && item.persistPath === item.uid)) {
    item.storeType = 'idb'
    try {
      const stored = await idbGet(item.uid)
      if (stored?.blob) {
        item.file = { file: stored.blob }
        item.path = item.path || URL.createObjectURL(stored.blob)
        item.name = item.name || stored.name
        item.size = item.size || stored.size
        return item
      }
    }
    catch (e) {
      console.warn('[chunkUploadPersist] hydrate idb failed', e)
    }
  }
  // #endif

  if (item.storeType === 'path' && item.persistPath) {
    item.path = item.persistPath
    return item
  }

  return item
}

export async function verifyFileAccessible(item) {
  if (!item)
    return false

  // #ifdef H5
  if (item.storeType === 'idb') {
    try {
      const stored = await idbGet(item.uid)
      return !!stored?.blob
    }
    catch (e) {
      return false
    }
  }
  // #endif

  if (item.persistPath || item.path) {
    const path = item.persistPath || item.path
    return new Promise((resolve) => {
      uni.getFileSystemManager().access({
        path,
        success: () => resolve(true),
        fail: () => resolve(false),
      })
    })
  }

  return !!(item.file || item.path)
}

export async function removePersistedFile(item) {
  if (!item?.uid)
    return

  // #ifdef H5
  if (item.storeType === 'idb') {
    try {
      await idbDelete(item.uid)
    }
    catch (e) {
      console.warn('[chunkUploadPersist] remove idb failed', e)
    }
    if (item.path?.startsWith('blob:'))
      URL.revokeObjectURL(item.path)
    return
  }
  // #endif

  if (item.persistPath) {
    return new Promise((resolve) => {
      uni.getFileSystemManager().unlink({
        filePath: item.persistPath,
        success: resolve,
        fail: resolve,
      })
    })
  }
}

export function computeProgressFromCache(cache, chunkSize) {
  if (!cache?.fileSize || !chunkSize)
    return 0
  const totalChunks = Math.ceil(cache.fileSize / chunkSize)
  if (!totalChunks)
    return 0
  const uploaded = (cache.uploadedChunks || []).length
  return Math.min(100, Math.floor((uploaded / totalChunks) * 100))
}
