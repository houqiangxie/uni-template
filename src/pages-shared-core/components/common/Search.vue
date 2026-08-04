<template>
    <view class="relative flex items-center search-boxs gap-2">
        <slot name="left"></slot>
        <wd-search :placeholder="placeholder" v-model="keyword" hide-cancel placeholder-left
            custom-class="w-full !p-0 !bg-[#ddeffd] rounded-50 " @blur="blur" @focus="focus" @search="search" @clear="search" @change="change">
            <template #input-suffix>
                <div class="search-btn" v-if="showSearchBth" @click="search">{{searchBtnText}}</div>
            </template>
        </wd-search>
        <slot></slot>
    </view>
</template>
<script>
export default {
    options: {
        styleIsolation: "shared",  //  启动样式隔离。当使用页面自定义组件，希望父组件影响子组件样式时可能需要配置。具体配置选项参见：微信小程序自定义组件的样式
        virtualHost: true,  //  将自定义节点设置成虚拟的，更加接近Vue组件的表现。我们不希望自定义组件的这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定
    },
}

</script>
<script setup>
// defineOptions({
//     virtualHost: true,
//     styleIsolation: 'shared'
// })
const keyword = defineModel()
const props = defineProps({
    showSearchBth: {
        type: Boolean,
        default: false
    },
    placeholder: {
        type: String,
        default: '请输入关键词查询'
    },
    searchBthText: {
        type: String,
        default: '搜索'
    }
})
const emit = defineEmits(['search','change','blur','focus'])
const search = () => {
    emit('search', keyword.value)
}
const change = () => {
    nextTick(() => {
        emit('change', keyword.value)
    })
}
const blur = () => {
    emit('blur', keyword.value)
}
const focus = () => {
    emit('focus', keyword.value)
}
const searchBtnText = computed(() => props.searchBthText)
</script>

<style lang="scss" scoped>
.search-boxs{
    --wot-search-input-height: 30px;
    --wot-search-bg: #e3f5fe;
    --wot-search-plain-block-bg: #e3f5fe;
    --wot-search-input-bg: #e3f5fe;
    --wot-search-input-padding: 0 10px 0 25px;
    --wot-fs-content: 12px;
    --wot-search-cancel-color: #999;
    margin-left: 24rpx;
    margin-right: 24rpx;
    .search-btn {
        width: 60px;
        height: 24px;
        background: linear-gradient(151deg, #27B5FF 0%, #1E88E5 100%);
        border-radius: 100rpx 100rpx 100rpx 100rpx;
        // position: absolute;
        // right: 3px;
        // top: 50%;
        // transform: translateY(-50%);
        color: #fff;
        text-align: center;
        align-content: center;
        font-size: 14px;
        line-height: 24px;
    }

    ::v-deep .wd-search__search-left-icon {
        left: 4px;
        font-size: 14px;
    }
}
</style>