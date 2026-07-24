<script lang="ts" setup>

const props = withDefaults(
  defineProps<{
    modelValue: string | number | undefined
    modelName: string | number | undefined
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
    defaultData?: Array<Record<string, string | number>>
    search:boolean
    searchKey:string
    wrap:boolean
    params: Object
    formatLabel?: any
    tags: boolean,
    excludeIds: Array,
    // 关键词为空搜索
    emptySearch?: boolean
    searchPlaceholder?: string
    token?: string
    /** 远程分页每页条数 */
    pageSize?: number
    /** 非 remote 时本地假分页每页条数 */
    localPageSize?: number
  }>(),
  {
    modelValue: '',
    modelName: '',
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
    defaultData: [],
    search: false,
    searchKey: 'enterpriseName',
    wrap:false,
    params: null,
    formatLabel: null,
    tags: false,
    excludeIds: [],
    emptySearch: true,
    searchPlaceholder: '请输入关键词搜索',
    token: '',
    pageSize: 20,
    localPageSize: 30,
  }
)

const emit = defineEmits<{ (e: 'update:modelValue', payload: any): void; (e: 'change', payload: any): void, (e: 'update:modelName', palyod: any):void }>()

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
  }, 100)
}

// 回显
async function reShow(flag = false) {
  if (!flag) await onSearch()
  if (
    (props.multiple && data.value?.length > 0) ||
    (!props.multiple && (data.value || data.value === 0 || data.value === '0'))
  ) {
    
    const sourceList = props.remote ? filterList.value : getLocalSourceList()
    data.checkData = props.multiple
      ? sourceList.filter((item) => data.value.includes(item[props.valueKey]))
      : sourceList.find((item) => item[props.valueKey] == data.value)
    data.text = props.multiple
      ? data.checkData.map((item) => item[props.labelKey]).join(',')
      : data.checkData?.[props.labelKey]
  } else {
    data.text = ''
  }
  emit('update:modelName', data.text)
}

const show = ref(false)
function showPopUp() {
  props.beforeOpenFunc?.()
  if (props.disabled) return
  show.value = true
  onSearch()
}

// 搜索关键字
const keyWord = ref('')
/** 弹层列表当前渲染的数据（本地/远程均为分页后的可见项） */
const filterList = ref<Array<Record<string, string | number>>>([])
/** 非 remote：关键词过滤后的全量，用于回显与本地分页 */
const fullFilterList = ref<Array<Record<string, string | number>>>([])
const pageNum = ref(1)
const total = ref(0)
const isFinished = ref(false)
const isLoading = ref(false)

function matchKeyword(label: unknown) {
  if (!keyWord.value) return true
  return (label as string)?.match(keyWord.value)
}

function mergeUniqueRows(
  base: Array<Record<string, string | number>>,
  extra: Array<Record<string, string | number>>
) {
  const uniqueExtra = extra.filter(
    (row) => !base.find((item) => item[props.valueKey] == row[props.valueKey])
  )
  return [...uniqueExtra, ...base]
}

function applyExcludeIds(list: Array<Record<string, string | number>>) {
  if (!props.excludeIds?.length) return list
  return list.filter((row) => !props.excludeIds.includes(row[props.valueKey]))
}

function buildLocalFullList() {
  let list = props.columns.filter((c) => matchKeyword(c[props.labelKey])) as Array<
    Record<string, string | number>
  >
  if (props.defaultData?.length) {
    const defaults = props.defaultData.filter((c) => matchKeyword(c[props.labelKey])) as Array<
      Record<string, string | number>
    >
    list = mergeUniqueRows(list, defaults)
  }
  const checked = props.multiple
    ? (Array.isArray(data.checkData) ? data.checkData : [])
    : data.checkData && typeof data.checkData === 'object'
      ? [data.checkData]
      : []
  if (checked.length)
    list = mergeUniqueRows(list, checked as Array<Record<string, string | number>>)
  return applyExcludeIds(list)
}

function getLocalSourceList() {
  return fullFilterList.value.length ? fullFilterList.value : buildLocalFullList()
}

function resetLocalPageDisplay() {
  fullFilterList.value = buildLocalFullList()
  filterList.value = fullFilterList.value.slice(0, props.localPageSize)
}

function loadMoreLocal() {
  if (filterList.value.length >= fullFilterList.value.length) return
  const start = filterList.value.length
  filterList.value.push(
    ...fullFilterList.value.slice(start, start + props.localPageSize)
  )
}

const handleSearch = debounce(onSearch, 300)
async function onSearch() {
  if (!props.remote)
    resetLocalPageDisplay()
  else {
    pageNum.value = 1
    isFinished.value = false
    await getRemoteData()
  }
}

// 获取数据
async function getRemoteData(isLoadMore = false) {
  if (isLoading.value) return
  isLoading.value = true
  try {
    let idsData = []
    if (props.customFunc) {
      filterList.value = await props.customFunc(keyWord.value)
    } else {
      
      if (props.params && Object.values(props.params).every(e => e === undefined || e === null)) return
      if (data.value?.length && props.multiple) data.checkData = filterList.value.filter((item) => data.value?.includes(item[props.valueKey]))
      const req={
        pageNum: pageNum.value,
        pageSize: props.pageSize,
        [props.searchKey]: keyWord.value,
        ...props.params || {},
      }
      const ids = props.multiple ? data.value ?? [] : data.value ? [data.value] : []
      if(!props.remoteUrl) return
      if (!show.value&&ids?.length&& props.emptySearch) {
        const { data: d } = await post(props.remoteUrl, {...req,ids},{token:props.token})
        idsData = d?.records || []
      }
      // 关键词为空不搜索
      const { data:d } =!props.emptySearch&&!keyWord.value? { data: { records: [], total: 0 } }:( await post(props.remoteUrl, req, { token: props.token }))
      const records = d?.records || []
      if (isLoadMore) {
        // Prevent duplicates
        const existingKeys = new Set(filterList.value.map(f => f[props.valueKey]))
        const newRecords = records.filter(r => !existingKeys.has(r[props.valueKey]))
        filterList.value.push(...newRecords)
      } else {
        filterList.value = records
      }
      total.value = d?.total || 0
      // 判断是否加载完成
      if (records.length < props.pageSize) {
        isFinished.value = true
      }
    }
    
    if (props.defaultData?.length) {
      const list = props.defaultData.filter(d => !filterList.value.find(f => f[props.valueKey] == d[props.valueKey])).filter((c) =>(c[props.labelKey] as string)?.match(keyWord.value)) as []
      filterList.value = [...list,...filterList.value]
    }
    if (data.checkData?.length) {
      const list = data.checkData.filter(d => !filterList.value.find(f => f[props.valueKey] == d[props.valueKey]))
      filterList.value = [...list,...filterList.value]
    }
    if (idsData?.length) {
      const list = idsData.filter(d => !filterList.value.find(f => f[props.valueKey] == d[props.valueKey]))
      filterList.value = [...list,...filterList.value]
    }
    filterList.value=filterList.value.filter(e=> !props.excludeIds.includes(e[props.valueKey]))
    if (props.remote && props.showSearch&&!props.multiple) {
      const valueIndex = filterList.value?.findIndex((d) => data.value == d[props.valueKey]||data.value?.includes(d[props.valueKey]))
      if (valueIndex == -1) data.value = props.multiple? [] : ''
    }
  } finally {
    isLoading.value = false
  }
}

function loadMore() {
  if (props.remote) {
    if (!isFinished.value && !isLoading.value) {
      pageNum.value++
      getRemoteData(true)
    }
    return
  }
  loadMoreLocal()
}
const closeTag =(item) => {
  data.value = data.value.filter((d) => d != item[props.valueKey])
  data.checkData = data.checkData.filter((d) => d[props.valueKey] != item[props.valueKey])
  isConfirm = true
  reShow(true)
  emit('update:modelValue', data.value)
  emit('change', data.checkData)
  setTimeout(() => {
    isConfirm = false
  }, 100)
}

watch(
  () => props.columns,
  (newVal, oldVal) => {
    reShow()
  },
  { deep: true }
)
watch(
  () => props.params,
  (newVal, oldVal) => {
    // 只有在 params 内容真正变化时才触发
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      reShow()
    }
  },
  { deep: true }
)
watch(
  () => props.modelValue,
  (newVal, oldVal) => {
    data.value = (newVal||newVal===0||newVal==='0') ? newVal : props.multiple ? [] : ''
    if (!isConfirm) {
      if (props.remote && props.labelKey == props.valueKey && !props.selectWord)keyWord.value = newVal
      if (props.labelKey == props.valueKey) {
        data.text = data.value
        emit('update:modelName', data.text)
        if (props.selectWord) return
      }
      reShow()
    }
  },
  { immediate: true }
)
defineExpose({
  onCancel
})

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
  <view class="border-box w-full " :class="{ 'b-none': props.disabled }">
    <view class="uni-input border-box h-full w-full flex items-center  text-sm relative" :value="data.text" @click="showPopUp">
      <view class="flex-1 overflow-hidden flex ">
        <slot :data="data">
          <wd-input v-if="showType=='default'" readonly v-model="data.text" :custom-class="`w-full ${search ?'!bg-transparent':''} ${tags ? 'opacity-0' : ''}`" no-border :disabled="disabled"
            :placeholder="placeholder" />
          <wd-textarea v-if="showType=='textarea'" no-border  :disabled="disabled" readonly auto-height v-model="data.text"  :placeholder="placeholder" custom-class="w-full !py-0"/>
            <view v-if="multiple && tags && data.text"
            class=" flex items-center justify-end  gap-1  absolute right-0 w-full z-10 whitespace-nowrap pr-3">
            <scroll-view scroll-x="true">
              <wd-tag v-for="(item, index) in data.checkData" :key="index" round size="mini" closable custom-class="mr-1"
                @close.stop="closeTag(item)">{{ item[props.labelKey] }}</wd-tag>
            </scroll-view>
          </view>
        </slot>
      </view>
      <slot name="right">
        <wd-icon :name="search ? 'caret-down-small' : 'right'" color="#999" :size="search ? '20' : '14'"
          v-if="!disabled && showArrow"></wd-icon>
      </slot>
    </view>
    <wd-popup v-model="show" position="bottom" custom-class="rounded-t-lg overflow-hidden " root-portal>
      <view class="select-list">
        <view class="h-10 relative">
          <view class="flex items-center justify-center h-full text-base">
            请选择
            <!-- {{ label?.replace(/^\d+\./, '')?.trim() }} -->
          </view>
          <wd-icon name="close" size="16" color="#666" custom-class="absolute top-3 right-5" @click="onCancel" />
        </view>
        <wd-search v-if="showSearch" v-model="keyWord" :placeholder="searchPlaceholder" hide-cancel custom-class="pop-search"
          placeholderLeft @change="handleSearch" @clear="onSearch"></wd-search>
        <view class=" overflow-hidden">
          <scroll-view
            class="select-list-scroll"
            scroll-x="false"
            scroll-y
            :lower-threshold="80"
            @scrolltolower="loadMore"
          >
            <view class="text-xs mx-4 text-[#333]" v-if="!filterList?.length&&keyWord" @click="show=false"><slot name="add-empty" :keyword="keyWord"></slot></view>
            <wd-radio-group v-if="!props.multiple" v-model="data.value" cell>
              <view v-for="(item, index) in filterList" :key="item[valueKey]">
                <wd-radio :value="item[valueKey]" :disabled="item.disabled"
                  shape="dot" icon-placement="left" :custom-class="`overflow-hidden !py-2 ${data.value == item[valueKey] ? 'selected' : ''}`">
                  {{ props.formatLabel ? props.formatLabel(item) : item[labelKey] }}
                </wd-radio>
              </view>
            </wd-radio-group>
            <wd-checkbox-group v-if="props.multiple" v-model="data.value" cell>
              <view v-for="(item, index) in filterList" :key="item[valueKey]">
                <wd-checkbox :name="item[valueKey]" :disabled="item.disabled" shape="square"
                  :custom-label-class="`flex-1 text-left ${data.value && data.value.includes && data.value.includes(item[valueKey]) ? '' : 'truncate'}`" custom-class="!flex items-center overflow-hidden !py-2">
                  {{ props.formatLabel ? props.formatLabel(item) : item[labelKey] }}
                </wd-checkbox>
              </view>
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
.select-list-scroll {
  height: 640rpx;
  box-sizing: border-box;
}
:deep(.wd-radio) {
  padding:0 12px;
}
.select-list {
  ::v-deep .wd-radio__label {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .selected{
    ::v-deep .wd-radio__label {
        white-space: normal;
      }
  }
}
</style>