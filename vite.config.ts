import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import { generateRouter } from '@meng-xi/vite-plugin'
import UniKuRoot from '@uni-ku/root'
import uniSubpackagePlaceholder from 'vite-plugin-uni-subpackage-placeholder'

/** 开发环境：将 locale-remote/ 映射到 /wxStaticFile/static/locale/，与线上静态资源路径一致 */
function localeRemoteDevPlugin(): Plugin {
  const localeDir = resolve(__dirname, 'locale-remote')
  return {
    name: 'locale-remote-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0] ?? ''
        const match = pathname.match(/^\/wxStaticFile\/static\/locale\/([\w-]+)\.json$/)
        if (!match)
          return next()

        const filePath = resolve(localeDir, `${match[1]}.json`)
        if (!existsSync(filePath))
          return next()

        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        createReadStream(filePath).pipe(res)
      })
    },
  }
}

/**
 * 构建时把高德 Key / 可选微信 appid 写入 manifest，结束后还原，避免密钥进仓库。
 * manifest 含注释，用行级替换而非 JSON.parse。
 */
function injectManifestEnvPlugin(env: Record<string, string>): Plugin {
  const manifestPath = resolve(__dirname, 'src/manifest.json')
  let original = ''

  function replaceKeyField(source: string, field: string, value: string): string {
    const escaped = JSON.stringify(value)
    // 全局替换：H5 + mp-weixin 等处的同名字段一并注入
    return source.replace(
      new RegExp(`("${field}"\\s*:\\s*)"[^"]*"`, 'g'),
      `$1${escaped}`,
    )
  }

  /** 仅替换 mp-weixin.appid，避免误伤其它平台 */
  function replaceMpWeixinAppid(source: string, appid: string): string {
    return source.replace(
      /("mp-weixin"\s*:\s*\{[\s\S]*?"appid"\s*:\s*)"[^"]*"/,
      `$1${JSON.stringify(appid)}`,
    )
  }

  return {
    name: 'inject-manifest-env',
    buildStart() {
      const key = env.VITE_AMAP_KEY || ''
      const security = env.VITE_AMAP_SECURITY_JS_CODE || ''
      const mpAppid = env.VITE_MP_WEIXIN_APPID || ''
      if (!key && !security && !mpAppid)
        return
      original = readFileSync(manifestPath, 'utf-8')
      let next = original
      if (key)
        next = replaceKeyField(next, 'key', key)
      if (security)
        next = replaceKeyField(next, 'securityJsCode', security)
      if (mpAppid)
        next = replaceMpWeixinAppid(next, mpAppid)
      writeFileSync(manifestPath, next, 'utf-8')
    },
    buildEnd() {
      if (original)
        writeFileSync(manifestPath, original, 'utf-8')
    },
  }
}

function resolveEnvBase(env: Record<string, string>): string {
  return (env.VITE_BASE_URL || '').replace(/\/$/, '')
}

function resolvePublicBase(env: Record<string, string>): string {
  const basePath = (env.VITE_BASE_PATH || '/').trim()
  if (!basePath || basePath === '/')
    return '/'
  const normalized = basePath.startsWith('/') ? basePath : `/${basePath}`
  return normalized.endsWith('/') ? normalized : `${normalized}/`
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const Unocss = (await import('unocss/vite')).default

  const env = loadEnv(mode, process.cwd(), '')
  const envBase = resolveEnvBase(env)
  const publicBase = resolvePublicBase(env)
  const apiPrefix = (env.VITE_API_PREFIX || '/api').replace(/\/$/, '') || '/api'

  const staticPrefix = (env.VITE_STATIC_PREFIX || '/wxStaticFile/static').replace(/\/$/, '') || '/wxStaticFile/static'

  /** Sass 静态资源前缀：H5 相对路径；小程序 / App 用 VITE_BASE_URL + VITE_STATIC_PREFIX */
  function resolveSassBaseUrl(): string {
    const platform = process.env.UNI_PLATFORM || ''
    if (platform === 'h5' || !envBase)
      return `${staticPrefix}/`
    return `${envBase}${staticPrefix}/`
  }

  const sassBaseUrl = resolveSassBaseUrl()

  return {
    resolve: {
      alias: {
        '@/': `${resolve(__dirname, 'src')}/`,
      },
      dedupe: [
        'vue-i18n',
        '@intlify/core-base',
        '@intlify/message-compiler',
        '@intlify/shared',
        '@intlify/runtime',
      ],
    },
    plugins: [
      command === 'serve' ? localeRemoteDevPlugin() : null,
      injectManifestEnvPlugin(env),
      /**
       * vite-plugin-uni-pages
       * @see https://github.com/uni-helper/vite-plugin-uni-pages
       */
      UniPages({
        subPackages: [
          'src/pages-shared-core',
          'src/pages-shared-heavy',
          'src/pages-test',
        ],
        exclude: ['**/components/**/*.*', '**/uni_modules/**/*.*'],
      }),

      /**
       * @meng-xi/vite-plugin generateRouter
       * @see https://mengxi-studio.github.io/vite-plugin/plugins/generate-router.html
       */
      generateRouter({
        pagesJsonPath: 'src/pages.json',
        outputPath: 'src/router/config.ts',
        dts: 'src/router.d.ts',
        includeSubPackages: true,
        verbose: false,
      }),

      /**
       * vite-plugin-uni-layouts
       * @see https://github.com/uni-helper/vite-plugin-uni-layouts
       */
      UniLayouts(),

      /**
       * unocss
       * @see https://github.com/antfu/unocss
       * see unocss.config.ts for config
      */
      Unocss(),

      /**
       * unplugin-auto-import 按需 import
       * @see https://github.com/antfu/unplugin-auto-import
       */
      AutoImport({
        imports: [
          'vue',
          'uni-app',
          'pinia',
          'vue-i18n',
          {
            from: '@meng-xi/uni-router',
            imports: ['createRouter', 'useRouter', 'useRoute'],
          },
        ],
        dts: 'src/auto-imports.d.ts',
        dirs: [
          './src/**/composables',
          './src/**/service',
          './src/**/utils',
          './src/**/enum',
          './src/**/stores',
        ],
        vueTemplate: true,
      }),

      /**
       * unplugin-vue-components 按需引入组件
       * 注意：需注册至 uni 之前，否则不会生效
       * @see https://github.com/antfu/vite-plugin-components
       */
      Components({
        dts: 'src/components.d.ts',
        // 主包组件放后面，同名时覆盖分包（如 ComScanCode / ComChunkUpload 必须在主包）
        dirs: [
          './src/pages-shared-core/components',
          './src/pages-shared-heavy/components',
          './src/components',
        ],
        exclude: [/[\\/]lime-echart[\\/]/],
      }),
      UniKuRoot(),
      uni(),
      uniSubpackagePlaceholder(['pages-shared-core', 'pages-shared-heavy', 'pages-test']),
    ].filter(Boolean),
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __VUE_I18N_PROD_DEVTOOLS__: false,
    },

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api', 'import'],
          additionalData: `$base-url: '${sassBaseUrl}';\n`,
        },
      },
    },
    server: {
      port: 88,
      host: '0.0.0.0',
      open: true,
      hmr: {
        overlay: false,
      },
      proxy: {
        '/amap': {
          target: 'https://restapi.amap.com',
          changeOrigin: true,
          rewrite: p => p.replace(/^\/amap/, ''),
        },
        ...(envBase
          ? {
              [apiPrefix]: {
                target: envBase,
                changeOrigin: true,
              },
              '/wxStaticFile': {
                target: envBase,
                changeOrigin: true,
              },
            }
          : {}),
      },
    },
    optimizeDeps: {
      exclude: ['@wot-ui/ui'],
    },
    base: publicBase,
  }
})
