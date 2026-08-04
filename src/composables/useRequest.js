import md5 from 'crypto-js/md5'
const defaultConfig = {
  method: 'POST',
  loading: true,
  proxy: true,
  showMessage: true,
  checkAuth: true,
  sharePromise: true,
  joinUrl: false, // 是否拼接url参数
  timeout: 20000, // 请求超时时间，毫秒
}
// let base = '/jgzf/api'

let loadingCount = 0
const closeLoading = () => {
  if (loadingCount > 0) loadingCount--
  if (loadingCount === 0) {
    useLoadingStore().close()
  }
}

export let platformType = ''

// #ifdef MP-WEIXIN
platformType = 5
// #endif

// #ifdef APP-PLUS
platformType = 2
// #endif

// #ifdef H5
platformType = 4
// #endif

const getBase = (config) => {
  // var pages = getCurrentPages()// 获取栈实例
  // const currentPage = pages?.[pages?.length - 1]?.['$page']?.['fullPath'] || ''//当前页面路径(带参数)
  // const apiBase = config?.apiBase || ((useUserStore().userType == 1 || currentPage?.includes('/pages-sub1')) ? '/api' : '/jgzf/api')
  let basePath = ''
  const apiBase = config?.apiBase || '/fwz'
  // #ifdef H5
  basePath = apiBase
  // #endif
  // #ifdef MP-WEIXIN || APP-PLUS
  basePath = baseUrl + apiBase
  // #endif
  return basePath
}

// 无需登录即可访问的页面白名单
const checkAuthList = []

// 相同 reqKey 的 in-flight 请求共享 Promise（dedupe）
const requestMap = new Map()
// cancelKey / 同接口 lastKey → 最新 RequestTask，用于按 key cancel 或分页 discard 旧请求
const cancelKeyTaskMap = new Map()
// 所有进行中的 RequestTask，供 abortAllRequests 全量 cancel
const activeRequestTasks = new Set()

// 递归排序对象键值
const sortObjectKeys = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sortObjectKeys)
  return Object.keys(obj).sort().reduce((acc, key) => {
    acc[key] = sortObjectKeys(obj[key])
    return acc
  }, {})
}

const hasUndefinedValue = (value) => {
  if (value === undefined) return true
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(hasUndefinedValue)
  return Object.values(value).some(hasUndefinedValue)
}

const hasUndefinedSegment = (value) => {
  return typeof value === 'string' && value.includes('undefined')
}

const shouldInterceptRequest = (path, url, data) => {
  let params = JSON.parse(JSON.stringify(data))
  if (hasUndefinedSegment(path) || hasUndefinedSegment(url)) return true
  return hasUndefinedValue(params)
}

// 根据请求方式，url等生成请求key
const generateReqKey = (config) => {
  const { method, url, data, requestKey, token } = config;
  const stableData = JSON.stringify(sortObjectKeys(data || {}));
  const key = requestKey || [method ? method.toUpperCase() : 'GET', url, encodeURIComponent(stableData), token].join("&");
  config.requestKey = key;
  return key
}

let toLogin = false

const abortTask = (task) => {
  try {
    task?.abort?.()
  } catch (e) { }
}

const getRegistryKey = (configTemp, lastKey) => {
  return configTemp.cancelKey || (configTemp.discardStaleResponses ? lastKey : null)
}

const abortPreviousByRegistryKey = (key) => {
  if (!key) return
  const prev = cancelKeyTaskMap.get(key)
  if (prev?.task) abortTask(prev.task)
  cancelKeyTaskMap.delete(key)
}

/** 按 cancelKey 取消对应进行中的请求（如 useList 实例销毁时） */
export const abortRequestByKey = (cancelKey) => {
  abortPreviousByRegistryKey(cancelKey)
}

/** 取消所有进行中的请求 */
export const abortAllRequests = () => {
  activeRequestTasks.forEach((task) => abortTask(task))
  activeRequestTasks.clear()
  cancelKeyTaskMap.clear()
  requestMap.clear()
}

const CANCEL_KEY = '__cancelKey'

function detachCancelKeyFromPayload(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return
  if (!(CANCEL_KEY in data)) return
  const cancelKey = data[CANCEL_KEY]
  delete data[CANCEL_KEY]
  return cancelKey
}

export const redirectPage = (flag = false, loginFlag = false) => {
  var pages = getCurrentPages()// 获取栈实例
  const currentPage = pages?.[pages?.length - 1]?.['$page']?.['fullPath'] || ''//当前页面路径(带参数)
  if (currentPage && !currentPage?.includes('/pages/login/index') && !toLogin) {
    toLogin = true
    // 有登录状态，且不在校验白名单
    if (loginFlag && checkAuthList.findIndex(item => currentPage.includes(item)) == -1) {
      return uni.redirectTo({
        url: '/pages/login/index',
        success: () => toLogin = false
      })
    }
    if (loginFlag) return toLogin = false
    if (token) {
      uni.$notify.showNotify({
        type: 'danger',
        message: '登录状态已过期，请重新登录',
        safeHeight: uni.getSystemInfoSync().statusBarHeight
      })
    }
    return uni.redirectTo({
      url: '/pages/login/index?returnUrl=' + (currentPage && !flag ? encodeURIComponent(currentPage) : ''),
      success: () => toLogin = false
    })
    // return uni.showModal({
    //   title: '系统提示',
    //   content: '登录状态已过期，请重新登录',
    //   showCancel: false,
    //   confirmText: '去登录',
    //   confirmColor: '#108ee9',
    //   success: () => {
    //     uni.redirectTo({
    //       url: '/pages/login/index?returnUrl=' + (currentPage && !flag ? encodeURIComponent(currentPage) : ''),
    //       success: () => toLogin = false
    //     })
    //   }
    // })
  }
}

export function appendQueryParams(url, params) {
  if (!params || typeof params !== 'object') return url;

  const queryString = Object.keys(params)
    .sort()
    .filter(key => params[key] !== undefined && params[key] !== null)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  if (!queryString) return url;

  const hasQuery = url.includes('?');
  const endsWithQuestion = url.endsWith('?');
  const endsWithAmpersand = url.endsWith('&');

  let connector = '?';
  if (hasQuery) {
    connector = endsWithQuestion || endsWithAmpersand ? '' : '&';
  }

  return url + connector + queryString;
}


export function getQueryParams(url) {
  let query = ''

  // 如果有 ? 才处理
  const idx = url.indexOf('?')
  if (idx !== -1) {
    query = url.substring(idx + 1)
  }

  const params = {}
  if (query) {
    query.split('&').forEach(pair => {
      const [key, value] = pair.split('=')
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    })
  }

  return params
}

function createUUID() {
  const hex = "0123456789abcdef"
  const arr = []

  for (let i = 0; i < 36; i++) {
    arr[i] = hex[Math.floor(Math.random() * 16)]
  }

  arr[14] = "4"
  arr[19] = hex[(parseInt(arr[19], 16) & 0x3) | 0x8]

  arr[8] = arr[13] = arr[18] = arr[23] = "-"

  return arr.join("")
}
const device = uni.getDeviceInfo()

export function getDeviceId() {
  let id = uni.getStorageSync("device_h5_id")
  if (id) return id
  const uuid = createUUID()
  const raw = [
    uuid,
    device.brand,
    device.model,
    device.system,
    device.platform
  ].join("_")
  id = md5(raw).toString()
  uni.setStorageSync("device_h5_id", id)
  return id
}


let token = ''
// 全局请求封装
async function useRequest(method, path, data = {}, config = {}) {
  const userStore = useUserStore()
  token = config.token || userStore?.userInfo?.token || userStore?.token || ''
  let Authorization = token
  const finalMethod = (config.method || method || 'GET').toUpperCase()
  const configTemp = { ...defaultConfig, ...config, method: finalMethod, token }
  configTemp.timeout = configTemp.timeout ?? defaultConfig.timeout
  if (path?.includes('public')) configTemp.checkAuth = false
  if (!token && configTemp.checkAuth) redirectPage()

  configTemp.url = (configTemp.proxy ? getBase(configTemp) : '') + path
  configTemp.data = data
  const payloadCancelKey = detachCancelKeyFromPayload(configTemp.data)
  if (payloadCancelKey) configTemp.cancelKey = payloadCancelKey
  if (config.cancelKey) configTemp.cancelKey = config.cancelKey
  if (configTemp.joinUrl) configTemp.url = appendQueryParams(configTemp.url, configTemp.data)

  const lastKey = configTemp.latestKey || `${(configTemp.method || "get").toLowerCase()} ${configTemp.url}`
  const registryKey = getRegistryKey(configTemp, lastKey)
  configTemp.__reqTimestamp = Date.now()
  // 只有分页通过这个方法开启
  if (configTemp.latest || configTemp.data?.pageNum) configTemp.discardStaleResponses = true

  if (shouldInterceptRequest(path, configTemp.url, data)) {
    const safeHeight = uni.getSystemInfoSync().statusBarHeight
    if (configTemp.showMessage) {
      uni.$notify?.showNotify({
        type: 'danger',
        message: '网络异常，请刷新重试!',
        safeHeight,
      })
    }
    return Promise.reject({ errMsg: 'request:invalid-params', code: -2, message: '请求地址或参数包含 undefined，已拦截' })
  }

  // 共享 key
  const reqKey = generateReqKey(configTemp)

  if (configTemp.sharePromise !== false) {
    const shareRes = requestMap.get(reqKey)
    if (shareRes) return shareRes
  }
  if (configTemp.loading) {
    loadingCount++
    useLoadingStore().open()
  };

  const sharePromise = new Promise((resolve, reject) => {
    const safeHeight = uni.getSystemInfoSync().statusBarHeight
    let requestTask = null
    let timeoutTimer = null
    let finished = false

    const cleanup = () => {
      if (finished) return
      finished = true
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
        timeoutTimer = null
      }
    }

    // cancelKey 或分页场景：发起新请求前 cancel 同 key 的上一次请求
    if (registryKey) {
      try {
        abortPreviousByRegistryKey(registryKey)
      } catch (e) { }
    }

    const handleSuccess = ({ data: { data, code, message }, regeocode, status }) => {
      if (finished) return
      cleanup()
      const normalizedCode = code == 200 ? 0 : code
      if (normalizedCode === 401 && configTemp.checkAuth) {
        if (configTemp.loading) closeLoading()
        redirectPage()
        return reject({ data, code: normalizedCode, message })
      }
      if (normalizedCode === 401 && !configTemp.checkAuth) {
        if (configTemp.loading) closeLoading()
        return resolve({ data, code: normalizedCode, message })
      }
      if (normalizedCode !== 0) {
        if (configTemp.loading) closeLoading()
        const ignoreCodeList = [400, 401, 10001, 509]
        if (configTemp.showMessage && !ignoreCodeList.includes(normalizedCode) && message && message != '服务器内部错误') {
          uni.$notify?.showNotify({
            type: 'danger',
            message,
            safeHeight
          })
        }
        return reject({ data, code: normalizedCode, message })
      }
      if (configTemp.loading) closeLoading()
      resolve({ data, code: normalizedCode, message })
    }

    const handleFail = (err) => {
      if (finished) return
      const isAbort = err?.errMsg?.includes('abort') || err?.errMsg === 'request:fail abort'
      cleanup()
      if (configTemp.loading) closeLoading()
      if (isAbort) {
        return reject({ data: null, code: -1, message: 'request aborted', aborted: true })
      }
      reject(err)
    }

    timeoutTimer = setTimeout(() => {
      if (finished) return
      finished = true
      requestTask?.abort?.()
      if (configTemp.loading) closeLoading()
      reject({ errMsg: 'request:timeout', code: -1, message: '请求超时，请稍后重试' })
    }, configTemp.timeout)

    requestTask = uni.request({
      method,
      header: {
        Authorization,
        platformType: configTemp.platformType || platformType,
        visitorId: getDeviceId(),
      },
      timeout: configTemp.timeout,
      ...configTemp,
      success: handleSuccess,
      fail: handleFail,
      complete(e) {
        const pages = getCurrentPages()// 获取栈实例
        const currentPage = pages?.[pages?.length - 1]?.['$page']?.['fullPath'] || ''//当前页面路径(带参数)
        // if (e.statusCode == 403 && !currentPage?.includes('/pages/nopermission')) return uni.redirectTo({ url: '/pages/nopermission' })
        // if (useUserStore().userType == 1 && token && userStore.loginFlag != 1 && configTemp.checkAuth) redirectPage(false, true)
        requestMap.delete(generateReqKey(configTemp))
        if (requestTask) activeRequestTasks.delete(requestTask)
        if (registryKey) {
          if (configTemp.discardStaleResponses && configTemp.loading) closeLoading()
          const latest = cancelKeyTaskMap.get(registryKey)
          if (latest && latest.task === requestTask && latest.timestamp === configTemp.__reqTimestamp) {
            cancelKeyTaskMap.delete(registryKey)
          }
        }
      },
    })

    if (requestTask) {
      activeRequestTasks.add(requestTask)
    }

    if (registryKey) {
      try {
        cancelKeyTaskMap.set(registryKey, {
          task: requestTask,
          timestamp: configTemp.__reqTimestamp,
        })
      } catch (e) { }
    }
  })
  if (configTemp.sharePromise !== false) {
    requestMap.set(generateReqKey(configTemp), sharePromise)
  }
  return sharePromise
}

export const get = async (path, data = {}, config = {}) => await useRequest('GET', path, data, config)
export const post = async (path, data = {}, config = {}) => await useRequest('POST', path, data, config)
export const del = async (path, data = {}, config = {}) => await useRequest('DELETE', path, data, config)
export const put = async (path, data = {}, config = {}) => await useRequest('PUT', path, data, config)


