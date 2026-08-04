<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 14:51:10
-->
<template>
</template>

<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { useToast, useNotify, useDialog } from '@wot-ui/ui'
import { runColdStartGuard, setLaunchOptions } from './router'

uni.$toast = useToast()
uni.$notify = useNotify()
uni.$dialog = useDialog()

onLaunch((options) => {
  setLaunchOptions(options)
})

/** H5 刷新 / App 冷启动：onLaunch 时页面栈可能未就绪，在首个 onShow 补执行守卫 */
onShow(() => {
  runColdStartGuard()
})
</script>

<style lang="scss">
@import './styles/main.scss';
</style>
