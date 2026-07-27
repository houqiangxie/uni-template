/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 14:52:27
 */
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import { createUnistorage } from 'pinia-plugin-unistorage'
import App from './App.vue'
import 'uno.css'
import router from './router'
import { setupPermissionDirective } from './composables/vPermission'
import i18n, { setupI18n, switchLocale } from './locale'
import { DEFAULT_LOCALE } from './locale/types'

// uni-app 要求 createApp 同步返回，语言包在模块加载时尽早开始从静态服务器拉取
const i18nReady = setupI18n()

export function createApp() {
  const app = createSSRApp(App)
  const store = Pinia.createPinia()
  store.use(createUnistorage())
  app.use(store)
  app.use(i18n)
  app.use(router)

  const localeStore = useLocaleStore(store)
  i18nReady
    .then(locale => localeStore.markReady(locale))
    .catch(() => {
      switchLocale(DEFAULT_LOCALE)
      localeStore.markReady(DEFAULT_LOCALE)
    })

  setupPermissionDirective(app)

  return {
    app,
    Pinia,
  }
}
