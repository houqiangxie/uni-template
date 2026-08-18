/** 去除末尾斜杠 */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

/** 读取 API 基础地址 */
function resolveEnvBaseUrl(): string {
  return trimTrailingSlash(import.meta.env.VITE_BASE_URL || '')
}

/**
 * API / 资源基础地址
 * - H5：仅使用 window.location.origin，适配同一包部署到多域名，不读 VITE_BASE_URL
 * - 小程序 / App：使用对应环境 .env 中的 VITE_BASE_URL
 */
// #ifdef H5
export const baseUrl = trimTrailingSlash(
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '',
)
// #endif

// #ifndef H5
export const baseUrl = resolveEnvBaseUrl()
// #endif

/** 请求路径前缀（如 /api），拼在 baseUrl 之后 */
export const apiPrefix = trimTrailingSlash(import.meta.env.VITE_API_PREFIX || '/api') || '/api'

/**
 * 远程静态资源路径段（相对站点根），默认 /wxStaticFile/static
 * 可通过 VITE_STATIC_PREFIX 覆盖；勿以 / 结尾
 */
export const staticPrefix = trimTrailingSlash(
  import.meta.env.VITE_STATIC_PREFIX || '/wxStaticFile/static',
) || '/wxStaticFile/static'

/** 远程静态资源根路径：baseUrl + staticPrefix + / */
export const staticBaseUrl = baseUrl
  ? `${baseUrl}${staticPrefix}/`
  : `${staticPrefix}/`

// 应用标题
export const appTitle = import.meta.env.VITE_APP_TITLE || 'Uni 模板'

/** 解析环境变量布尔值（true / 1 为真） */
function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '')
    return defaultValue
  return value === 'true' || value === '1'
}

/**
 * 是否启用多语言（语言切换、导航栏标题随语言变化等）
 * 关闭后仍可使用 t() 展示默认语言文案，但不会加载其它语言包
 */
export const enableI18n = parseEnvBool(import.meta.env.VITE_ENABLE_I18N, false)

/** 远程语言包版本号，变更后客户端会重新拉取 JSON（可选，与图片资源 ?v= 同理） */
export const localeRemoteVersion = import.meta.env.VITE_LOCALE_REMOTE_VERSION || ''

// 当前环境
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD

// 环境信息
export const envInfo = {
  mode: import.meta.env.MODE,
  baseUrl,
  staticBaseUrl,
  isDevelopment,
  isProduction,
}
