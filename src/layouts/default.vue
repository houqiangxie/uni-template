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
  <div class="app flex flex-col" :class="{
      dark: isDark,
    }">
    <wd-navbar :title="navbarStore.title" @click-left="handleClickLeft" :bordered="false"
      :leftArrow="navbarStore.showLeftButton" custom-class="bg-[#1575ff] text-white"></wd-navbar>
    <main class="flex-1  bg-[#f8f9fa]">
      <slot />
    </main>
  </div>
</template>
