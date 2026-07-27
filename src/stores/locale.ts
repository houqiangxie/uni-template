import { defineStore } from 'pinia'
import i18n, { isLocaleLoaded, switchLocale } from '@/locale'
import { routeTitleMap } from '@/locale/route-map'
import { enableI18n } from '@/utils/config'
import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  type LocaleType,
} from '@/locale/types'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<LocaleType>(DEFAULT_LOCALE)
  const isReady = ref(false)

  const currentOption = computed(() =>
    LOCALE_OPTIONS.find(item => item.value === locale.value) ?? LOCALE_OPTIONS[0],
  )

  /** 切换语言（启动时已加载，同步生效） */
  function setLocale(newLocale: LocaleType) {
    if (!enableI18n)
      return
    if (locale.value === newLocale && isReady.value)
      return

    if (!isLocaleLoaded(newLocale)) {
      uni.showToast({
        title: i18n.global.t('common.localeLoadFailed'),
        icon: 'none',
      })
      return
    }

    switchLocale(newLocale)
    locale.value = newLocale

    try {
      uni.setLocale?.(newLocale === 'zh-CN' ? 'zh-Hans' : 'en')
    }
    catch (e) {
      console.warn('setLocale failed', e)
    }

    refreshNavigationTitle()
  }

  /** 应用启动后同步 store 与 i18n 状态 */
  function markReady(targetLocale: LocaleType) {
    if (enableI18n) {
      locale.value = targetLocale
      switchLocale(targetLocale)
    }
    isReady.value = true
  }

  /** 根据路由翻译导航栏标题 */
  function translateRouteTitle(route: string, fallback = ''): string {
    if (!enableI18n)
      return fallback
    const key = routeTitleMap[route]
    if (key)
      return i18n.global.t(key)
    return fallback || i18n.global.t('route.appName')
  }

  /** 刷新当前页面导航栏标题 */
  function refreshNavigationTitle() {
    const pages = getCurrentPages()
    if (!pages.length)
      return

    const currentPage = pages[pages.length - 1]
    const route = currentPage.route || ''
    const navbarStore = useNavbarStore()

    const translatedTitle = translateRouteTitle(route, navbarStore.title)
    if (translatedTitle)
      navbarStore.setTitle(translatedTitle)
  }

  return {
    locale,
    isReady,
    currentOption,
    localeOptions: LOCALE_OPTIONS,
    defaultLocale: DEFAULT_LOCALE,
    setLocale,
    markReady,
    translateRouteTitle,
    refreshNavigationTitle,
  }
}, enableI18n
  ? {
      unistorage: {
        paths: ['locale'],
      },
    }
  : {})
