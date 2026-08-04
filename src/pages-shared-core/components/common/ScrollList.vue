<template>
    <scroll-view scroll-y :style="style" :class="class" @scrolltolower="handleScrolltolower">
        <template v-if="list?.length > 0||length>0">
            <template v-if="paginate">
                <wd-card v-for="(item,index) in list" :key="item[rowKey]||index" custom-class="!p-3">
                    <slot :item="item" :index="index" ></slot>
                </wd-card>
            </template>
            <slot v-else></slot>
        </template>
        <empty v-else />
    </scroll-view>
</template>
<script>
export default {
    options: {
        inheritAttrs: false,
        styleIsolation: "shared",  //  启动样式隔离。当使用页面自定义组件，希望父组件影响子组件样式时可能需要配置。具体配置选项参见：微信小程序自定义组件的样式
        virtualHost: true,  //  将自定义节点设置成虚拟的，更加接近Vue组件的表现。我们不希望自定义组件的这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定
    },
}

</script>
<script setup >
const props = defineProps({
    list: {
        type: Array,
        default: () => []
    },
    style: {
        type: Object,
        default: ()=> ({})
    },
    class: {
        type: String,
        default:''
    },
    rowKey: {
        type: String,
        default:'id'
    },
    paginate: {
        type: Boolean,
        default: true
    },
})

const emits = defineEmits(['scrolltolower'])
const handleScrolltolower = () => {
    paginate && emits('scrolltolower')
}
</script>