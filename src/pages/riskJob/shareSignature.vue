<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-24 18:12:36
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-28 14:43:20
-->
<script setup lang="ts">
import { onMounted } from 'vue'

const qrRef = ref()
// let routes = getCurrentPages(); // 获取当前打开过的页面路由数组
// let curRoute = routes[routes.length - 1].route //获取当前页面路由
// // 在微信小程序或是app中，通过curPage.options
// // 如果是H5，则需要curPage.$route.query（H5中的curPage.options为undefined)
// let curParam = routes[routes.length - 1].options || routes[routes.length - 1].$route.query; //获取路由参数

onMounted(() => {
  const qrcodeText = window.location.href.replace('shareSignature', 'index')
  qrRef.value.make({
    // 二维码标识串
    qrcodeText,
    // qrcodeText: `${window.location.href}/id=${route.query.id || ''}`,
    // 二维码尺寸
    qrcodeSize: 136,
  })
})
</script>

<route>
{
  "style": {
    "navigationBarTitleText": "分享签名",
  }
}
</route>

<template>
  <view class="wrap">
    <QRCode ref="qrRef" />
  </view>
</template>

<style lang="scss" scoped>
.wrap {
  height: 100%;
}
</style>
