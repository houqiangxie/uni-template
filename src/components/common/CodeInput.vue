<template>
    <view>
        <view class="c-overflow-hidden c-f-left-center relative" :style="{ height: (cHeight || cSize) + 'rpx' }"
            @click="onClick">
            <view class='w-full flex justify-center'>
                <template v-for="(item, index) in codeConfig" :key="index">
                    <view v-if="index && gutter" :width="cGutter" :height="(cHeight || cSize) + 'rpx'"></view>
                    <view :class="`box ${type=='box'?'box-bdr':type=='bottomLine'?'bottomLine-bdr':''}`" v-if="item.type">
                        {{ password&&codeArray[index] ? '·' : codeArray[index] }}
                        <view v-if="isFocus && activeIndex === index" class="c-code-cursor ">一</view>
                    </view>
                    <view v-else class="flex justify-center items-center mx-1">{{item.value}}</view>
                </template>
            </view>
            <input v-if="!disabled" class="c-code-input-control" :type="inputType" :focus="focus"
                :value="inputValue" :maxlength="cCount" :adjustPosition="adjustPosition" :disabled="disabled"
                @input="onInputHandler" :style="{ height: (cHeight || cSize) + 'rpx' }" @focus="isFocus = true"
                @blur="isFocus = false" />
        </view>
    </view>
</template>
<script lang="ts" setup>
const emit = defineEmits(['change', 'update:modelValue', 'finish', 'click'])
const {
    modelValue='',
    type = 'box',
    inputType = 'text',
    size = 40,
    height = 40,
    color = '#333',
    activeColor = '#333',
    bdrColor = '#333',
    activeBdrColor = '#333',
    activeBgColor = '#333',
    count = 6,
    gutter = 10,
    password = false,
    focus = false,
    disabled = false,
    disabledDot = false,
    adjustPosition = false,
    itemProps = {},
    textProps = {},
    customString=''
    } =
    defineProps<{
        modelValue: string | number,
        type: 'box' | 'bottomLine' | 'none',
        inputType: 'number' | 'password'|'text',
        size: string | number,
        height: string |number,
        color: string,
        activeColor: string,
        bdrColor: string,
        activeBdrColor: string,
        activeBgColor: string,
        count: string | number,
        gutter: string | number,
        password: boolean,
        focus: boolean,
        disabled: boolean,
        disabledDot: boolean,
        itemProps?: any,
        textProps?: any,
        adjustPosition: boolean,
        customString: string
    }>()
const inputValue = ref('')
const isFocus = ref(focus)
const toRpx = (px=0)=>{return (px*2)}
const cSize=computed(()=>toRpx(size))
const cHeight = computed(() => toRpx(height))
const cCount =ref(parseInt(count))
// 处理后的字符串数组
const codeConfig: any = computed(() => {
    let config =[]
    if (customString?.length) {
        config= customString.split('').map((char) => ({
            type: char === '*' ? type : null,
            value: char === '*' ? '' : char,
        }))
    } else {
        config= new Array(cCount.value).fill({ type, value: '' })
    }
    codeArray.value = config.map((item) => item.value)
    cCount.value=config.filter(item=>item.type)?.length
    return config
}
)
const codeArray=ref([])
const cGutter =computed(()=>toRpx(gutter))
const activeIndex = computed(() => codeArray.value.findIndex((item) => !item))
watch(modelValue, (val) => {
    codeArray.value = (val ? String(val) : '').substring(0, codeConfig.value.length).split('')
    inputValue.value = codeConfig.value.filter(item=>item.type&&item.value).join('')
})

const onInputHandler=(e)=> {
    let value = e.detail.value
    // 是否允许输入“.”
    if (disabledDot) {
        nextTick(() => {
            value = value.replace('.', '')
        })
    }
    const valueArr = value.split('')
    codeConfig.value.forEach((item, i) => {
        const str = valueArr[0]
        if (item.type) {
            if (str) {
                item.value = str
                valueArr.shift()
            } else item.value = ''
        }
    })
    inputValue.value = codeConfig.value.filter(item => item.type && item.value).map(item => item.value).join('')
    codeArray.value = codeConfig.value.map(e => e.value)
    const str=codeArray.value.join('')
    emit('change', str)
    emit('update:modelValue', str)
    if (String(value).length >= Number(cCount)) {
        emit('finish', str)
    }
}

const onClick=() => emit('click')

</script >

<style lang="scss" scoped>
.c-code-input-control {
    position: absolute;
    left: -750rpx;
    width: 1500rpx;
    top: 0;
    background-color: transparent;
    text-align: left;
    opacity:0;
}

.c-code-cursor {
    @apply absolute top-1/2 left-1/2 transform rotate-90 -translate-1/2;
    /* #ifndef APP-PLUS */
    animation: 1.2s cursor-animation infinite;
    /* #endif */
}

/* #ifndef APP-PLUS */
@keyframes cursor-animation {
    0% {
        opacity: 0;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}

/* #endif */

.box {
    @apply  h-10 w-10 text-center mx-2 flex justify-center items-center relative;
    &.box-bdr{
        border: 1px solid #aaa;
        border-radius: 6px;
    }
    &.bottomLine-bdr{
        border-bottom: 1px solid #aaa;
    }
}
</style>