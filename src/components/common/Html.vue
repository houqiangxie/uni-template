<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-23 11:24:52
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-10 11:00:32
-->
<script  lang="ts" setup>
const { modelValue } = defineProps<{ modelValue?: string | null | undefined }>()
</script>

<template>
  <view class=" pt-3 text-[14px] break-words" v-html="modelValue" />
</template>
