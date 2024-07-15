/// <reference types="vitest" />

import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
// import VueDevTools from 'vite-plugin-vue-devtools'
import ReactivityTransform from '@vue-macros/reactivity-transform/vite'
import vueJsx from '@vitejs/plugin-vue-jsx';
import TransformPages from 'uni-read-pages-vite'
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@/': `${resolve(__dirname, 'src')}/`,
    },
  },
  plugins: [
    /**
     * vite-plugin-uni-pages
     * @see https://github.com/uni-helper/vite-plugin-uni-pages
     */
    UniPages({
      subPackages: [
        'src/pages-sub/pages',
      ],
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

    uni(),
    vueJsx(), //jsx
    /**
     * Reactivity Transform
     * @see https://vue-macros.sxzz.moe/zh-CN/features/reactivity-transform.html
     */
    ReactivityTransform(),
  ],
  define: {
    ROUTES: new TransformPages().routes, // 注入路由表
  },

  /**
   * Vitest
   * @see https://github.com/vitest-dev/vitest
   */
  test: {
    environment: 'jsdom',
  },
  css: {
    preprocessorOptions: {
      scss: {
        // additionalData: `  @import "@/uni.scss";`,
        additionalData: ` @import '@/styles/custom_theme.scss';`,
      },
    },
  },
  server: {
    port: 81,
    host: '0.0.0.0',
    open: true,
    hmr: {
      // protocol: 'ws',
      // host: '0.0.0.0',
      // port: 80,
      overlay: false,
    },
    proxy: {
      '/gateway': {
        target: 'http://172.17.30.13:28999',
        changeOrigin: true,
        rewrite: p => p.replace(/^\/gateway/, ''),
      },
      '/file': {
        target: 'http://172.17.30.13:5888',
        changeOrigin: true,
      },
    }
  },
  build: {
    cssCodeSplit: false,
  },
})
