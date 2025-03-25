import {
  type Preset,
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
  SourceCodeTransformer,
} from "unocss";

import {
  presetApplet,
  presetRemRpx,
  transformerApplet,
  transformerAttributify,
} from 'unocss-applet'

// 判断是否是小程序
const isApplet = process.env?.UNI_PLATFORM?.startsWith("mp-") ?? false;

const presets: Preset[] = [];
const transformers: SourceCodeTransformer[] = []

// 先判断是不是小程序，如果是小程序，则使用小程序的预设和转换器
if (isApplet) {
  // 使用小程序预设
  presets.push(
    // 小程序用官方预设
    presetApplet(),
    // 小程序用 rpx 预设
    presetRemRpx()
  );
  transformers.push(
    // 小程序用 @apply 功能
    transformerApplet(),
    // 小程序，解决与第三方框架样式冲突问题
    transformerAttributify({
      // 小程序，解决与第三方框架样式冲突问题
      prefixedOnly: true, // 只支持以 `ul-` 开头的类名
      prefix: "ul",
    }),
  )
} else {
  presets.push(
    // 非小程序用官方预设
    presetUno(),
    // 解决与第三方框架样式冲突问题
    presetAttributify({
      prefixedOnly: true, // 只支持以 `ul-` 开头的类名
      prefix: "ul",
    }),
  );
  transformers.push(
    // 启用 @apply 功能，比如： 
    // .custom-div { @apply text-center my-0 font-medium } => 
    // .custom-div { margin-top: 0rem; margin-bottom: 0rem; text-align: center; font-weight: 500;}
    transformerDirectives(),
    // 启用 () 分组功能，比如： 
    // <div class="hover:(bg-gray-400 font-medium) font-(light mono)"/> => 
    // <div class="hover:bg-gray-400 hover:font-medium font-light font-mono"/>
    transformerVariantGroup(),
  )
}

export default defineConfig({
  // presets 是预设
  presets: [
    ...presets,
  ],
  // transformers 是转换器
  transformers: [
    ...transformers,
  ],
  // shortcuts 自定义样式快捷方式
  // 具体使用方法，在需要使用到 flex justify-center items-center 这个几个类名时，只需要写一个 flex-center 即可
  shortcuts: [
    { "flex-center": "flex justify-center items-center" },
    { "flex-col-center": "flex justify-center items-center flex-col" }
  ],
  // rules 的作用是：在全局范围内添加自定义规则
  // 下面的配置适用于有安全区域的设备（如 iPhone X 上的刘海屏）
  // 具体使用也很简单，在需要使用安全区域的元素上添加 p-safe 类名即可
  rules: [
    [
      "p-safe",
      {
        padding:
          "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
      },
    ],
    ["pt-safe", { "padding-top": "env(safe-area-inset-top)" }],
    ["pb-safe", { "padding-bottom": "env(safe-area-inset-bottom)" }],
    [
      "ptb-safe", {
        "padding-top": "env(safe-area-inset-top)",
        "padding-bottom": "env(safe-area-inset-bottom)"
      }
    ]
  ],
});
