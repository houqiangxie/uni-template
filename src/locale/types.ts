export type LocaleType = 'zh-CN' | 'en-US'

export interface LocaleOption {
  value: LocaleType
  label: string
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
]

export const DEFAULT_LOCALE: LocaleType = 'zh-CN'

export const SUPPORTED_LOCALES: LocaleType[] = ['zh-CN', 'en-US']

export function isSupportedLocale(locale: unknown): locale is LocaleType {
  return SUPPORTED_LOCALES.includes(locale as LocaleType)
}

/** 与 pinia unistorage store id 保持一致 */
export const LOCALE_STORAGE_KEY = 'locale'
