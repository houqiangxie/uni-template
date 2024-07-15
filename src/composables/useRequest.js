/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-09 18:04:04
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-07-15 16:48:34
 */
// import logout from "@/utils/logout.js"

const defaultConfig = {
  method: 'POST',
  loading: true,
  proxy: true,
  showMessage: true,
  checkAuth: true,
  sharePromise: true,
}

let base = '/gateway'
// #ifdef MP-WEIXIN
  base = baseUrl+'/api'
// #endif


const whiteList = [
  '/pages/login/index',
  '/pages-sub1/area/riskDetail',
  '/pages-sub1/interestedTarget/vertify',
  '/pages-sub1/interestedTarget/relUnitAdd',
  '/pages-sub1/interestedTarget/relPersonAdd',
  '/pages-sub1/interestedTarget/relPersonApproval',
  '/pages-sub1/interestedTarget/relUnitApproval',
  '/pages-sub1/riskJob/index',
]


let firstLoad = true
const getValidToken = async () => {
  const str = uni.getStorageSync('user')
  let token=''
  if (str) {
    const user = JSON.parse(str)
    token = user?.userInfo?.token
  }
  return new Promise((resolve, reject) => {
    uni.request({
      method:'POST',
      header: {
        Authorization:token,
      },
      url: base+'/task/getUserScore',
      success({ data: { code } }) {
        let flag = code == 401 ? false : true
        // #ifdef MP-WEIXIN
        // if (!flag) 
        // #endif
        // #ifdef H5
        if(!flag&&firstLoad) uni.removeStorageSync('user')
        // #endif
        resolve(flag)
      },
      fail(err) {
        reject(false)
      },
      complete() {
        firstLoad=false
      },
    })
  })
}


const requestMap = new Map()

// 根据请求方式，url等生成请求key
const generateReqKey = (config) => {
  const { method, url, data, requestKey } = config;
  const key = requestKey || [method, url, encodeURIComponent(JSON.stringify(data||{}))].join("&");
  config.requestKey = key;
  return key
}

// 全局请求封装
async function useRequest(method, path, data = {}, config = {}) {
//   if(firstLoad)await getValidToken()
  let token = null
  const str = uni.getStorageSync('user')
  if (str) {
    const user = JSON.parse(str)
    token = user?.userInfo?.token
  }
  if (!token) {
    var pages = getCurrentPages()// 获取栈实例
    const route= pages?.[pages?.length - 1]?.['$page']
    const currentPage = route?.['fullPath'] || ''//当前页面路径(带参数)
    if(currentPage&&whiteList.includes(route.path))token = uni.getStorageSync('userInfo')?.token
    else {
      if (currentPage&&!currentPage?.includes('/pages/login/index')) return uni.navigateTo({ url: '/pages/login/index?returnUrl=' + (currentPage ? encodeURIComponent(currentPage) : '') })
      // else return
      // else return uni.redirectTo({ url: '/pages/login/index'})
    }
  }

  const Authorization = token
  const configTemp = { ...defaultConfig, method, ...config }
  configTemp.url= (configTemp.proxy ? base : '') + path
  configTemp.data= data
  const shareRes =requestMap.get(generateReqKey(configTemp))
  if(shareRes) return shareRes
  
  if (configTemp.loading) {
    uni.showLoading({
      title: '加载中',
      mask: true,
    })
  };
  const sharePromise= new Promise((resolve, reject) => {
    uni.request({
      method,
      header: {
        Authorization,
      },
      url: (configTemp.proxy ? base : '') + path,
      ...configTemp,
      success({ data: { data, code, message }, regeocode, status }) {
        uni.hideLoading()
        if (code === 401 && configTemp.checkAuth) {
          var pages = getCurrentPages()// 获取栈实例
          const currentPage = pages?.[pages?.length - 1]?.['$page']?.['fullPath'] ||''//当前页面路径(带参数)
          if (currentPage && !currentPage?.includes('/pages/login/index')) return uni.navigateTo({ url: '/pages/login/index?returnUrl=' + (currentPage ? encodeURIComponent(currentPage) : '') })
          // else return
        }
        if (code === 401 && !configTemp.checkAuth) { //不校验
         return resolve({ data, code, message })
        }
        if (code !== 0) {
          if(configTemp.showMessage)uni.showToast({
            icon: 'none',
            duration: 4000,
            title: message||'服务响应失败',
          })
          reject({ data, code, message })
        }
        resolve({ data, code, message })
      },
      fail(err) {
        uni.hideLoading()
        if(configTemp.showMessage)uni.showToast({
          icon: 'none',
          title: '服务响应失败',
        })
        
        reject(err)
      },
      complete() {
        requestMap.delete(generateReqKey(configTemp))
        // uni.hideLoading()
      },
    })
  })
  requestMap.set(generateReqKey(configTemp), sharePromise)
  return sharePromise
}

export const get =async (path, data = {}, config = {}) =>await useRequest('GET', path, data, config)
export const post =async (path, data = {}, config = {}) =>await useRequest('POST', path, data, config)
export const del =async (path, data = {}, config = {}) =>await useRequest('DELETE', path, data, config)
export const put =async (path, data = {}, config = {}) =>await useRequest('PUT', path, data, config)

