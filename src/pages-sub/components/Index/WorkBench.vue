<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:35
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 16:25:33
-->

<template>
  <view m="t-5">
  </view>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "首页",
  },
}
</route>

<script setup lang="tsx">
const router = useRouter()
const formModel = reactive({ sex: '', fileList: [] })
</script>