import { defineStore } from 'pinia'
import i18n, { loadLocaleMessages } from '@/locale'
import { routeTitleMap } from '@/locale/route-map'
import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  type LocaleType,
} from '@/locale/types'

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<LocaleType>(DEFAULT_LOCALE)
  const isReady = ref(false)
  const isSwitching = ref(false)

  const currentOption = computed(() =>
    LOCALE_OPTIONS.find(item => item.value === locale.value) ?? LOCALE_OPTIONS[0],
  )

  /** 切换语言：懒加载目标语言包后生效 */
  async function setLocale(newLocale: LocaleType) {
    if (locale.value === newLocale && isReady.value)
      return

    isSwitching.value = true
    try {
      await loadLocaleMessages(newLocale)
      locale.value = newLocale

      try {
        uni.setLocale?.(newLocale === 'zh-CN' ? 'zh-Hans' : 'en')
      }
      catch (e) {
        console.warn('setLocale failed', e)
      }

      refreshNavigationTitle()
    }
    finally {
      isSwitching.value = false
    }
  }

  /** 应用启动后同步 store 状态 */
  function markReady(targetLocale: LocaleType) {
    locale.value = targetLocale
    isReady.value = true
  }

  /** 根据路由翻译导航栏标题 */
  function translateRouteTitle(route: string, fallback = ''): string {
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
    isSwitching,
    currentOption,
    localeOptions: LOCALE_OPTIONS,
    defaultLocale: DEFAULT_LOCALE,
    setLocale,
    markReady,
    translateRouteTitle,
    refreshNavigationTitle,
  }
}, {
  unistorage: {
    paths: ['locale'],
  },
})
