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
        <wd-toast />
        <wd-notify />
    </wd-config-provider>
</template>

<script setup lang="ts">
import { useToast, useNotify } from 'wot-design-uni'
uni.$toast=useToast()
uni.$notify = useNotify()
const themeVars = reactive({
    'navbarBackground': '#1575ff',
    'navbarColor': '#fff',
    'upload-size':'60px'
})

const navbarStore = useNavbarStore()

const route = useRoute()
watch(() => route.path, () => {
    navbarStore.setPageConfig()
},{immediate:true})


</script>

