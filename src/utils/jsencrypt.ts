import JSEncrypt from 'jsencrypt'

function normalizePemKey(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim()
}

/** 通用 RSA 公钥（来自环境变量） */
export const publicKey = normalizePemKey(import.meta.env.VITE_RSA_PUBLIC_KEY || '')

/** 文件下载等场景公钥，未配置时回退到 publicKey */
export const enterprisePublicKey = normalizePemKey(
  import.meta.env.VITE_RSA_ENTERPRISE_PUBLIC_KEY || import.meta.env.VITE_RSA_PUBLIC_KEY || '',
)

/** 加密 */
export function encrypt(txt: string, key = publicKey, _flag?: boolean) {
  if (!key) {
    console.warn('[jsencrypt] RSA public key is not configured (VITE_RSA_PUBLIC_KEY)')
    return false
  }
  const encryptor = new JSEncrypt()
  encryptor.setPublicKey(key)
  return encryptor.encrypt(txt)
}

function parseStorage(value: unknown): any {
  if (!value)
    return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    }
    catch {
      return null
    }
  }
  return value
}

function getToken() {
  try {
    const storeToken = useUserStore().userInfo?.token
    if (storeToken)
      return storeToken
  }
  catch { /* pinia 尚未就绪时回退本地存储 */ }
  const user = parseStorage(uni.getStorageSync('user'))
  const token = user?.userInfo?.token || user?.token
  if (token)
    return token
  const info = parseStorage(uni.getStorageSync('userInfo'))
  return info?.token || ''
}

/** 受保护资源下载地址：H5 用相对路径；小程序 / App 拼上 VITE_BASE_URL */
export function formatUrl(url: string) {
  if (!url)
    return url
  let encryptToken = encrypt(getToken(), enterprisePublicKey, true)
  encryptToken = encodeURIComponent(encryptToken || '')
  const path = `${apiPrefix}/file/image/download?imagePath=${url}&token=${encryptToken}`
  // #ifdef H5
  return path
  // #endif
  // #ifndef H5
  return baseUrl + path
  // #endif
}

export async function createTempUrl(url: string, type = 'blob') {
  if (!url)
    return
  const signed = formatUrl(url)
  // #ifdef H5
  const res = await fetch(signed)
  const blob = await res.blob()
  if (type == 'blob')
    return URL.createObjectURL(blob)
  if (type == 'base64') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
  return ''
  // #endif
  // #ifndef H5
  return signed
  // #endif
}

/** 批量替换富文本中的链接 */
export function replaceMediaLinks(htmlContent: string): string {
  let updatedContent = htmlContent
  const replaceAttrList = ['img', 'video', 'audio', 'source']
  replaceAttrList.forEach((element) => {
    const regex = new RegExp(`<${element}[^>]+src="([^"]+)"[^>]*>`, 'g')
    updatedContent = updatedContent.replace(regex, (match: string, p1: string) => {
      return match.replace(p1, formatUrl(p1))
    })
  })
  return updatedContent
}
