<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-09-20 10:54:57
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-07-10 17:16:46
-->
<template>
    <view>
        <wd-toast ref="toastRef"/>
        <wd-notify  ref="notifyRef"/>
    </view>
</template>

<script lang="ts" setup>
const toastRef = ref()
const notifyRef = ref()
onMounted(() => {
    uni.$toast= toastRef.value
    uni.$notify = notifyRef.value
})
</script>