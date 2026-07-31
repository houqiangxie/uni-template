import type { Preset, SourceCodeTransformer } from 'unocss'
import { presetWot } from '@wot-ui/unocss-preset'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import {
  presetApplet,
  presetRemRpx,
} from 'unocss-applet'

// 判断是否是小程序
const isApplet = process.env?.UNI_PLATFORM?.startsWith('mp-') ?? false

const presets: Preset[] = []
const transformers: SourceCodeTransformer[] = []

if (isApplet) {
  // 小程序：presetApplet 自动注入 transformerApplet，处理非法 class 字符
  presets.push(presetApplet())
  presets.push(presetRemRpx())
}
else {
  // H5：共用 presetApplet，rem/rpx 反向转换
  presets.push(presetApplet())
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
  presets.push(
    presetAttributify({
      prefixedOnly: true,
      prefix: 'ul',
    }),
  )
  transformers.push(
    transformerDirectives(),
    transformerVariantGroup(),
  )
}

export default defineConfig({
  // 让 @apply 能扫描独立 scss/css 文件（仅 H5 生效）
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'src/**/*.{scss,css}',
      ],
    },
  },
  presets: [
    presetWot(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    ...presets,
  ],
  transformers: [
    ...transformers,
  ],
  shortcuts: [
    { 'flex-center': 'flex justify-center items-center' },
    { 'flex-col-center': 'flex justify-center items-center flex-col' },
  ],
  rules: [
    [
      'p-safe',
      {
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
    ],
    ['pt-safe', { 'padding-top': 'env(safe-area-inset-top)' }],
    ['pb-safe', { 'padding-bottom': 'env(safe-area-inset-bottom)' }],
    [
      'ptb-safe',
      {
        'padding-top': 'env(safe-area-inset-top)',
        'padding-bottom': 'env(safe-area-inset-bottom)',
      },
    ],
  ],
})
