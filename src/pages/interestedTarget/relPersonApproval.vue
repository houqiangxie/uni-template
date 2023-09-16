<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-16 14:54:26
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-19 17:04:42
-->
<template>
    <button size="mini" type="primary" m="y-5" @click="addPerson" v-if="type==1">继续添加人员</button>
</template>
<route>
     {
        layout: 'success',
        "style": {
            "navigationBarTitleText": "作业人员申请",
        }
     }
</route>
<script lang="ts" setup>
const route = useRoute();
const router = useRouter();
const type = ref(2)
onMounted(() => {
    type.value = route.query.type
})

const addPerson = () => { 
    const { id, affType,qrId } = route.query
    router.push(`/pages/interestedTarget/relPersonAdd?id=${id}&affType=${affType}&qrId=${qrId}`)
}
</script>