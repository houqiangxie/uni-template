/**
 * @param target 源数据
 * @returns copyTarget
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

/** 根据 key 返回配置列 */
export function getConfigCol(key: string, list: Array<{ [key: string]: string }>, fieldKey: string = 'key'): any {
  return list.find(listItem => listItem[fieldKey] == key) ?? {}
}

/** 已是绝对地址 / 本地临时文件时不再拼 staticBaseUrl */
function isAbsoluteAssetUrl(url: string) {
  return /^(?:https?:)?\/\/|^data:|^blob:|^wxfile:|^file:|^content:/i.test(url)
}

export function getUrl(url: string) {
  if (!url)
    return ''
  if (isAbsoluteAssetUrl(url))
    return url
  const path = url.startsWith('/') ? url.slice(1) : url
  return `${staticBaseUrl}${path}`
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate = false,
) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timer)
      clearTimeout(timer)
    if (immediate) {
      const firstRun = !timer
      timer = setTimeout(() => {
        timer = null
      }, delay)
      if (firstRun)
        func.apply(this, args)
    }
    else {
      timer = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }
}

export const formatStatus = (list: any = [], value: any) => list.find((item: any) => item.value == value)?.text || ''
