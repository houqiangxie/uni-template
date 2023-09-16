<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-16 14:54:26
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-17 11:18:03
-->
<template>
    <!-- <SubmitNext :type="type"/> -->
</template>
<route>
     {
        layout: 'success',
        "style": {
            "navigationBarTitleText": "相关方单位申请",
        }
     }
</route>
<script lang="ts" setup>
const route = useRoute();
const type=ref(2)
onMounted(() => {
    type.value=route.query.type
})
</script>