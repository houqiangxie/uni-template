/**
 * 大文件分片上传引擎（H5 / 微信小程序 / APP 统一实现）
 * - 分片读取与上传
 * - 断点续传（本地缓存已上传分片）
 * - 失败自动重试
 * - 暂停 / 继续
 */
import md5 from 'crypto-js/md5'
import CryptoJS from 'crypto-js'

export const CHUNK_STATUS = {
  WAITING: 'waiting',
  HASHING: 'hashing',
  UPLOADING: 'uploading',
  PAUSED: 'paused',
  SUCCESS: 'success',
  ERROR: 'error',
}

export const CACHE_PREFIX = 'chunk_upload_'
const SAMPLE_SIZE = 2 * 1024 * 1024

const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function arrayBufferToWordArray(buffer) {
  const u8 = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer)
  const words = []
  for (let i = 0; i < u8.length; i += 4) {
    words.push(
      ((u8[i] || 0) << 24)
      | ((u8[i + 1] || 0) << 16)
      | ((u8[i + 2] || 0) << 8)
      | (u8[i + 3] || 0),
    )
  }
  return CryptoJS.lib.WordArray.create(words, u8.length)
}

export function createFileUid() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function getChunkApiBase(userType = 1) {
  let url = (userType === 1 ? '' : '/jgzf') + '/api/system/sys/file/chunk'
  // #ifndef H5
  url = baseUrl + url
  // #endif
  return url
}

export function getCacheKey(hash) {
  return `${CACHE_PREFIX}${hash}`
}

export function saveUploadCache(hash, data) {
  try {
    uni.setStorageSync(getCacheKey(hash), {
      ...data,
      updatedAt: Date.now(),
    })
  }
  catch (e) {
    console.warn('[chunkUpload] save cache failed', e)
  }
}

export function loadUploadCache(hash) {
  try {
    return uni.getStorageSync(getCacheKey(hash)) || null
  }
  catch (e) {
    return null
  }
}

export function removeUploadCache(hash) {
  try {
    uni.removeStorageSync(getCacheKey(hash))
  }
  catch (e) {
    console.warn('[chunkUpload] remove cache failed', e)
  }
}

export function listUploadCaches() {
  try {
    const info = uni.getStorageInfoSync()
    return (info.keys || [])
      .filter(key => key.startsWith(CACHE_PREFIX))
      .map((key) => {
        const data = uni.getStorageSync(key)
        return data ? { key, ...data } : null
      })
      .filter(Boolean)
  }
  catch (e) {
    return []
  }
}

/**
 * 采样哈希：文件名 + 大小 + 首尾各 2MB，避免大文件全量读取
 */
export async function computeSampleHash({ file, filePath, persistPath, fileName, fileSize }) {
  const parts = [fileName || '', String(fileSize || 0)]
  const headEnd = Math.min(SAMPLE_SIZE, fileSize || 0)
  if (headEnd > 0) {
    const head = await readFileChunk({ file, filePath, persistPath, start: 0, end: headEnd })
    parts.push(md5(arrayBufferToWordArray(head)).toString())
  }
  if ((fileSize || 0) > SAMPLE_SIZE) {
    const tailStart = Math.max(0, fileSize - SAMPLE_SIZE)
    const tail = await readFileChunk({ file, filePath, persistPath, start: tailStart, end: fileSize })
    parts.push(md5(arrayBufferToWordArray(tail)).toString())
  }
  return md5(parts.join('|')).toString()
}

/**
 * 跨平台读取文件分片
 */
export function readFileChunk({ file, filePath, persistPath, start, end }) {
  const length = end - start
  if (length <= 0)
    return Promise.resolve(new ArrayBuffer(0))

  const resolvedPath = persistPath || filePath

  // #ifdef H5
  if (file?.file instanceof Blob) {
    return file.file.slice(start, end).arrayBuffer()
  }
  if (file?.file instanceof File) {
    return file.file.slice(start, end).arrayBuffer()
  }
  if (resolvedPath) {
    return fetch(resolvedPath)
      .then(resp => resp.blob())
      .then(blob => blob.slice(start, end).arrayBuffer())
  }
  return Promise.reject(new Error('H5: 无法读取文件分片'))
  // #endif

  // #ifndef H5
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath: resolvedPath || file?.url || file?.path,
      position: start,
      length,
      success(res) {
        resolve(res.data)
      },
      fail(err) {
        reject(err)
      },
    })
  })
  // #endif
}

/**
 * 将分片写入临时文件（小程序 / APP 上传用）
 */
export function writeTempChunkFile(tempPath, data) {
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    fs.writeFile({
      filePath: tempPath,
      data,
      success: resolve,
      fail: reject,
    })
  })
}

function getTempChunkPath(uploadId, chunkIndex) {
  const name = `chunk_${uploadId}_${chunkIndex}.tmp`
  // #ifdef MP-WEIXIN
  return `${wx.env.USER_DATA_PATH}/${name}`
  // #endif
  // #ifndef MP-WEIXIN
  return `_doc/${name}`
  // #endif
}

function parseResponse(res) {
  let body = res?.data
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    }
    catch (e) {
      body = { code: res?.statusCode, message: body }
    }
  }
  const code = body?.code
  const normalizedCode = code === 200 ? 0 : code
  return { body, code: normalizedCode, raw: res }
}

async function requestJson(url, { method = 'GET', data, headers = {}, timeout = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header: headers,
      timeout,
      success(res) {
        const parsed = parseResponse(res)
        if (res.statusCode >= 200 && res.statusCode < 300 && (parsed.code === 0 || parsed.code === 200)) {
          resolve(parsed.body?.data ?? parsed.body)
        }
        else {
          reject(new Error(parsed.body?.message || '请求失败'))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

async function withRetry(fn, maxRetry = 3, delay = 1000) {
  let lastError
  for (let i = 0; i < maxRetry; i++) {
    try {
      return await fn()
    }
    catch (e) {
      lastError = e
      if (i < maxRetry - 1)
        await sleep(delay * (i + 1))
    }
  }
  throw lastError
}

export class ChunkUploader {
  constructor(options) {
    this.options = options
    this.status = CHUNK_STATUS.WAITING
    this.progress = 0
    this.uploadedChunks = new Set()
    this.uploadId = ''
    this.fileHash = ''
    this.totalChunks = 0
    this.aborted = false
    this.paused = false
    this.activeTask = null
    this.error = null
  }

  get isRunning() {
    return this.status === CHUNK_STATUS.HASHING || this.status === CHUNK_STATUS.UPLOADING
  }

  pause() {
    this.paused = true
    this.status = CHUNK_STATUS.PAUSED
    this._abortActiveTask()
  }

  resume() {
    if (this.status !== CHUNK_STATUS.PAUSED && this.status !== CHUNK_STATUS.ERROR)
      return
    this.paused = false
    this.aborted = false
    return this.start()
  }

  abort() {
    this.aborted = true
    this.paused = false
    this._abortActiveTask()
  }

  _abortActiveTask() {
    if (this.activeTask?.abort)
      this.activeTask.abort()
    this.activeTask = null
  }

  _emit(event, payload) {
    this.options.onEvent?.(event, payload, this)
  }

  _updateProgress() {
    const percent = this.totalChunks
      ? Math.floor((this.uploadedChunks.size / this.totalChunks) * 100)
      : 0
    this.progress = percent
    this._emit('progress', { progress: percent, uploaded: this.uploadedChunks.size, total: this.totalChunks })
  }

  async start() {
    const {
      file,
      filePath,
      fileName,
      fileSize,
      chunkSize,
      headers,
      apiBase,
      endpoints,
      maxRetry,
    } = this.options

    try {
      this.error = null
      this.aborted = false
      this.paused = false

      this.status = CHUNK_STATUS.HASHING
      this._emit('status', { status: this.status })

      this.fileHash = await computeSampleHash({
        file,
        filePath,
        persistPath: this.options.persistPath,
        fileName,
        fileSize,
      })
      this.totalChunks = Math.ceil(fileSize / chunkSize)

      const cache = loadUploadCache(this.fileHash)
      if (cache?.uploadId) {
        this.uploadId = cache.uploadId
        ;(cache.uploadedChunks || []).forEach(i => this.uploadedChunks.add(i))
      }

      if (!this.uploadId) {
        const initData = await requestJson(`${apiBase}${endpoints.init}`, {
          method: 'POST',
          data: {
            fileName,
            fileSize,
            fileHash: this.fileHash,
            chunkSize,
            totalChunks: this.totalChunks,
          },
          headers,
        })
        this.uploadId = initData.uploadId || initData.id
        const remoteChunks = initData.uploadedChunks || initData.chunks || []
        remoteChunks.forEach(i => this.uploadedChunks.add(Number(i)))
      }
      else {
        try {
          const checkData = await requestJson(`${apiBase}${endpoints.check}`, {
            method: 'GET',
            data: { uploadId: this.uploadId, fileHash: this.fileHash },
            headers,
          })
          ;(checkData.uploadedChunks || checkData.chunks || []).forEach(i => this.uploadedChunks.add(Number(i)))
        }
        catch (e) {
          // 检查失败时沿用本地缓存
        }
      }

      saveUploadCache(this.fileHash, {
        hash: this.fileHash,
        fileName,
        fileSize,
        filePath: filePath || file?.url || file?.path,
        persistPath: this.options.persistPath,
        storeType: this.options.storeType,
        persistUid: this.options.persistUid,
        uploadId: this.uploadId,
        uploadedChunks: [...this.uploadedChunks],
      })

      this._emit('hash', { hash: this.fileHash, progress: this.progress })
      this._updateProgress()
      this.status = CHUNK_STATUS.UPLOADING
      this._emit('status', { status: this.status })

      for (let i = 0; i < this.totalChunks; i++) {
        if (this.aborted || this.paused)
          return
        if (this.uploadedChunks.has(i))
          continue

        await withRetry(
          () => this._uploadSingleChunk(i),
          maxRetry,
        )

        this.uploadedChunks.add(i)
        saveUploadCache(this.fileHash, {
          hash: this.fileHash,
          fileName,
          fileSize,
          filePath: filePath || file?.url || file?.path,
          persistPath: this.options.persistPath,
          storeType: this.options.storeType,
          persistUid: this.options.persistUid,
          uploadId: this.uploadId,
          uploadedChunks: [...this.uploadedChunks],
        })
        this._updateProgress()
      }

      if (this.paused || this.aborted)
        return

      const mergeData = await requestJson(`${apiBase}${endpoints.merge}`, {
        method: 'POST',
        data: {
          uploadId: this.uploadId,
          fileName,
          fileHash: this.fileHash,
          totalChunks: this.totalChunks,
          fileSize,
        },
        headers,
      })

      removeUploadCache(this.fileHash)
      this.status = CHUNK_STATUS.SUCCESS
      this.progress = 100
      this._emit('success', mergeData)
      this._emit('progress', { progress: 100, uploaded: this.totalChunks, total: this.totalChunks })
    }
    catch (e) {
      this.error = e?.message || String(e)
      this.status = CHUNK_STATUS.ERROR
      this._emit('error', { error: this.error })
      this._emit('status', { status: this.status })
      throw e
    }
  }

  async _uploadSingleChunk(index) {
    const {
      file,
      filePath,
      fileName,
      fileSize,
      chunkSize,
      headers,
      apiBase,
      endpoints,
    } = this.options

    const start = index * chunkSize
    const end = Math.min(start + chunkSize, fileSize)
    const chunkBuffer = await readFileChunk({
      file,
      filePath,
      persistPath: this.options.persistPath,
      start,
      end,
    })
    const url = `${apiBase}${endpoints.chunk}`
    const formFields = {
      uploadId: this.uploadId,
      chunkIndex: String(index),
      fileHash: this.fileHash,
      fileName,
      totalChunks: String(this.totalChunks),
    }

    // #ifdef H5
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      Object.entries(headers).forEach(([k, v]) => {
        if (k.toLowerCase() !== 'content-type')
          xhr.setRequestHeader(k, v)
      })
      const form = new FormData()
      Object.entries(formFields).forEach(([k, v]) => form.append(k, v))
      form.append('chunk', new Blob([chunkBuffer]), `chunk_${index}`)
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4)
          return
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText || '{}')
            const code = body.code === 200 ? 0 : body.code
            if (code === 0 || code === 200)
              resolve(body.data ?? body)
            else
              reject(new Error(body.message || '分片上传失败'))
          }
          catch (e) {
            resolve({})
          }
        }
        else {
          reject(new Error('分片上传失败'))
        }
      }
      xhr.onerror = () => reject(new Error('网络错误'))
      this.activeTask = { abort: () => xhr.abort() }
      xhr.send(form)
    })
    // #endif

    // #ifndef H5
    const tempPath = getTempChunkPath(this.uploadId, index)
    await writeTempChunkFile(tempPath, chunkBuffer)
    return new Promise((resolve, reject) => {
      const uploadTask = uni.uploadFile({
        url,
        filePath: tempPath,
        name: 'chunk',
        formData: formFields,
        header: headers,
        success(res) {
          const parsed = parseResponse(res)
          if (parsed.code === 0 || parsed.code === 200)
            resolve(parsed.body?.data ?? parsed.body)
          else
            reject(new Error(parsed.body?.message || '分片上传失败'))
        },
        fail(err) {
          reject(err)
        },
      })
      this.activeTask = uploadTask
    })
    // #endif
  }
}
