<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-20 11:02:43
-->
<template>
  <div
    class="app" :class="{
      dark: isDark,
    }"
  >
  <nut-config-provider :theme="isDark?'dark':''" :theme-vars="themeVars">
    <Register/>
    <main
      font-sans
      color="gray-700 dark:gray-200"
      class="h-full"
    >
      <slot />
      <!-- <TheFooter />
      <div mx-auto mt-4 text-center text-sm opacity-50>
        [Default Layout]
      </div> -->
    </main>
    </nut-config-provider>
  </div>
</template>

<script lang="ts" setup>
const themeVars = reactive({
  collapseItemPadding: '0 10px 0 0',
  collapseWrapperContentPadding: '0 0',
  collapseWrapperContentLineHeight: '1.2',
  collapseItemIconColor: '#ddd',
});
</script>
