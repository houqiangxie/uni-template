<script lang="ts" setup>
const {
  modelValue = '', columns = [], name = '', label = '', labelKey="text",valueKey='value', disabled=false, multiple = false, showSearch = false,
  remote = false, remoteUrl = '', showType = 'default', placeholder = '请选择', customFunc=null,selectWord=false,beforeOpenFunc=null,showArrow=true,
}
= defineProps<{
  modelValue: string | number | undefined, columns?: Array<Record<string, string | number>>, name?: string, label?: string, labelKey?:string,valueKey?:string,beforeOpenFunc?:any,showArrow?:boolean,
  disabled?: boolean, multiple?: boolean, itemRef?: any, remote?: boolean, remoteUrl?: string, showType?: string, showSearch?: boolean, placeholder?: string, customFunc?: any,selectWord?:boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', payload: any): void; (e: 'change', payload: any): void }>()
const popup = ref()
const data: { checkData: any; text: string; value: string | number } = reactive({
  checkData: {},
  value: '',
  text: '',
})
let isConfirm = false
const tempProps=computed(()=>({name,label,labelKey,valueKey,disabled,multiple,showSearch,placeholder,showArrow}))
// 单选多选选中事件
function onGroupChange(e) {
  data.value = e.detail.value ?? (multiple ? [] : '')
}
function onCancel() {
  show.value = false
}
function onConfirm() {
  reShow(true)
  if(showSearch&&selectWord&&!data.value){
    data.value=keyWord.value
    data.text=keyWord.value
    data.checkData={[valueKey]:keyWord.value,[labelKey]:keyWord.value}
  }
  isConfirm=true
  emit('update:modelValue', data.value)
  emit('change', data.checkData)
  onCancel()
  setTimeout(() => {
    isConfirm=false
  }, 300);
}
// 回显
async function reShow(flag = false) {
  if(!flag)await onSearch()
  if ((multiple && data.value?.length > 0) || (!multiple && (data.value || data.value === 0 || data.value === '0'))) {
    
    data.checkData = multiple ? filterList.value.filter(item => (data.value).includes(item[valueKey])) : filterList.value.find(item => item[valueKey] == data.value)
    data.text = multiple ? data.checkData.map(item => item[labelKey]).join(',') : data.checkData?.[labelKey]
  }
  else {
    data.text = ''
  }
  // flag&&itemRef.onFieldChange(data.value)
}
const show = ref(false)
function showPopUp() {
  beforeOpenFunc?.()
  if (disabled)return
  show.value=true
  if(!remote)keyWord.value = ''
  onSearch()
}

// 搜索关键字
const keyWord = ref('')
const filterList = ref<Array<Record<string, string | number>>>([])
async function onSearch() {
  if (!remote)filterList.value = columns.filter(c => (c[labelKey] as string)?.match(keyWord.value)) as []
  else await getRemoteData()
  
}

// 获取用户信息
async function getRemoteData() {
  if (showType == 'relUnit') { filterList.value = await getRelUnitListByKeyWord(keyWord.value) }
  else if (customFunc) { filterList.value = await customFunc(keyWord.value) }
  else {
    const { data } = await post(remoteUrl, { pageNum: 1, pageSize: 20, enterpriseName: keyWord.value })
    filterList.value = data
  }
  if(remote&&showSearch){
    const valueIndex= filterList.value?.findIndex(d=>data.value==d[valueKey])
    if(valueIndex==-1) data.value=''
  }
}

watch(() => columns, (newVal, oldVal) => {
  // 处理异步数据回显
  reShow()
})
watch(() => modelValue, (newVal, oldVal) => {
  data.value = newVal
  if(!isConfirm){
    if (remote && labelKey == valueKey&&!selectWord) keyWord.value = newVal
    if(labelKey == valueKey){
      data.text=data.value
      if(selectWord) return;
    }
    // 处理异步数据回显
    reShow()
  }
},{immediate:true})

// watchEffect(()=>{
//     reShow()
// })
</script>

<script lang="ts">
export default {
  options: {
    // 微信小程序中 options 选项
    multipleSlots: true, //  在组件定义时的选项中启动多slot支持，默认启用
    styleIsolation: "shared",  //  启动样式隔离。当使用页面自定义组件，希望父组件影响子组件样式时可能需要配置。具体配置选项参见：微信小程序自定义组件的样式
    addGlobalClass: true, //  表示页面样式将影响到自定义组件，但自定义组件中指定的样式不会影响页面。这个选项等价于设置 styleIsolation: apply-shared
    virtualHost: true,  //  将自定义节点设置成虚拟的，更加接近Vue组件的表现。我们不希望自定义组件的这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定
  },
}

</script>

<template>
  <view class="border-box h-6 w-full com-select" :class="{ 'b-none': disabled }">
    <view class="uni-input border-box h-full w-full flex items-center text-left text-sm" :value="data.text"
      @click="showPopUp">
      <slot>
        <wd-input type="none" readonly v-model="data.text" custom-class="w-full" no-border
          :disabled="tempProps.disabled" />
      </slot>
      <slot><wd-icon name="arrow-right" color="#999" size="28rpx" v-if="!disabled"></wd-icon></slot>
    </view>
    <wd-popup v-model="show" position="bottom" custom-class="rounded-t-lg overflow-hidden">
      <view class="uni-list">
        <view class="h-10 relative">
          <view class="flex items-center justify-center h-full text-base">请选择{{ tempProps.label }}</view>
          <wd-icon name="close" size="16" color="#666" custom-class="absolute top-2 right-5" @click="onCancel" />
        </view>
        <wd-search v-if="tempProps.showSearch" v-model="keyWord" placeholder="请输入关键词搜索" hide-cancel
          placeholderLeft @change='onSearch' @clear='onSearch'></wd-search>
        <view class=" overflow-hidden">
          <scroll-view class="h-80" scroll-x="false" scroll-y="true">
            <wd-radio-group v-if="!multiple" v-model="data.value" cell>
              <wd-radio :value="item[tempProps.valueKey]" :disabled="item.disabled" v-for="(item, index) in filterList"
                shape="dot" icon-placement="left" custom-class="overflow-hidden " :key="item[tempProps.valueKey]">{{
                item[tempProps.labelKey] }}</wd-radio>
            </wd-radio-group>
            <wd-checkbox-group v-if="multiple" v-model="data.value" cell>
              <wd-checkbox :modelValue="item[tempProps.valueKey]" :disabled="item.disabled" shape="square"
                custom-label-class="flex-1 truncate text-left" custom-class="!flex items-center overflow-hidden"
                v-for="(item, index) in filterList">
                {{ item[tempProps.labelKey] }}</wd-checkbox>
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
    color: #1575ff;
    padding: 10rpx;
  }
}
.com-select{
  ::v-deep .wd-radio__label{
    @apply truncate flex-1 pl-1;
  }
  ::v-deep .uni-input-wrapper, .uni-input-form{
    @apply text-left items-center;
  }
}
</style>
