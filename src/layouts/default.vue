<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 16:36:50
-->
<script lang="ts" setup>
const router = useRouter()
const navbarStore = useNavbarStore()
const handleClickLeft = () => {
  router.back()
}

</script>

<template>
  <view class="app flex flex-col" :class="{
      dark: isDark,
    }">
    <wd-navbar v-if="!navbarStore.hideNavbar" :title="navbarStore.title" @click-left="handleClickLeft" :bordered="false" safeAreaInsetTop
      :leftArrow="navbarStore.showLeftButton" ></wd-navbar>
    <main class="flex-1   overflow-hidden">
      <slot />
    </main>
  </view>
</template>
