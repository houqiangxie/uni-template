/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  /** 小程序 / App 专用，H5 不使用 */
  readonly VITE_BASE_URL?: string
  /** 是否启用多语言，true / 1 为启用 */
  readonly VITE_ENABLE_I18N?: string
  /** 远程语言包版本，用于 ?v= 缓存刷新 */
  readonly VITE_LOCALE_REMOTE_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}
