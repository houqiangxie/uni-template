<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:35
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-09 17:08:43
-->
<script setup lang="ts">
const props = defineProps<{ name: string }>()
const router = useRouter()
</script>

<template>
  <div>
    <div i-carbon-pedestrian inline-block text-4xl />
    <p my-1>
      Hi, {{ props.name }}!
    </p>
    <p text-sm italic op75>
      <em>Demo of dynamic route</em>
    </p>

    <div m="t-8 b-5">
      <TheCounter />
    </div>

    <div>
      <button m-3 text-sm btn @click="router.back()">
        Back
      </button>
    </div>
  </div>
</template>
