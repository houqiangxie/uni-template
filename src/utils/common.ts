/**
 *
 * @param target 源数据
 * @returns  copyTarget
 */
export function deepClone(target: any): any {
  if (target && typeof target === 'object') {
    const result: any = Array.isArray(target) ? [] : {}
    for (const key in target) {
      if (typeof target[key] === 'object')
        result[key] = deepClone(target[key])
      else
        result[key] = target[key]
    }
    return result
  }
  return target
}

// 根据key返回配置列
export function getConfigCol(key: string, list: Array<{ [key: string]: string }>, fieldKey: string = 'key'): any {
  return list.find(listItem => listItem[fieldKey] == key) ?? {}
}

// 文件下载
export class Download {
  constructor(url: string, name: string = '下载文件') {
    // const isMp4 = url?.includes('.mp4')
    url = formatUrl(url)
    // if (isMp4) {
    //   uni.setStorageSync('webviewUrl', url)
    //   uni.navigateTo({ url: `/pages-sub1/webview?url=${baseUrl}/wxStaticFile/video.html` })
    // }
    // #ifdef H5
    // if (url?.startsWith('/file'))url = `/enterprise_h5${url}`
    this.openDownload(url, name)
    // #endif
    // #ifndef H5
    // if (url?.startsWith('/file')) url = baseUrl + url
    uni.downloadFile({
      url,
      success: function (res) {
        var filePath = res.tempFilePath;
        uni.openDocument({
          filePath: filePath,
          showMenu: true,
          success: function (res) {
            console.log('打开文档成功');
          }
        });
        // var filePath = res.tempFilePath;
        // uni.saveFile({
        //   tempFilePath: filePath,
        //   success: function (res) {
        //     uni.showToast({
        //       title: '下载成功',
        //       icon: 'none'
        //     })
        //   }
        // });
      }
    });
    // #endif
  }

  openDownload(urls: string, name: string) {
    const nameStr = name.replace(/(.*)(\..*)/, '$1')
    const link = urls
    const lastIndex = link.split('.').length - 1
    const type = link.split('.')[lastIndex]
    if (['jpg', 'png', 'jpeg', 'gif'].includes(type)) {
      // 图片
      this.getBase64Image2(link, (image: string) => {
        this.XMLHttpRequest(image, `${nameStr}.${type}`, 'image')
      })
    }
    else {
      // 非图片
      this.XMLHttpRequest(link, name, 'file')
    }
  }

  XMLHttpRequest(link: string, name: string, type: string) {
    const x = new XMLHttpRequest()
    x.open('GET', link, true)
    x.responseType = 'blob'
    x.onload = function () {
      const blob = x.response
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name || ''
      a.click()
    }
    x.send()
  }

  getBase64Image2(img: string, cb: Function) {
    const canvas = document.createElement('canvas')
    const image = new Image()
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = `${img}?v=${Math.random()}`
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d')
      ctx?.drawImage(image, 0, 0, image.width, image.height)
      const ext = image.src
        .substring(image.src.lastIndexOf('.') + 1)
        .toLowerCase()
      const base64 = canvas.toDataURL(`image/${ext}`)
      cb(base64)
    }
  }

  dataURLtoBlob(base64: string, cb: Function) {
    const arr = base64.split(',')
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n > 0) {
      n -= 1
      u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr])
    cb(blob)
  }
}

export function dateFormat(time, type = 'date') {
  const date = new Date(time)
  const year = date.getFullYear()
  // 在日期格式中，月份是从0开始的，因此要加0，使用三元表达式在小于10的前面加0，以达到格式统一  如 09:11:05
  const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
  const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
  const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
  const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
  // 拼接
  // return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
  return type == 'date' ? (`${year}-${month}-${day}`) : (`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`)
}

export function getUrl(url) {
  // return new URL(`/src/static/${url}`, import.meta.url).href
  return baseUrl +`/wxStaticFile/static/${url}`
}

// 根据key,返回所有父级数据
export const treeFindPath = (tree: any, func: Function, path: any[] = []): any => {
  if (!tree) return [];
  for (const data of tree) {
    //记得修改这里，你想要的字段
    path.push(data);
    if (func(data)) return path;
    if (data.children) {
      const findChildren = treeFindPath(data.children, func, path);
      if (findChildren.length) return findChildren;
    }
    path.pop();
  }
  return [];
};


export const  debounce=(func, delay, immediate)=> {
  let timer;
  return function () {
    if (timer) clearTimeout(timer);
    if (immediate) {
      // 复杂的防抖函数
      // 判断定时器是否为空，如果为空，则会直接执行回调函数
      let firstRun = !timer;
      // 不管定时器是否为空，都会重新开启一个新的定时器,不断输入，不断开启新的定时器，当不在输入的delay后，再次输入就会立即执行回调函数
      timer = setTimeout(() => {
        timer = null;
      }, delay);
      if (firstRun) {
        func.apply(this, arguments);
      }
      // 简单的防抖函数
    } else {
      timer = setTimeout(() => {
        func.apply(this, arguments);
      }, delay);
    }
  };
}




/**
 ** 加法函数，用来得到精确的加法结果
 ** 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
 ** 调用：accAdd(arg1,arg2)
 ** 返回值：arg1加上arg2的精确结果
 **/
export function accAdd(arg1, arg2) {
  let r1, r2, m
  try {
    r1 = arg1.toString().split('.')[1].length
  }
  catch (e) {
    r1 = 0
  }
  try {
    r2 = arg2.toString().split('.')[1].length
  }
  catch (e) {
    r2 = 0
  }
  m = 10 ** Math.max(r1, r2)
  return (arg1 * m + arg2 * m) / m
}

/**
 ** 减法函数，用来得到精确的减法结果
 ** 说明：javascript的减法结果会有误差，在两个浮点数相减的时候会比较明显。这个函数返回较为精确的减法结果。
 ** 调用：accSub(arg1,arg2)
 ** 返回值：arg1加上arg2的精确结果
 **/
export function accSub(arg1, arg2) {
  let r1, r2, m, n
  try {
    r1 = arg1.toString().split('.')[1].length
  }
  catch (e) {
    r1 = 0
  }
  try {
    r2 = arg2.toString().split('.')[1].length
  }
  catch (e) {
    r2 = 0
  }
  m = 10 ** Math.max(r1, r2) // last modify by deeka //动态控制精度长度
  n = r1 >= r2 ? r1 : r2
  return ((arg1 * m - arg2 * m) / m).toFixed(n)
}

/**
 ** 乘法函数，用来得到精确的乘法结果
 ** 说明：javascript的乘法结果会有误差，在两个浮点数相乘的时候会比较明显。这个函数返回较为精确的乘法结果。
 ** 调用：accMul(arg1,arg2)
 ** 返回值：arg1乘以 arg2的精确结果
 **/

export function accMul(arg1, arg2) {
  let m = 0
  const s1 = arg1.toString()
  const s2 = arg2.toString()
  try {
    m += s1.split('.')[1] ? s1.split('.')[1].length : ''
  }
  catch (e) { }
  try {
    m += s2.split('.')[1] ? s2.split('.')[1].length : ''
  }
  catch (e) { }
  return (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) / 10 ** m
}

/**
 ** 除法函数，用来得到精确的除法结果
 ** 说明：javascript的除法结果会有误差，在两个浮点数相除的时候会比较明显。这个函数返回较为精确的除法结果。
 ** 调用：accDiv(arg1,arg2)
 ** 返回值：arg1除以arg2的精确结果
 **/
export function accDiv(arg1, arg2) {
  let t1 = 0
  let t2 = 0
  let r1
  let r2
  try {
    t1 = arg1.toString().split('.')[1].length
  }
  catch (e) { }
  try {
    t2 = arg2.toString().split('.')[1].length
  }
  catch (e) { }
  r1 = Number(arg1.toString().replace('.', ''))
  r2 = Number(arg2.toString().replace('.', ''))
  return (r1 / r2) * 10 ** (t2 - t1)
}

// 万元转换元
export function moneyFormatToY(money, currentType = 'Y') {
  let price = +money || 0
  console.log('price: ', price)
  if (currentType == 'WY')
    price = accMul(money, 10000) || 0
  price = price.toFixed(2)
  return +price
}
// 元转换万元
export function moneyFormatToWY(money, currentType = 'WY') {
  let price = money || 0
  if (currentType == 'WY')
    price = accDiv(money, 10000) || 0
  price = String(price)
  if (price.includes('.') && price.length > 8)
    price = (+price).toFixed(6)
  return +price
}
// 自动转换单位
export function autoFormatMoney(money, currentType = 'WY') {
  return currentType == 'WY' ? moneyFormatToWY(money, currentType) : moneyFormatToY(money, currentType)
}

export function formatDecimalMoney(money = '', digit = 2) {
  const temp = money?.replace(new RegExp(`^\\D*([0-9]\\d*\\.?\\d{0,${digit}})?.*$`), '$1')
  // if(temp?.endsWith('.')) temp = temp.replace('.','')
  return temp
}

export function autoTransformUnit(value, currentType = 'WY') {
  if (!value)
    return ''
  let price = currentType == 'WY' ? accMul(value, 10000) : accDiv(value, 10000)
  price = String(price)
  if (price.includes('.') && price.length > 8)
    price = (+price).toFixed(6)
  return price.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (currentType == 'WY' ? '元' : '万元')
}


/**
 * 获取节点信息
 * @param selector 节点选择器 #id,.class
 * @param all 是否返回所有 selector 对应的节点
 * @param scope 作用域（支付宝小程序无效）
 * @param useFields 是否使用 fields 方法获取节点信息
 * @returns 节点信息或节点信息数组
 */
export type RectResultType<T extends boolean> = T extends true ? UniApp.NodeInfo[] : UniApp.NodeInfo
export function getRect<T extends boolean>(selector: string, all: T, scope?: any, useFields?: boolean): Promise<RectResultType<T>> {
  return new Promise<RectResultType<T>>((resolve, reject) => {
    let query: UniNamespace.SelectorQuery | null = null
    if (scope) {
      query = uni.createSelectorQuery().in(scope)
    } else {
      query = uni.createSelectorQuery()
    }

    const method = all ? 'selectAll' : 'select'

    const callback = (rect: UniApp.NodeInfo | UniApp.NodeInfo[]) => {
      if (all && Array.isArray(rect) && rect.length > 0) {
        resolve(rect as RectResultType<T>)
      } else if (!all && rect) {
        resolve(rect as RectResultType<T>)
      } else {
        reject(new Error('No nodes found'))
      }
    }

    if (useFields) {
      query[method](selector).fields({ size: true, node: true }, callback).exec()
    } else {
      query[method](selector).boundingClientRect(callback).exec()
    }
  })
}


// 格式化文本
export const formatStatus = (list: any = [], value: any) => list.find((item: any) => item.value == value)?.text || ''


// 培训学时转换
export function trainingHours(value, num) {
  if (value > 60 || (40 <= value && value <= 60)) {
    num++
    value -= 60
    return trainingHours(value, num)
  } else if (10 <= value && value <= 39) {
    num += 0.5
    value -= 39
    return trainingHours(value, num)
  } else {
    return num
  }
}