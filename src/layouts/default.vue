<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-07-11 10:05:54
-->
<template>
  <div class="app" :class="{
      dark: isDark,
    }">
    <wd-config-provider :theme="isDark?'dark':''" :theme-vars="themeVars" class="h-full">
      <!-- <Register/> -->
      <main class="h-full overflow-hidden bg-[#f8f9fa]">
        <slot />
      </main>
    </wd-config-provider>
  </div>
</template>

<script lang="ts" setup>
const themeVars = reactive({
 
});
</script>
