/// <reference types="vitest" />

import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
// import VueDevTools from 'vite-plugin-vue-devtools'
// import ReactivityTransform from '@vue-macros/reactivity-transform/vite'
// import vueJsx from '@vitejs/plugin-vue-jsx';
import TransformPages from 'uni-read-pages-vite'
import UniKuRoot from '@uni-ku/root'
import uniSubpackagePlaceholder from 'vite-plugin-uni-subpackage-placeholder'
// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const Unocss = (await import('unocss/vite')).default

  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

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
      /**
       * vite-plugin-uni-pages
       * @see https://github.com/uni-helper/vite-plugin-uni-pages
       */
      UniPages({
        subPackages: [
          'src/pages-echarts',
          'src/pages-test',
        ],
        exclude: ['**/components/**/*.*', '**/uni_modules/**/*.*']
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
            from: 'uni-mini-router',
            imports: ['createRouter', 'useRouter', 'useRoute']
          }
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
        dirs: ['./src/**/components'],
        exclude: [/[\\/]lime-echart[\\/]/,],
      }),

      /**
       * vite-plugin-vue-devtools 增强 Vue 开发者体验
       * @see https://github.com/webfansplz/vite-plugin-vue-devtools
       */
      // VueDevTools(),
      UniKuRoot(),
      uni(),
      // vueJsx(), //jsx
      /**
       * Reactivity Transform
       * @see https://vue-macros.sxzz.moe/zh-CN/features/reactivity-transform.html
       */
      // ReactivityTransform(),
      uniSubpackagePlaceholder(['pages-echarts', 'pages-test']),
    ].filter(Boolean),
    define: {
      ROUTES: new TransformPages().routes, // 注入路由表
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __VUE_I18N_PROD_DEVTOOLS__: false,
    },

    /**
     * Vitest
     * @see https://github.com/vitest-dev/vitest
     */
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
          silenceDeprecations: ['legacy-js-api', 'import'],
        },
      },
    },
    server: {
      port: 80,
      host: '0.0.0.0',
      open: true,
      hmr: {
        // protocol: 'ws',
        // host: '0.0.0.0',
        // port: 80,
        overlay: false,
      },
      proxy: {
        '/amap': {
          target: "https://restapi.amap.com",
          changeOrigin: true,
          rewrite: p => p.replace(/^\/amap/, ''),
        },
        '/fwz': {
          // target: "http://172.17.30.234:5888/station",
          target: "http://172.17.29.32:5889",
          changeOrigin: true,
        }
      }
    },
    build: {
      cssCodeSplit: false,
      minify: 'esbuild', 
    },
    optimizeDeps: {
      exclude: ['@wot-ui/ui'],
    },
    esbuild: {
      // 只在生产环境移除注释
      legalComments: process.env.NODE_ENV === 'production' ? 'none' : 'inline'
    },
    // base: process.env.NODE_ENV === 'production' ? '/station_h5' : '/'
    base: process.env.NODE_ENV === 'production' ? '/' : '/'
  }
 })
