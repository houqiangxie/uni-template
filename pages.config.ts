/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 16:17:47
 */
import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

export default defineUniPages({
  globalStyle: {
    navigationBarTitleText: 'Uni 模板',
    navigationBarBackgroundColor: '@navBgColor',
    navigationBarTextStyle: '@navTxtStyle',
    backgroundColor: '@bgColor',
    backgroundTextStyle: '@bgTxtStyle',
    backgroundColorTop: '@bgColorTop',
    backgroundColorBottom: '@bgColorBottom',
    navigationStyle: 'custom',
    // "app-plus": {
    //   "bounce": "none", //关闭窗口回弹效果
    //   "titleNView": {
    //     "backButton": { //自定义 backButton
    //       "background": "#fff"
    //     }
  //   }
    // },
  },
  easycom: {
    autoscan: true,
    custom: {
      '^wd-(.*)': '@wot-ui/ui/components/wd-$1/wd-$1.vue',
      'mp-html': '@/pages-shared-heavy/uni_modules/mp-html/mp-html.vue',
      'com-chart': '@/pages-shared-heavy/components/common/ComChart.vue',
      'uni-datetime-picker': '@/pages-shared-core/uni_modules/uni-datetime-picker/components/uni-datetime-picker/uni-datetime-picker.vue',
      'da-dropdown': '@/pages-shared-core/components/common/da-dropdown/index.vue',
      'com-date-time-range-select': '@/pages-shared-core/components/common/ComDateTimeRangeSelect.vue',
      'com-select': '@/pages-shared-core/components/common/ComSelect/index.vue',
      'com-tree': '@/pages-shared-core/components/common/ComTree/index.vue',
      'com-upload': '@/pages-shared-core/components/common/ComUpload.vue',
      'sign': '@/pages-shared-core/components/common/Sign.vue',
      'com-form': '@/pages-shared-core/components/common/com-form/index.vue',
      'com-locale-switch': '@/pages-shared-core/components/common/ComLocaleSwitch.vue',
      'scroll-list': '@/pages-shared-core/components/common/ScrollList.vue',
      'empty': '@/pages-shared-core/components/common/Empty.vue',
    },
  },
  pages: [],
  preloadRule: {
    'pages/index': {
      network: 'all',
      packages: ['pages-shared-core'],
    },
  },
})
