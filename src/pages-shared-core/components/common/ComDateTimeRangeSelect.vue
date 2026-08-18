<script setup>
import dayjs from 'dayjs'

defineOptions({
  options: {
    // 微信小程序中 options 选项
    multipleSlots: true, //  在组件定义时的选项中启动多slot支持，默认启用
    styleIsolation: 'shared', //  启动样式隔离。当使用页面自定义组件，希望父组件影响子组件样式时可能需要配置。具体配置选项参见：微信小程序自定义组件的样式
    addGlobalClass: true, //  表示页面样式将影响到自定义组件，但自定义组件中指定的样式不会影响页面。这个选项等价于设置 styleIsolation: apply-shared
    virtualHost: true, //  将自定义节点设置成虚拟的，更加接近Vue组件的表现。我们不希望自定义组件的这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定
  },
})

const props = defineProps({
  modelValue: {
    default: [],
  },
  type: {
    default: 'daterange',
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
  valueFormat: {
    type: String,
    default: 'YYYY-MM-DD',
  },
  rest: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  bgColor: {
    type: String,
    default: 'rgba(255,255,255,0.8)',
  },
})
const emit = defineEmits(['update:modelValue', 'change', 'cancel'])
const date = ref([])
watch(() => props.modelValue, (newVal) => {
  date.value = newVal || []
}, { immediate: true })
const dateText = computed(() => {
  if (Array.isArray(date.value))
    return date.value.join(' - ')
  else
    return date.value
})
function formatValue(value) {
  if (value && props.valueFormat)
    return Array.isArray(value) ? value.map(item => dayjs(item).format(props.valueFormat)) : dayjs(value).format(props.valueFormat)

  return value
}
function onChange(value) {
  emit('update:modelValue', value)
  emit('change', value)
}

function handleConfirm(value) {
  if (!value?.value)
    return onChange('')
  const formatVal = formatValue(value.value)
  onChange(formatVal)
}

function onclear() {
  date.value = props.type === 'datetimerange' || props.type === 'daterange' ? [] : ''
  onChange(date.value)
}

const datePickerRef = ref()

function openPicker() {
  if (props.type === 'month') {
    datePickerRef.value?.open?.()
    return
  }
  datePickerRef.value?.show?.()
}

defineExpose({
  open: openPicker,
})
</script>

<template>
  <view class="date-time-range">
    <wd-calendar v-if="type == 'month'" ref="datePickerRef" v-model="date" custom-class="w-full bg-transparent" clearable :placeholder="placeholder" :display-format="formatValue" :type="type" v-bind="rest" @confirm="handleConfirm" @clear="handleConfirm" />
    <uni-datetime-picker v-else ref="datePickerRef" v-model="date" :type="type" custom-class="w-full" v-bind="props.rest" @change="onChange" @mask-click="emit('cancel')">
      <view class="date-boxs">
        <view v-if="dateText" class="text-full text">
          {{ dateText }}
        </view>
        <view v-else class="text-full placeholder text-[#CCCCCC]">
          {{ placeholder }}
        </view>
        <wd-icon v-if="clearable && dateText" name="error-fill" size="30rpx" @click.stop="onclear" />
        <wd-icon name="caret-down-small" size="40rpx" custom-class="mr-2" color="#999" />
      </view>
    </uni-datetime-picker>
  </view>
</template>

<style lang="scss" scoped>
.date-time-range {
  height: 64rpx;
  background-color: v-bind(bgColor);
  border-radius: 100rpx 100rpx 100rpx 100rpx;
  display: flex;
  align-items: center;
  margin-left: 24rpx;
  margin-right: 24rpx;
  box-sizing: border-box;

  .date-boxs {
    display: flex;
    align-items: center;
    color: #333;
    padding-left:24rpx;
    font-size: 26rpx;
    .text-full {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  :deep(.wd-cell) {
   background-color: transparent !important;
  }
}
</style>
