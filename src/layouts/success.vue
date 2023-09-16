<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-19 16:19:18
-->
<template>
  <div
    class="app" :class="{
      dark: isDark,
    }"
  >
    <main
      font-sans text="center"
      color="gray-700 dark:gray-200"
      class="h-full"
    >
    <view text="center" font="bold" m="y-15">提交成功，等待审核</view>
      
      <slot />
      <view>
        <button size="mini" @click="close()">关闭</button>
      </view>
        
    </main>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const close = () => {
  if(route.query.qrId)upDateStatus(route.query.qrId)
  closeApp()
}
</script>
