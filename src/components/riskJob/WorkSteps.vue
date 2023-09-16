<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-24 18:12:36
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-31 09:46:41
-->
<script lang='ts' setup>
const {list=[]}= defineProps<{list:any[]}>()
const route = useRoute()
const active = ref(0)
onMounted(() => {
  active.value=Number(route.query.type)
})
</script>

<template>
  <uni-steps :options="[
    { title: `作业申请（${'王金平'}）`, desc: '2023-08-22' },
    { title: `业务部门审批（${'贾珍'}）`, desc: '2023-08-23' },
    { title: `安全部门审批（${'许恒'}）`, desc: '2023-08-24' },
    { title: `作业实施` },
    { title: `作业验收` },
    { title: `已完成作业` },
  ]" direction="column" :active="active"></uni-steps>
</template>
