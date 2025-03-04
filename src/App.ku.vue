<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 16:42:01
-->
<template>
     <wd-config-provider :theme="isDark ? 'dark' : ''" :theme-vars="themeVars" class="h-screen">
        <KuRootView />
    </wd-config-provider>
</template>

<script setup lang="ts">
import pagesjson from "./pages.json";
const themeVars = reactive({
    'navbarBackground': '#1575ff',
    'navbarColor': '#fff',
})


const currentPageConfig=ref({})

const route = useRoute()
watch(() => route.path, () => {
    currentPageConfig.value=getCurrentPageConfig(pagesjson)
},{immediate:true})


provide('currentPageConfig', currentPageConfig)
</script>

