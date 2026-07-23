import { createI18n } from 'vue-i18n'
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type LocaleType,
  isSupportedLocale,
} from './types'

/** 语言包懒加载映射，仅在使用时才会打入对应 chunk */
const localeLoaders: Record<LocaleType, () => Promise<{ default: object }>> = {
  'zh-CN': () => import('./zh-CN'),
  'en-US': () => import('./en-US'),
}

/** 已加载的语言包缓存 */
const loadedLocales = new Set<LocaleType>()

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
  globalInjection: true,
  silentTranslationWarn: true,
  missingWarn: false,
  fallbackWarn: false,
})

/** 将 uni-app 系统语言映射为项目语言 */
export function mapSystemLocale(lang?: string): LocaleType {
  if (!lang)
    return DEFAULT_LOCALE
  const normalized = lang.toLowerCase().replace('_', '-')
  if (normalized.startsWith('en'))
    return 'en-US'
  return 'zh-CN'
}

/** 获取初始语言：优先读取本地缓存，其次系统语言 */
export function getInitialLocale(): LocaleType {
  try {
    const stored = uni.getStorageSync(LOCALE_STORAGE_KEY)
    const localeValue = typeof stored === 'object' ? stored?.locale : stored
    if (isSupportedLocale(localeValue))
      return localeValue
  }
  catch {}

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

/** 懒加载指定语言包 */
export async function loadLocaleMessages(locale: LocaleType): Promise<void> {
  if (loadedLocales.has(locale)) {
    i18n.global.locale.value = locale
    return
  }

  const loader = localeLoaders[locale]
  if (!loader)
    return

  const mod = await loader()
  i18n.global.setLocaleMessage(locale, mod.default)
  loadedLocales.add(locale)
  i18n.global.locale.value = locale
}

/**
 * 应用启动时初始化 i18n
 * 根据用户偏好（含历史选择的英文）加载对应语言包，再挂载应用
 */
export async function setupI18n(): Promise<LocaleType> {
  const targetLocale = getInitialLocale()
  await loadLocaleMessages(targetLocale)

  // 非默认语言时，后台预加载 fallback，避免缺失 key 时无文案
  if (targetLocale !== DEFAULT_LOCALE && !loadedLocales.has(DEFAULT_LOCALE)) {
    loadLocaleMessages(DEFAULT_LOCALE).catch(() => {})
  }

  return targetLocale
}

export function isLocaleLoaded(locale: LocaleType): boolean {
  return loadedLocales.has(locale)
}

export { SUPPORTED_LOCALES }
export default i18n
