<script lang="ts" setup>

const props = withDefaults(
  defineProps<{
    modelValue: string | number | undefined
    columns?: Array<Record<string, string | number>>
    name?: string
    label?: string
    labelKey?: string
    valueKey?: string
    beforeOpenFunc?: any
    showArrow?: boolean
    disabled?: boolean
    multiple?: boolean
    itemRef?: any
    remote?: boolean
    remoteUrl?: string
    showType?: string
    showSearch?: boolean
    placeholder?: string
    customFunc?: any
    selectWord?: boolean
  }>(),
  {
    modelValue: '',
    columns: [],
    name: '',
    label: '',
    labelKey: 'text',
    valueKey: 'value',
    disabled: false,
    multiple: false,
    showSearch: false,
    remote: false,
    remoteUrl: '',
    showType: 'default',
    placeholder: '请选择',
    customFunc: null,
    selectWord: false,
    beforeOpenFunc: null,
    showArrow: true,
  }
)

const emit = defineEmits<{ (e: 'update:modelValue', payload: any): void; (e: 'change', payload: any): void }>()

const popup = ref()
const data: { checkData: any; text: string; value: string | number } = reactive({
  checkData: {},
  value: '',
  text: '',
})
let isConfirm = false
function onCancel() {
  show.value = false
}
function onConfirm() {
  reShow(true)
  if (props.showSearch && props.selectWord && !data.value) {
    data.value = keyWord.value
    data.text = keyWord.value
    data.checkData = {
      [props.valueKey]: keyWord.value,
      [props.labelKey]: keyWord.value,
    }
  }
  isConfirm = true
  emit('update:modelValue', data.value)
  emit('change', data.checkData)
  onCancel()
  setTimeout(() => {
    isConfirm = false
  }, 300)
}

// 回显
async function reShow(flag = false) {
  if (!flag) await onSearch()
  if (
    (props.multiple && data.value?.length > 0) ||
    (!props.multiple && (data.value || data.value === 0 || data.value === '0'))
  ) {
    data.checkData = props.multiple
      ? filterList.value.filter((item) => data.value.includes(item[props.valueKey]))
      : filterList.value.find((item) => item[props.valueKey] == data.value)
    data.text = props.multiple
      ? data.checkData.map((item) => item[props.labelKey]).join(',')
      : data.checkData?.[props.labelKey]
  } else {
    data.text = ''
  }
}

const show = ref(false)
function showPopUp() {
  props.beforeOpenFunc?.()
  if (props.disabled) return
  show.value = true
  if (!props.remote) keyWord.value = ''
  onSearch()
}

// 搜索关键字
const keyWord = ref('')
const filterList = ref<Array<Record<string, string | number>>>([])
async function onSearch() {
  if (!props.remote)
    filterList.value = props.columns.filter((c) =>
      (c[props.labelKey] as string)?.match(keyWord.value)
    ) as []
  else await getRemoteData()
}

// 获取用户信息
async function getRemoteData() {
  if (props.customFunc) {
    filterList.value = await props.customFunc(keyWord.value)
  } else {
    const { data } = await post(props.remoteUrl, {
      pageNum: 1,
      pageSize: 20,
      enterpriseName: keyWord.value,
    })
    filterList.value = data
  }
  if (props.remote && props.showSearch) {
    const valueIndex = filterList.value?.findIndex((d) => data.value == d[props.valueKey])
    if (valueIndex == -1) data.value = ''
  }
}


watch(
  () => props.columns,
  (newVal, oldVal) => {
    reShow()
  },
  { deep: true }
)
watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    data.value = newVal
    if (!isConfirm) {
      if (props.remote && props.labelKey == props.valueKey && !props.selectWord)
        keyWord.value = newVal
      if (props.labelKey == props.valueKey) {
        data.text = data.value
        if (props.selectWord) return
      }
      reShow()
    }
  },
  { immediate: true }
)
</script>

<script lang="ts">
export default {
  options: {
    multipleSlots: true,
    styleIsolation: 'shared',
    addGlobalClass: true,
    virtualHost: true,
  },
}
</script>

<template>
  <view class="border-box h-6 w-full com-select" :class="{ 'b-none': props.disabled }">
    <view
      class="uni-input border-box h-full w-full flex items-center  text-sm"
      :value="data.text"
      @click="showPopUp"
    >
      <slot>
        <wd-input
          type="none"
          readonly
          v-model="data.text"
          custom-class="w-full"
          no-border
          :disabled="disabled"
          :placeholder="placeholder"
        />
      </slot>
      <slot name="right">
        <wd-icon v-if="showArrow && !props.disabled" name="right" color="#999" size="28rpx" />
      </slot>
    </view>
    <wd-popup v-model="show" position="bottom" custom-class="rounded-t-lg overflow-hidden">
      <view class="uni-list">
        <view class="h-10 relative">
          <view class="flex items-center justify-center h-full text-base">
            请选择{{ label }}
          </view>
          <wd-icon
            name="close"
            size="16"
            color="#666"
            custom-class="absolute top-3 right-5"
            @click="onCancel"
          />
        </view>
        <wd-search
          v-if="showSearch"
          v-model="keyWord"
          placeholder="请输入关键词搜索"
          hide-cancel
          custom-class="pop-search"
          :placeholder-left="true"
          @search="onSearch"
          @clear="onSearch"
        ></wd-search>
        <view class=" overflow-hidden">
          <scroll-view class="h-80" scroll-x="false" scroll-y="true">
            <wd-radio-group v-if="!props.multiple" v-model="data.value">
              <wd-radio
                :value="item[valueKey]"
                :disabled="item.disabled"
                v-for="(item, index) in filterList"
                type="dot"
                placement="left"
                custom-class="overflow-hidden "
                :key="item[valueKey]"
              >
                {{ item[labelKey] }}
              </wd-radio>
            </wd-radio-group>
            <wd-checkbox-group v-if="props.multiple" v-model="data.value">
              <wd-checkbox
                :name="item[valueKey]"
                :disabled="item.disabled"
                type="square"
                custom-label-class="flex-1 truncate text-left"
                custom-class="!flex items-center overflow-hidden"
                v-for="(item, index) in filterList"
                :key="item[valueKey]"
              >
                {{ item[labelKey] }}
              </wd-checkbox>
            </wd-checkbox-group>
          </scroll-view>
        </view>
        <view class="p-2">
          <wd-button type="primary" block @click="onConfirm">确定</wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.tree-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  padding: 20rpx;
  border-bottom: 1rpx solid #e0e0e0;

  .tree-bar-cancel {
    color: #666;
    padding: 10rpx;
  }

  .tree-bar-submit {
    color: #108EE9;
    padding: 10rpx;
  }
}
.com-select {
  :deep(.wd-radio){
    padding: 4px 8px;
  }
  :deep(.wd-checkbox){
    padding: 4px 8px;
  }
  ::v-deep .wd-radio__label {
    // @apply truncate flex-1 pl-1 text-left;
    flex: 1;
    padding-left: 1rpx;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
