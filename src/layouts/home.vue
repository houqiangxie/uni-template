<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-21 17:50:37
-->
<template>
  <div
    class="app" :class="{
      dark: isDark,
    }"
  >
    <main
      p="x-4"
      font-sans text="center"
      color="gray-700 dark:gray-200"
    >
      <slot />
      <!-- <TheFooter />
      <div mx-auto mt-4 text-center text-sm opacity-50>
        [Home Layout]
      </div> -->
    </main>
  </div>
</template>
