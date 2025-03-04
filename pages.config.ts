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
    'navigationBarTitleText': '监管执法',
    'navigationBarBackgroundColor': '@navBgColor',
    'navigationBarTextStyle': '@navTxtStyle',
    'backgroundColor': '@bgColor',
    'backgroundTextStyle': '@bgTxtStyle',
    'backgroundColorTop': '@bgColorTop',
    'backgroundColorBottom': '@bgColorBottom',
    "navigationStyle": 'custom',
    // "app-plus": {
    //   "bounce": "none", //关闭窗口回弹效果
    //   "titleNView": {
    //     "backButton": { //自定义 backButton
    //       "background": "#fff"
    //     }
    //   }
    // },
  },
  "easycom": {
    "autoscan": true,
    "custom": {
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
    }
  },
  pages: [],
})
