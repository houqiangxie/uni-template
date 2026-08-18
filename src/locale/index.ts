import { createI18n } from 'vue-i18n'
import { fetchAllLocaleMessages } from './load-messages'
import enUS from './en-US'
import zhCN from './zh-CN'
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type LocaleType,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from './types'

/** 已加载的语言包 */
const loadedLocales = new Set<LocaleType>()

function registerLocaleMessages(locale: LocaleType, messages: object): void {
  i18n.global.setLocaleMessage(locale, messages as typeof zhCN)
  loadedLocales.add(locale)
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: { [DEFAULT_LOCALE]: zhCN },
  globalInjection: true,
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false,
})

loadedLocales.add(DEFAULT_LOCALE)

/** 将 uni-app 系统语言映射为项目语言 */
export function mapSystemLocale(lang?: string): LocaleType {
  if (!lang)
    return DEFAULT_LOCALE
  const normalized = lang.toLowerCase().replace('_', '-')
  if (normalized.startsWith('en'))
    return 'en-US'
  return 'zh-CN'
}

/** 解析 pinia unistorage 持久化的 locale 值（支持 JSON 字符串 / 对象 / 纯 locale） */
function parsePersistedLocale(stored: unknown): LocaleType | null {
  if (!stored)
    return null
  if (isSupportedLocale(stored))
    return stored
  if (typeof stored === 'string') {
    if (isSupportedLocale(stored))
      return stored
    try {
      return parsePersistedLocale(JSON.parse(stored))
    }
    catch {
      return null
    }
  }
  if (typeof stored === 'object') {
    const localeValue = (stored as { locale?: unknown }).locale
    if (isSupportedLocale(localeValue))
      return localeValue
  }
  return null
}

/** 从本地存储读取用户上次选择的语言（pinia unistorage 格式） */
export function getStoredLocale(): LocaleType | null {
  try {
    return parsePersistedLocale(uni.getStorageSync(LOCALE_STORAGE_KEY))
  }
  catch {}
  return null
}

/** 获取初始语言：优先读取本地缓存，其次系统语言 */
export function getInitialLocale(): LocaleType {
  const stored = getStoredLocale()
  if (stored)
    return stored

  try {
    // #ifdef APP-PLUS || MP
    const uniLocale = uni.getLocale?.()
    if (uniLocale)
      return mapSystemLocale(uniLocale)
    // #endif

    const systemInfo = uni.getSystemInfoSync()
    return mapSystemLocale(systemInfo.language)
  }
  catch {
    return DEFAULT_LOCALE
  }
}

/** 切换语言（启动时已加载全部语言包，同步切换） */
export function switchLocale(locale: LocaleType): boolean {
  if (!loadedLocales.has(locale))
    return false
  i18n.global.locale.value = locale
  return true
}

/** 启动时从静态服务器加载全部语言包（内置语言包作为 fallback） */
async function initLocaleMessages(): Promise<void> {
  if (!enableI18n)
    return

  registerLocaleMessages('en-US', enUS)

  const remoteMessages = await fetchAllLocaleMessages(SUPPORTED_LOCALES)
  for (const locale of SUPPORTED_LOCALES) {
    const messages = remoteMessages[locale]
    if (messages)
      registerLocaleMessages(locale, messages)
  }

  if (!loadedLocales.has(DEFAULT_LOCALE))
    registerLocaleMessages(DEFAULT_LOCALE, zhCN)
}

/**
 * 应用启动时初始化 i18n
 * - 未开启多语言：仅使用内置中文
 * - 开启多语言：启动时从 staticBaseUrl/locale/*.json 拉取全部语言包
 */
export async function setupI18n(): Promise<LocaleType> {
  await initLocaleMessages()

  const preferred = enableI18n ? getInitialLocale() : DEFAULT_LOCALE
  const ok = switchLocale(preferred)
  const active = ok ? preferred : DEFAULT_LOCALE

  if (!ok && preferred !== DEFAULT_LOCALE) {
    switchLocale(DEFAULT_LOCALE)
    try {
      uni.removeStorageSync(LOCALE_STORAGE_KEY)
    }
    catch {}
  }

  return active
}

export function isLocaleLoaded(locale: LocaleType): boolean {
  return loadedLocales.has(locale)
}

export { SUPPORTED_LOCALES }
export default i18n
