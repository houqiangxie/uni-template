# uni-template

基于 Vue 3 + Vite 5 + uni-app 的跨端基础模板，开箱包含分包、请求层、远程 i18n、表单与上传等能力。

## 特性

- Vue 3 + `<script setup>` + TypeScript
- Vite 5 + `@dcloudio/vite-plugin-uni`
- 约定式路由（`@uni-helper/vite-plugin-uni-pages`）与布局系统
- Pinia + `pinia-plugin-unistorage` 持久化
- UnoCSS + Wot UI
- 远程 / 本地 i18n（可按环境开关）
- 路由鉴权守卫 + 统一请求层（`useRequest.ts`）

## 环境要求

- Node.js 18+
- 包管理器：**pnpm**（仓库以 `pnpm-lock.yaml` 为准）

```bash
npm install -g pnpm
pnpm i
cp .env.example .env
```

## 环境变量

密钥与内网地址只放在本地 `.env*`（已 gitignore），仓库仅保留 `.env.example`。

| 变量 | 说明 |
|------|------|
| `VITE_BASE_URL` | 小程序 / App 的 API 根地址；H5 开发时代理目标（H5 运行时用 `window.location.origin`） |
| `VITE_API_PREFIX` | 请求前缀，默认 `/api` |
| `VITE_STATIC_PREFIX` | 远程静态资源前缀，默认 `/wxStaticFile/static` |
| `VITE_AES_KEY` | 登录等 AES 密钥 |
| `VITE_RSA_PUBLIC_KEY` | RSA 公钥 |
| `VITE_AMAP_KEY` / `VITE_AMAP_SECURITY_JS_CODE` | 高德 Key（构建时注入 manifest） |
| `VITE_MP_WEIXIN_APPID` | 微信小程序 appid（构建时注入，可选） |
| `VITE_ENABLE_I18N` | 是否启用多语言 |

## 常用脚本

```bash
pnpm dev:h5              # H5 开发
pnpm dev:mp-weixin       # 微信小程序
pnpm build:h5            # H5 生产构建
```

## 目录要点

| 路径 | 说明 |
|------|------|
| `src/pages` | 主包页面 |
| `src/pages-shared-core` | 轻量公共分包 |
| `src/pages-shared-heavy` | 图表等重型分包 |
| `src/pages-test` | 示例 / Demo |
| `src/composables/useRequest.ts` | 统一请求层 |
| `src/utils/common.ts` | 通用工具（date / tree / dom 已按域拆分） |
| `locale-remote/` | 远程语言包源（开发态映射到静态路径） |

## 分包与体积

- 图表：H5 按需引入 `echarts/core`；小程序用 `lime-echart` 内置 `echarts.min.js`（约 1MB，仅 heavy 分包本地打包，**不能 CDN**）。体积敏感时请换成官方精简构建 / 自建子集后仍放入分包。
- `utils` / `composables` / `stores` / `service` 走 AutoImport；重模块请在业务分包内按需使用，避免主包页面误引用。
- `ComScanCode` 按需挂载（扫码可见时再渲染）。

## License

MIT
