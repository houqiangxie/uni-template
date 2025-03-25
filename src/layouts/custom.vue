<script lang="ts" setup>
</script>

<template>
  <div class="app flex flex-col" :class="{
      dark: isDark,
    }">
    <main class="flex-1 overflow-hidden bg-[#f8f9fa]">
      <slot />
    </main>
  </div>
</template>
