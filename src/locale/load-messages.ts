import { localeRemoteVersion, staticBaseUrl } from '@/utils/config'
import type { LocaleType } from './types'

const LOCALE_REMOTE_DIR = 'locale/'

function remoteLocaleUrl(locale: LocaleType): string {
  const base = `${staticBaseUrl}${LOCALE_REMOTE_DIR}${locale}.json`
  if (!localeRemoteVersion)
    return base
  return `${base}?v=${encodeURIComponent(localeRemoteVersion)}`
}

/** 从静态资源服务器拉取单个语言包 */
export async function fetchLocaleMessages(locale: LocaleType): Promise<object | null> {
  const url = remoteLocaleUrl(locale)
  try {
    const res = await uni.request({
      url,
      method: 'GET',
      timeout: 15000,
    })
    const status = res.statusCode ?? 0
    const data = res.data
    if (status >= 200 && status < 300 && data && typeof data === 'object')
      return data as object
    console.warn('[i18n] locale invalid response', locale, status)
  }
  catch (e) {
    console.warn('[i18n] locale load failed', locale, url, e)
  }
  return null
}

/** 启动时并行拉取多个语言包 */
export async function fetchAllLocaleMessages(
  locales: LocaleType[],
): Promise<Partial<Record<LocaleType, object>>> {
  const entries = await Promise.all(
    locales.map(async (locale) => {
      const messages = await fetchLocaleMessages(locale)
      return [locale, messages] as const
    }),
  )

  const result: Partial<Record<LocaleType, object>> = {}
  for (const [locale, messages] of entries) {
    if (messages)
      result[locale] = messages
  }
  return result
}
