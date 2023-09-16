<template>
    <view class="area-manage">
        <nut-cell class="mb-2" center :title="item.title"  :desc="detailInfo[item.key]" v-for="(item,index) in config"></nut-cell>
    </view>
</template>

<script lang="ts" setup>
const route = useRoute()

const config = [
    {title:'所在位置', key:'location'},
    {title:'检查单元', key:'unitName'},
    {title:'检查点', key:'location'},
    {title:'责任部门', key:'deptName'},
    {title:'责任人', key:'responsibleName'},
    {title:'联系电话', key:'responsiblePhone'},
]

const detailInfo = ref<any>({})
const getDetail = async(id: string) => {
    const { data } = await getCheckPointInfoById(id)
    detailInfo.value = data
}

onMounted(() => {
    const { id,pId='' } = route.query
    pId&&uni.setStorageSync('userInfo', { token: pId })
    getDetail(id)
})
</script>

<style lang="scss" scoped>
:deep(.nut-cell__title){
    width: 80px !important;
    flex: none;
}
</style>

<route>
{
  "style": {
    "navigationBarTitleText": "检查点"
  }
}
</route>