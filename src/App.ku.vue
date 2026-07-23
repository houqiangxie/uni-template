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
    <wd-config-provider v-else :theme="isDark ? 'dark' : ''" :theme-vars="themeVars" class="h-screen">
        <KuRootView />
        <wd-toast />
        <wd-notify />
        <wd-dialog></wd-dialog>
    </wd-config-provider>
</template>

<script setup lang="ts">
const themeVars = reactive({
    // 主色：覆盖语义变量 primary-6（组件默认主色）
    primary6: '#2D8CF0',
    // primary5: '#57A3F3', // hover 态，可选
    // primary7: '#2B85E4', // 点击态，可选
    'navbarBg': 'transparent',
    'navbarColor': '#fff',
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

const navbarStore = useNavbarStore()
const localeStore = useLocaleStore()

const route = useRoute()
watch(() => route?.path, () => {
    navbarStore.setPageConfig()
},{immediate:true})

// 语言切换时刷新导航栏标题
watch(() => localeStore.locale, () => {
    localeStore.refreshNavigationTitle()
})

</script>

<style scoped>
.i18n-loading {
    width: 100%;
    height: 100vh;
    background: #fff;
}
</style>

