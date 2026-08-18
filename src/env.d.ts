/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  /** 小程序 / App 请求根地址；H5 开发时同时作为 vite proxy 目标 */
  readonly VITE_BASE_URL?: string
  /** 请求路径前缀，默认 /api */
  readonly VITE_API_PREFIX?: string
  /** 远程静态资源路径前缀，默认 /wxStaticFile/static */
  readonly VITE_STATIC_PREFIX?: string
  /** 微信小程序 appid（可选，亦可直接改 manifest） */
  readonly VITE_MP_WEIXIN_APPID?: string
  /** AES-128 密钥 */
  readonly VITE_AES_KEY?: string
  /** RSA 公钥 */
  readonly VITE_RSA_PUBLIC_KEY?: string
  /** 企业端 / 文件下载 RSA 公钥 */
  readonly VITE_RSA_ENTERPRISE_PUBLIC_KEY?: string
  /** 高德 Key（构建注入 manifest） */
  readonly VITE_AMAP_KEY?: string
  readonly VITE_AMAP_SECURITY_JS_CODE?: string
  /** 是否启用多语言，true / 1 为启用 */
  readonly VITE_ENABLE_I18N?: string
  /** 远程语言包版本，用于 ?v= 缓存刷新 */
  readonly VITE_LOCALE_REMOTE_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'crypto-js/md5'
declare module 'crypto-js/aes'
declare module 'crypto-js/enc-utf8'
declare module 'crypto-js/mode-ecb'
declare module 'crypto-js/pad-pkcs7'
declare module 'crypto-js'

declare namespace UniNamespace {
  interface Uni {
    $toast?: any
    $notify?: any
    $dialog?: any
  }
}

/** 微信内置浏览器 JSSDK（H5 关闭窗口） */
declare const WeixinJSBridge: {
  call?: (name: string, ...args: any[]) => void
}

declare const wx: {
  closeWindow?: () => void
  getFileSystemManager?: () => any
  env?: { USER_DATA_PATH: string }
}
