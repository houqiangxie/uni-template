import md5 from 'crypto-js/md5'
import i18n from '@/locale'

export interface RequestConfig {
  method?: string
  loading?: boolean
  proxy?: boolean
  showMessage?: boolean
  checkAuth?: boolean
  sharePromise?: boolean
  joinUrl?: boolean
  timeout?: number
  apiBase?: string
  token?: string
  cancelKey?: string
  requestKey?: string
  latestKey?: string
  latest?: boolean
  discardStaleResponses?: boolean
  platformType?: string | number
  url?: string
  data?: any
  header?: Record<string, any>
  [key: string]: any
}

export interface RequestResult<T = any> {
  data: T
  code: number
  message?: string
  aborted?: boolean
  errMsg?: string
}

const defaultConfig: RequestConfig = {
  method: 'POST',
  loading: true,
  proxy: true,
  showMessage: true,
  checkAuth: true,
  sharePromise: true,
  joinUrl: false,
  timeout: 20000,
}

let loadingCount = 0
function closeLoading() {
  if (loadingCount > 0)
    loadingCount--
  if (loadingCount === 0)
    useLoadingStore().close()
}

export const platformType: string | number = (() => {
  let type: string | number = ''
  // #ifdef MP
  type = 5
  // #endif
  // #ifdef APP-PLUS
  type = 2
  // #endif
  // #ifdef H5
  type = 4
  // #endif
  return type
})()

function getBase(config: RequestConfig) {
  const apiBase = config?.apiBase || apiPrefix
  // #ifdef H5
  return apiBase
  // #endif
  // #ifndef H5
  return baseUrl + apiBase
  // #endif
}

/** 无需登录即可访问的页面路径片段白名单 */
const checkAuthList = [
  '/pages/login/index',
  '/pages/index',
  '/pages-test/',
]

const requestMap = new Map<string, Promise<any>>()
const cancelKeyTaskMap = new Map<string, { task: UniApp.RequestTask | null; timestamp: number }>()
const activeRequestTasks = new Set<UniApp.RequestTask>()

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object')
    return obj
  if (Array.isArray(obj))
    return obj.map(sortObjectKeys)
  return Object.keys(obj).sort().reduce((acc: Record<string, any>, key) => {
    acc[key] = sortObjectKeys(obj[key])
    return acc
  }, {})
}

function hasUndefinedValue(value: any): boolean {
  if (value === undefined)
    return true
  if (value === null || typeof value !== 'object')
    return false
  if (Array.isArray(value))
    return value.some(hasUndefinedValue)
  return Object.values(value).some(hasUndefinedValue)
}

function hasUndefinedSegment(value: any) {
  return typeof value === 'string' && value.includes('undefined')
}

function shouldInterceptRequest(path: string, url: string, data: any) {
  if (hasUndefinedSegment(path) || hasUndefinedSegment(url))
    return true
  return hasUndefinedValue(data)
}

function generateReqKey(config: RequestConfig) {
  const { method, url, data, requestKey, token } = config
  const stableData = JSON.stringify(sortObjectKeys(data || {}))
  const key = requestKey || [method ? method.toUpperCase() : 'GET', url, encodeURIComponent(stableData), token].join('&')
  config.requestKey = key
  return key
}

let toLogin = false

function abortTask(task?: UniApp.RequestTask | null) {
  try {
    task?.abort?.()
  }
  catch { /* ignore */ }
}

function getRegistryKey(configTemp: RequestConfig, lastKey: string) {
  return configTemp.cancelKey || (configTemp.discardStaleResponses ? lastKey : null)
}

function abortPreviousByRegistryKey(key: string | null) {
  if (!key)
    return
  const prev = cancelKeyTaskMap.get(key)
  if (prev?.task)
    abortTask(prev.task)
  cancelKeyTaskMap.delete(key)
}

/** 按 cancelKey 取消对应进行中的请求 */
export function abortRequestByKey(cancelKey: string) {
  abortPreviousByRegistryKey(cancelKey)
}

/** 取消所有进行中的请求 */
export function abortAllRequests() {
  activeRequestTasks.forEach(task => abortTask(task))
  activeRequestTasks.clear()
  cancelKeyTaskMap.clear()
  requestMap.clear()
}

const CANCEL_KEY = '__cancelKey'

function detachCancelKeyFromPayload(data: any) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return
  if (!(CANCEL_KEY in data))
    return
  const cancelKey = data[CANCEL_KEY]
  delete data[CANCEL_KEY]
  return cancelKey
}

function showRequestMessage(message: string, type: 'danger' | 'warning' | 'success' = 'danger') {
  const safeHeight = uni.getSystemInfoSync().statusBarHeight
  if (uni.$notify?.showNotify) {
    uni.$notify.showNotify({ type, message, safeHeight })
    return
  }
  uni.showToast({ title: message, icon: 'none' })
}

function tRequest(key: string, fallback: string) {
  try {
    const msg = i18n.global.t(`request.${key}`)
    return typeof msg === 'string' && msg !== `request.${key}` ? msg : fallback
  }
  catch {
    return fallback
  }
}

export function redirectPage(flag = false, loginFlag = false) {
  const pages = getCurrentPages()
  const currentPage = (pages?.[pages?.length - 1] as any)?.$page?.fullPath || ''
  if (currentPage && !currentPage?.includes('/pages/login/index') && !toLogin) {
    toLogin = true
    if (loginFlag && checkAuthList.findIndex(item => currentPage.includes(item)) === -1) {
      return uni.redirectTo({
        url: '/pages/login/index',
        success: () => { toLogin = false },
      })
    }
    if (loginFlag)
      return (toLogin = false)
    if (token)
      showRequestMessage(tRequest('sessionExpired', '登录状态已过期，请重新登录'))

    return uni.redirectTo({
      url: `/pages/login/index?returnUrl=${currentPage && !flag ? encodeURIComponent(currentPage) : ''}`,
      success: () => { toLogin = false },
    })
  }
}

export function appendQueryParams(url: string, params: Record<string, any>) {
  if (!params || typeof params !== 'object')
    return url

  const queryString = Object.keys(params)
    .sort()
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  if (!queryString)
    return url

  const hasQuery = url.includes('?')
  const endsWithQuestion = url.endsWith('?')
  const endsWithAmpersand = url.endsWith('&')

  let connector = '?'
  if (hasQuery)
    connector = endsWithQuestion || endsWithAmpersand ? '' : '&'

  return url + connector + queryString
}

export function getQueryParams(url: string) {
  let query = ''
  const idx = url.indexOf('?')
  if (idx !== -1)
    query = url.substring(idx + 1)

  const params: Record<string, string> = {}
  if (query) {
    query.split('&').forEach((pair) => {
      const [key, value] = pair.split('=')
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    })
  }
  return params
}

function createUUID() {
  const hex = '0123456789abcdef'
  const arr: string[] = []
  for (let i = 0; i < 36; i++)
    arr[i] = hex[Math.floor(Math.random() * 16)]
  arr[14] = '4'
  arr[19] = hex[(Number.parseInt(arr[19], 16) & 0x3) | 0x8]
  arr[8] = arr[13] = arr[18] = arr[23] = '-'
  return arr.join('')
}

function getDeviceFingerprint(): Record<string, any> {
  try {
    if (typeof uni.getDeviceInfo === 'function')
      return uni.getDeviceInfo() as Record<string, any>
  }
  catch { /* ignore */ }
  try {
    return uni.getSystemInfoSync() as Record<string, any>
  }
  catch {
    return {}
  }
}

export function getDeviceId() {
  let id = uni.getStorageSync('device_h5_id')
  if (id)
    return id
  const device = getDeviceFingerprint()
  const uuid = createUUID()
  const raw = [uuid, device.brand, device.model, device.system, device.platform].join('_')
  id = md5(raw).toString()
  uni.setStorageSync('device_h5_id', id)
  return id
}

let token = ''

async function useRequest<T = any>(
  method: string,
  path: string,
  data: any = {},
  config: RequestConfig = {},
): Promise<RequestResult<T>> {
  const userStore = useUserStore()
  token = config.token || userStore?.userInfo?.token || (userStore as any)?.token || ''
  const Authorization = token
  const finalMethod = (config.method || method || 'GET').toUpperCase()
  const configTemp: RequestConfig = { ...defaultConfig, ...config, method: finalMethod, token }
  configTemp.timeout = configTemp.timeout ?? defaultConfig.timeout
  if (path?.includes('public'))
    configTemp.checkAuth = false
  if (!token && configTemp.checkAuth)
    redirectPage()

  configTemp.url = (configTemp.proxy ? getBase(configTemp) : '') + path
  configTemp.data = data
  const payloadCancelKey = detachCancelKeyFromPayload(configTemp.data)
  if (payloadCancelKey)
    configTemp.cancelKey = payloadCancelKey
  if (config.cancelKey)
    configTemp.cancelKey = config.cancelKey
  if (configTemp.joinUrl)
    configTemp.url = appendQueryParams(configTemp.url!, configTemp.data)

  const lastKey = configTemp.latestKey || `${(configTemp.method || 'get').toLowerCase()} ${configTemp.url}`
  const registryKey = getRegistryKey(configTemp, lastKey)
  configTemp.__reqTimestamp = Date.now()
  if (configTemp.latest || configTemp.data?.pageNum)
    configTemp.discardStaleResponses = true

  if (shouldInterceptRequest(path, configTemp.url!, data)) {
    if (configTemp.showMessage)
      showRequestMessage(tRequest('networkAbnormal', '网络异常，请刷新重试!'))
    return Promise.reject({
      errMsg: 'request:invalid-params',
      code: -2,
      message: tRequest('invalidParams', '请求地址或参数包含 undefined，已拦截'),
    })
  }

  const reqKey = generateReqKey(configTemp)
  if (configTemp.sharePromise !== false) {
    const shareRes = requestMap.get(reqKey)
    if (shareRes)
      return shareRes
  }
  if (configTemp.loading) {
    loadingCount++
    useLoadingStore().open()
  }

  const sharePromise = new Promise<RequestResult<T>>((resolve, reject) => {
    let requestTask: UniApp.RequestTask | null = null
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null
    let finished = false

    const cleanup = () => {
      if (finished)
        return
      finished = true
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
        timeoutTimer = null
      }
    }

    if (registryKey) {
      try {
        abortPreviousByRegistryKey(registryKey)
      }
      catch { /* ignore */ }
    }

    const handleSuccess = (res: UniApp.RequestSuccessCallbackResult) => {
      if (finished)
        return
      cleanup()
      const body = (res?.data || {}) as any
      const { data: resData, code, message } = body
      const normalizedCode = code == 200 ? 0 : code
      if (normalizedCode === 401 && configTemp.checkAuth) {
        if (configTemp.loading)
          closeLoading()
        redirectPage()
        return reject({ data: resData, code: normalizedCode, message })
      }
      if (normalizedCode === 401 && !configTemp.checkAuth) {
        if (configTemp.loading)
          closeLoading()
        return resolve({ data: resData, code: normalizedCode, message })
      }
      if (normalizedCode !== 0) {
        if (configTemp.loading)
          closeLoading()
        const ignoreCodeList = [400, 401, 10001, 509]
        if (configTemp.showMessage && !ignoreCodeList.includes(normalizedCode) && message && message != '服务器内部错误')
          showRequestMessage(message)
        return reject({ data: resData, code: normalizedCode, message })
      }
      if (configTemp.loading)
        closeLoading()
      resolve({ data: resData, code: normalizedCode, message })
    }

    const handleFail = (err: any) => {
      if (finished)
        return
      const isAbort = err?.errMsg?.includes('abort') || err?.errMsg === 'request:fail abort'
      cleanup()
      if (configTemp.loading)
        closeLoading()
      if (isAbort)
        return reject({ data: null, code: -1, message: 'request aborted', aborted: true })
      if (configTemp.showMessage)
        showRequestMessage(err?.errMsg || tRequest('networkFailed', '网络请求失败，请稍后重试'))
      reject(err)
    }

    timeoutTimer = setTimeout(() => {
      if (finished)
        return
      finished = true
      requestTask?.abort?.()
      if (configTemp.loading)
        closeLoading()
      if (configTemp.showMessage)
        showRequestMessage(tRequest('timeout', '请求超时，请稍后重试'))
      reject({ errMsg: 'request:timeout', code: -1, message: tRequest('timeout', '请求超时，请稍后重试') })
    }, configTemp.timeout)

    requestTask = uni.request({
      url: configTemp.url!,
      data: configTemp.data,
      method: finalMethod as UniNamespace.RequestOptions['method'],
      timeout: configTemp.timeout,
      header: {
        Authorization,
        platformType: configTemp.platformType || platformType,
        visitorId: getDeviceId(),
        ...configTemp.header,
      },
      success: handleSuccess,
      fail: handleFail,
      complete() {
        requestMap.delete(generateReqKey(configTemp))
        if (requestTask)
          activeRequestTasks.delete(requestTask)
        if (registryKey) {
          const latest = cancelKeyTaskMap.get(registryKey)
          if (latest && latest.task === requestTask && latest.timestamp === configTemp.__reqTimestamp)
            cancelKeyTaskMap.delete(registryKey)
        }
      },
    })

    if (requestTask)
      activeRequestTasks.add(requestTask)

    if (registryKey) {
      try {
        cancelKeyTaskMap.set(registryKey, {
          task: requestTask,
          timestamp: configTemp.__reqTimestamp,
        })
      }
      catch { /* ignore */ }
    }
  })

  if (configTemp.sharePromise !== false)
    requestMap.set(generateReqKey(configTemp), sharePromise)

  return sharePromise
}

export async function get<T = any>(path: string, data: any = {}, config: RequestConfig = {}) {
  return await useRequest<T>('GET', path, data, config)
}
export async function post<T = any>(path: string, data: any = {}, config: RequestConfig = {}) {
  return await useRequest<T>('POST', path, data, config)
}
export async function del<T = any>(path: string, data: any = {}, config: RequestConfig = {}) {
  return await useRequest<T>('DELETE', path, data, config)
}
export async function put<T = any>(path: string, data: any = {}, config: RequestConfig = {}) {
  return await useRequest<T>('PUT', path, data, config)
}

export default useRequest
