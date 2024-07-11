<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-11 09:39:21
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-07-11 10:22:57
-->

<script lang="ts" setup>
const {
  modelValue = '', columns = [], name = '', label = '', columnsFieldNames = { text: 'text', value: 'value', children: 'children' }, disabled, multiple = false, showSearch = false,
  itemRef = {}, remote = false, remoteUrl = '', showType = 'default', placeholder = '请选择', customFunc=null,selectWord=false,beforeOpenFunc=null,showArrow=true,
}
  = defineProps<{
    modelValue: string | number | undefined, columns?: Array<Record<string, string | number>>, name?: string, label?: string, columnsFieldNames?: Record<string, string>,beforeOpenFunc?:any,showArrow?:boolean,
    disabled?: boolean, multiple?: boolean, itemRef?: any, remote?: boolean, remoteUrl?: string, showType?: string, showSearch?: boolean, placeholder?: string, customFunc?: any,selectWord?:boolean
  }>()
const emit = defineEmits<{ (e: 'update:modelValue', payload: any): void; (e: 'change', payload: any): void }>()
const popup = ref()
const data: { checkData: any; text: string; value: string | number } = reactive({
  checkData: {},
  value: '',
  text: '',
})

let isConfirm =false

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
    data.checkData={[columnsFieldNames.value]:keyWord.value,[columnsFieldNames.text]:keyWord.value}
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
    
    data.checkData = multiple ? filterList.value.filter(item => (data.value).includes(item[columnsFieldNames.value])) : filterList.value.find(item => item[columnsFieldNames.value] == data.value)
    data.text = multiple ? data.checkData.map(item => item[columnsFieldNames.text]).join(',') : data.checkData?.[columnsFieldNames.text]
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
  if (!remote)
    filterList.value = columns.filter(c => (c[columnsFieldNames.text] as string)?.match(keyWord.value)) as []
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
    const valueIndex= filterList.value?.findIndex(d=>data.value==d[columnsFieldNames.value])
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
    if (remote && columnsFieldNames.text == columnsFieldNames.value&&!selectWord) keyWord.value = newVal
    if(columnsFieldNames.text == columnsFieldNames.value){
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
  <view class="border-box h-6 w-full" :class="{ 'b-none': disabled }">
    <view class="uni-input border-box h-full w-full flex items-center text-left text-sm" :value="data.text"
      :disabled="disabled" placeholder="" @click="showPopUp">
      <slot>
        <view class="flex flex-1 items-center text-[14px] w-0" :class="{ 'text-[#c0c4cc]': !data.text }"
          :cancelButton='false'>
          <text class="truncate">
            {{ data.text || placeholder }}
          </text>
        </view>
        <u-icon name="arrow-right" v-if="showArrow" />
      </slot>
    </view>
    <wd-popup v-model="show" position="bottom" custom-class="rounded-t-lg overflow-hidden">
      <view class="uni-list">
        <view class="tree-bar">
          <view class="tree-bar-cancel" @click="onCancel">取消</view>
          <view class="tree-bar-submit" @click="onConfirm">确定</view>
        </view>
        <view v-if="showSearch" class="m-1">
          <wd-search v-model="keyWord" placeholder="请输入关键词搜索" bg-color="#efefef" :showAction="false"
            @change='onSearch'></wd-search>
        </view>
        <view class=" overflow-hidden">
          <scroll-view class="h-80" scroll-x="false" scroll-y="true" >
            <wd-radio-group v-if="!multiple" v-model="data.value" cell>
              <wd-radio :value="item[columnsFieldNames.value]" :disabled="item.disabled"
                v-for="(item, index) in filterList" :key="item[columnsFieldNames.value]">{{
                item[columnsFieldNames.text] }}</wd-radio>
            </wd-radio-group>
            <wd-checkbox-group v-if="multiple" v-model="data.value" cell>
                <wd-checkbox :modelValue="item[columnsFieldNames.value]" :disabled="item.disabled" v-for="(item, index) in filterList" :key="item[columnsFieldNames.value]">{{
                  item[columnsFieldNames.text] }}</wd-checkbox>
            </wd-checkbox-group>
          </scroll-view>
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
</style>
