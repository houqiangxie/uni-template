<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-09-20 10:54:57
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-20 11:13:01
-->
<template>
    <view>
        <nut-toast ref="toastRef"/>
        <nut-notify  ref="notifyRef"/>
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