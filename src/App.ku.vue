<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 16:42:01
-->
<template>
  <view v-if="!localeStore.isReady" class="i18n-loading" />
  <wd-config-provider v-else :theme="isDark ? 'dark' : 'light'" :theme-vars="themeVars" class="h-screen">
    <KuRootView />
    <ComScanCode v-if="scanState.visible" />
    <wd-toast />
    <wd-notify />
    <wd-dialog />
    <wd-root-portal>
      <view
        v-if="loadingStore.loading"
        class="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center"
        :class="{ 'bottom-15': navbarStore.isTab }"
      >
        <wd-loading :size="30" type="spinner" />
      </view>
    </wd-root-portal>
  </wd-config-provider>
</template>

<script setup lang="ts">
import { useConfigProvider } from '@wot-ui/ui'

const themeVars = reactive({
  'primary-6': '#2d8cf0',
  'upload-size': '60px',
  'input-cell-label-width': 'auto',
  'tabs-nav-height': '27px',
  'cell-title-color': '#666',
  'progress-height': '9px',
  'cell-value-color': '#333',
  'input-not-empty-border-color': '#dadada',
  'radio-disabled-label-color': '#666',
  'radio-label-fs': '12px',
  'checkbox-label-fs': '12px',
})

useConfigProvider({
  theme: computed(() => (isDark.value ? 'dark' : 'light')),
  themeVars,
})

const navbarStore = useNavbarStore()
const localeStore = useLocaleStore()
const loadingStore = useLoadingStore()

const route = useRoute()
watch(() => route.value.path, () => {
  navbarStore.setPageConfig()
}, { immediate: true })

// 语言切换时刷新导航栏标题
watch(() => localeStore.locale, () => {
  localeStore.refreshNavigationTitle()
})
</script>

<style scoped>
.i18n-loading {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: #fff;
}
</style>
