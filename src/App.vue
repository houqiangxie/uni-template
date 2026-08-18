<template>
</template>

<script setup lang="ts">
import { useDialog, useNotify, useToast } from '@wot-ui/ui'
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
