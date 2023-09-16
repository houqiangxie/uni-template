<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-25 12:32:50
-->
## 特性

- ⚡️ [Vue 3](https://github.com/vuejs/core), [Vite 4](https://github.com/vitejs/vite), [pnpm](https://pnpm.io/), [ESBuild](https://github.com/evanw/esbuild) - 就是快！

- 🗂 [基于文件的约定式路由](https://github.com/Ares-Chang/uni-vitesse/tree/master/src/pages)

- 📦 [组件自动化加载](https://github.com/Ares-Chang/uni-vitesse/blob/master/src/components)

- 📑 [布局系统](https://github.com/Ares-Chang/uni-vitesse/tree/master/src/layouts)

- 🍍 [使用 Pinia 的状态管理](https://pinia.vuejs.org)

- 🎨 [UnoCSS](https://github.com/unocss/unocss) - 高性能且极具灵活性的即时原子化 CSS 引擎

- 😃 [各种图标集为你所用](https://github.com/antfu/unocss/tree/main/packages/preset-icons)

- 🔥 使用 [新的 `<script setup>` 语法](https://github.com/vuejs/rfcs/pull/227)

- 📥 [API 自动导入](https://github.com/Ares-Chang/uni-vitesse/tree/master/src/composables) - 直接使用 Composition API 等

- ✅ 使用 [Vitest](https://vitest.dev/) 进行单元和组件测试

- 🦾 TypeScript, 当然

- 🔒︎ [锁 pnpm 包管理](https://pnpm.io/only-allow-pnpm)

- ☁️ 零配置部署 [Netlify](https://www.netlify.com/)

<br>

如无跨端需求, 更推荐 [Vitesse-lite](https://github.com/antfu/vitesse-lite)

## 从 [Vitesse-lite](https://github.com/antfu/vitesse-lite) 中删除了以下特性

- ~~VueUse~~

## 预配置

### UI 框架

- [UnoCSS](https://github.com/antfu/unocss) - 高性能且极具灵活性的即时原子化 CSS 引擎

### Icons

- [Iconify](https://iconify.design) - 使用任意的图标集，浏览：[🔍Icônes](https://icones.netlify.app/)
- [UnoCSS 的纯 CSS 图标方案](https://github.com/antfu/unocss/tree/main/packages/preset-icons)

### 测试框架

- [Vitest](https://github.com/vitest-dev/vitest) - 由 Vite 支持的单元测试

### 插件

- [`Pinia`](https://pinia.vuejs.org) - 符合直觉的 Vue.js 状态管理库
- [`vite-plugin-uni-pages`](https://github.com/uni-helper/vite-plugin-uni-pages) - 基于文件的约定式路由
- [`vite-plugin-uni-layouts`](https://github.com/uni-helper/vite-plugin-uni-layouts) - 页面布局系统
- [`unplugin-auto-import`](https://github.com/antfu/unplugin-auto-import) - 直接使用 Composition API 等，无需导入
- [`unplugin-vue-components`](https://github.com/antfu/unplugin-vue-components) - 组件自动导入
- [`unocss-applet`](https://github.com/unocss-applet/unocss-applet) - UnoCSS 小程序预设，兼容在小程序中使用 `Attributify Mode`
- [`reactivity-transform`](https://vue-macros.sxzz.moe/features/reactivity-transform.html) - Vue Macros Reactivity Transform 独立包，可开启 `reactivityTransform` 语法糖
- [`vite-plugin-vue-devtools`](https://github.com/webfansplz/vite-plugin-vue-devtools) - 旨在增强 Vue 开发者体验。

### 编码风格

- 使用 [`<script setup>` 的 SFC 语法](https://github.com/vuejs/rfcs/pull/227) 与 Composition API 结合使用。
- 使用 [ESLint](https://eslint.org/) 工具检查代码格式，并使用 [@antfu/eslint-config](https://github.com/antfu/eslint-config) 配置，使用单引号并去掉分号。

## 现在可以试试!

```bash
npx degit ares-chang/uni-vitesse my-uni-app
cd my-uni-app
pnpm i # 如果你没装过 pnpm, 可以先运行: npm install -g pnpm


```