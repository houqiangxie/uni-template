<script lang="ts">
export type SelectValue = string | number | Array<string | number> | null | undefined

export type SelectRow = Record<string, string | number | boolean | undefined>

export type SelectModelValue = string | number | Array<string | number> | undefined

export function isSameSelectValue(
  a: SelectValue,
  b: SelectValue,
  multiple: boolean,
): boolean {
  if (multiple) {
    const arrA = Array.isArray(a) ? a : []
    const arrB = Array.isArray(b) ? b : []
    if (arrA.length !== arrB.length)
      return false
    const setB = new Set(arrB.map(v => String(v)))
    return arrA.every(v => setB.has(String(v)))
  }
  if (a == null && b == null)
    return true
  return String(a) === String(b)
}

export function hasSelectValue(value: SelectValue, multiple: boolean): boolean {
  if (multiple)
    return Array.isArray(value) && value.length > 0
  return value === 0 || value === '0' || (value != null && value !== '')
}

export function normalizeSelectValue(
  val: SelectValue,
  multiple: boolean,
): string | number | Array<string | number> {
  if (multiple)
    return Array.isArray(val) ? val : []
  if (val === undefined || val === null)
    return ''
  return val as string | number
}

export function getSelectValueList(
  value: string | number | Array<string | number>,
): Array<string | number> {
  if (Array.isArray(value))
    return value
  if (value === '' || value == null)
    return []
  return [value]
}

export function buildSelectValueSet(
  value: string | number | Array<string | number>,
): Set<string> {
  return new Set(getSelectValueList(value).map(v => String(v)))
}

export function selectValueIncludes(
  value: string | number | Array<string | number>,
  key: string | number,
): boolean {
  return buildSelectValueSet(value).has(String(key))
}

export function mergeUniqueRowsByKey(
  base: SelectRow[],
  extra: SelectRow[],
  valueKey: string,
): SelectRow[] {
  const keySet = new Set(base.map(item => String(item[valueKey])))
  const uniqueExtra = extra.filter(row => !keySet.has(String(row[valueKey])))
  return uniqueExtra.length ? [...uniqueExtra, ...base] : base
}

export function prependMissingRows(
  target: SelectRow[],
  source: SelectRow[],
  valueKey: string,
): SelectRow[] {
  if (!source.length)
    return target

  const keySet = new Set(target.map(item => String(item[valueKey])))
  const missing = source.filter(row => !keySet.has(String(row[valueKey])))
  return missing.length ? [...missing, ...target] : target
}

export function filterExcludeIds(
  list: SelectRow[],
  excludeIds: Array<string | number>,
  valueKey: string,
): SelectRow[] {
  if (!excludeIds.length)
    return list
  const excludeSet = new Set(excludeIds.map(id => String(id)))
  return list.filter(row => !excludeSet.has(String(row[valueKey])))
}

export function shallowEqualObjects(
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
): boolean {
  if (a === b)
    return true
  if (!a || !b)
    return false

  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length)
    return false

  return keysA.every(key => a[key] === b[key])
}

export type RemoteRequestPayload = Record<string, unknown>

/** Build a stable signature for remote request deduplication. */
export function buildRemoteRequestSignature(payload: RemoteRequestPayload): string {
  return JSON.stringify(payload)
}

/**
 * Coordinates overlapping remote requests:
 * - stale response detection via sequence id
 * - merge rapid triggers into one follow-up run
 */
export function createRemoteRequestCoordinator() {
  let seq = 0
  let pending = false

  return {
    next() {
      return ++seq
    },
    isStale(id: number) {
      return id !== seq
    },
    markPending() {
      pending = true
      seq++
    },
    consumePending() {
      const value = pending
      pending = false
      return value
    },
  }
}
</script>

<script setup lang="ts">
defineOptions({
  name: 'ComSelect',
  options: {
    styleIsolation: 'shared',
  },
})

const props = withDefaults(
  defineProps<{
    modelValue?: SelectModelValue
    modelName?: string | number
    columns?: SelectRow[]
    name?: string
    label?: string
    labelKey?: string
    valueKey?: string
    beforeOpenFunc?: () => void
    showArrow?: boolean
    disabled?: boolean
    multiple?: boolean
    itemRef?: unknown
    remote?: boolean
    remoteUrl?: string
    showType?: 'default' | 'textarea'
    showSearch?: boolean
    placeholder?: string
    title?: string
    customFunc?: (keyword: string) => Promise<SelectRow[]> | SelectRow[]
    allowCreate?: boolean
    defaultData?: SelectRow[]
    embedded?: boolean
    searchKey?: string
    wrap?: boolean
    params?: SelectParams | null
    formatLabel?: (item: SelectRow) => string
    showTags?: boolean
    excludeIds?: Array<string | number>
    emptySearch?: boolean
    searchPlaceholder?: string
    token?: string
    pageSize?: number
    localPageSize?: number
  }>(),
  {
    modelValue: undefined,
    modelName: '',
    columns: () => [],
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
    placeholder: '',
    title: '',
    customFunc: undefined,
    allowCreate: false,
    beforeOpenFunc: undefined,
    showArrow: true,
    defaultData: () => [],
    embedded: false,
    searchKey: 'name',
    wrap: false,
    params: null,
    formatLabel: undefined,
    showTags: false,
    excludeIds: () => [],
    emptySearch: true,
    searchPlaceholder: '',
    token: '',
    pageSize: 20,
    localPageSize: 30,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: SelectModelValue]
  change: [payload: SelectRow | SelectRow[]]
  'update:modelName': [name: string]
  cancel: []
}>()

type SelectParams = Record<string, unknown>

const { t } = useI18n()
const resolvedTitle = computed(() => props.title || t('comSelect.title'))
const resolvedPlaceholder = computed(() => props.placeholder || t('comSelect.placeholder'))
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder || t('comSelect.searchPlaceholder'))
const resolvedEmptyText = computed(() => t('comSelect.empty'))

const show = ref(false)
let isConfirm = false

const data = reactive<{
  checkData: SelectRow | SelectRow[]
  value: string | number | Array<string | number>
  text: string
}>({
  checkData: {},
  value: '',
  text: '',
})

const multipleValue = computed({
  get: () => (Array.isArray(data.value) ? data.value : []) as Array<string | number>,
  set: (val: Array<string | number>) => {
    data.value = val
  },
})

const keyWord = ref('')
const filterList = ref<SelectRow[]>([])
const fullFilterList = ref<SelectRow[]>([])
const pageNum = ref(1)
const total = ref(0)
const isFinished = ref(false)
const isLoading = ref(false)
const remoteCoordinator = createRemoteRequestCoordinator()
let inflightSignature = ''
let inflightPromise: Promise<void> | null = null

function onCancel() {
  show.value = false
}

function open() {
  props.beforeOpenFunc?.()
  if (props.disabled)
    return
  show.value = true
  onSearch()
}

function onConfirm() {
  reShow(true)
  if (props.showSearch && props.allowCreate && !hasSelectValue(data.value, props.multiple)) {
    data.value = props.multiple ? [keyWord.value] : keyWord.value
    data.text = keyWord.value
    data.checkData = props.multiple
      ? [{ [props.valueKey]: keyWord.value, [props.labelKey]: keyWord.value }]
      : { [props.valueKey]: keyWord.value, [props.labelKey]: keyWord.value }
  }

  if (isSameSelectValue(data.value, props.modelValue, props.multiple)) {
    onCancel()
    return
  }

  isConfirm = true
  emit('update:modelValue', data.value as SelectModelValue)
  emit('change', data.checkData)
  onCancel()
  setTimeout(() => {
    isConfirm = false
  }, 100)
}

async function reShow(skipSearch = false) {
  if (!skipSearch)
    await onSearch()

  if (hasSelectValue(data.value, props.multiple)) {
    const sourceList = props.remote ? filterList.value : getLocalSourceList()
    if (props.multiple) {
      const valueSet = buildSelectValueSet(data.value)
      data.checkData = sourceList.filter(item => valueSet.has(String(item[props.valueKey])))
      data.text = (data.checkData as SelectRow[]).map(item => item[props.labelKey]).join(',')
    }
    else {
      data.checkData = sourceList.find(item => String(item[props.valueKey]) === String(data.value)) || {}
      data.text = String((data.checkData as SelectRow)[props.labelKey] ?? '')
    }
  }
  else {
    data.text = ''
    data.checkData = props.multiple ? [] : {}
  }

  emit('update:modelName', data.text)
}

const selectedValueSet = computed(() => buildSelectValueSet(data.value))

function matchKeyword(label: unknown) {
  if (!keyWord.value)
    return true
  return String(label ?? '').includes(keyWord.value)
}

function getCheckedRows(): SelectRow[] {
  if (props.multiple)
    return Array.isArray(data.checkData) ? data.checkData : []
  if (data.checkData && typeof data.checkData === 'object' && !Array.isArray(data.checkData))
    return Object.keys(data.checkData).length ? [data.checkData as SelectRow] : []
  return []
}

function buildLocalFullList() {
  let list = props.columns.filter(c => matchKeyword(c[props.labelKey]))
  if (props.defaultData?.length) {
    const defaults = props.defaultData.filter(c => matchKeyword(c[props.labelKey]))
    list = mergeUniqueRowsByKey(list, defaults, props.valueKey)
  }
  const checked = getCheckedRows()
  if (checked.length)
    list = mergeUniqueRowsByKey(list, checked, props.valueKey)
  return filterExcludeIds(list, props.excludeIds, props.valueKey)
}

function getLocalSourceList() {
  return fullFilterList.value.length ? fullFilterList.value : buildLocalFullList()
}

function resetLocalPageDisplay() {
  fullFilterList.value = buildLocalFullList()
  filterList.value = fullFilterList.value.slice(0, props.localPageSize)
}

function loadMoreLocal() {
  if (filterList.value.length >= fullFilterList.value.length)
    return
  const start = filterList.value.length
  filterList.value.push(...fullFilterList.value.slice(start, start + props.localPageSize))
}

const handleSearch = debounce(onSearch, 300)
const handleRemoteRefresh = debounce(onSearch, 200)

async function onSearch() {
  if (!props.remote) { resetLocalPageDisplay() }
  else {
    pageNum.value = 1
    isFinished.value = false
    await getRemoteData()
  }
}

async function getRemoteData(isLoadMore = false, force = false) {
  if (props.customFunc) {
    const requestId = remoteCoordinator.next()
    isLoading.value = true
    try {
      filterList.value = await props.customFunc(keyWord.value)
      if (remoteCoordinator.isStale(requestId))
        return
      applyRemoteListExtras([])
    }
    finally {
      if (!remoteCoordinator.isStale(requestId))
        isLoading.value = false
      if (remoteCoordinator.consumePending())
        getRemoteData(isLoadMore, true)
    }
    return
  }

  if (props.params && Object.values(props.params).every(e => e === undefined || e === null))
    return
  if (!props.remoteUrl)
    return

  const req = {
    pageNum: pageNum.value,
    pageSize: props.pageSize,
    [props.searchKey]: keyWord.value,
    ...(props.params || {}),
  }
  const ids = getSelectValueList(data.value)
  const needIdsFetch = !show.value && ids.length > 0 && props.emptySearch
  const needMainFetch = props.emptySearch || !!keyWord.value
  const signature = buildRemoteRequestSignature({
    loadMore: isLoadMore,
    needIdsFetch,
    needMainFetch,
    req,
    ids,
  })

  if (!isLoadMore && !force && inflightPromise && inflightSignature === signature)
    return inflightPromise

  if (isLoading.value && !isLoadMore && !force) {
    remoteCoordinator.markPending()
    return
  }

  const requestId = remoteCoordinator.next()
  isLoading.value = true
  inflightSignature = signature

  inflightPromise = (async () => {
    try {
      if (props.multiple && Array.isArray(data.value) && data.value.length) {
        const valueSet = buildSelectValueSet(data.value)
        data.checkData = filterList.value.filter(item => valueSet.has(String(item[props.valueKey])))
      }

      const [idsResult, mainResult] = await Promise.all([
        needIdsFetch
          ? post(props.remoteUrl!, { ...req, ids }, { token: props.token })
          : Promise.resolve(null),
        needMainFetch
          ? post(props.remoteUrl!, req, { token: props.token })
          : Promise.resolve({ data: { records: [], total: 0 } }),
      ])

      if (remoteCoordinator.isStale(requestId))
        return

      const idsData: SelectRow[] = idsResult?.data?.records || []
      const records: SelectRow[] = mainResult?.data?.records || []

      if (isLoadMore) {
        const existingKeys = new Set(filterList.value.map(f => String(f[props.valueKey])))
        const newRecords = records.filter(r => !existingKeys.has(String(r[props.valueKey])))
        filterList.value.push(...newRecords)
      }
      else {
        filterList.value = records
      }

      total.value = mainResult?.data?.total || 0
      if (records.length < props.pageSize)
        isFinished.value = true

      applyRemoteListExtras(idsData)
    }
    finally {
      if (!remoteCoordinator.isStale(requestId)) {
        isLoading.value = false
        inflightSignature = ''
        inflightPromise = null
      }
      if (remoteCoordinator.consumePending())
        getRemoteData(isLoadMore, true)
    }
  })()

  return inflightPromise
}

function applyRemoteListExtras(idsData: SelectRow[]) {
  if (props.defaultData?.length) {
    const defaults = props.defaultData.filter(c => matchKeyword(c[props.labelKey]))
    filterList.value = prependMissingRows(filterList.value, defaults, props.valueKey)
  }

  if (Array.isArray(data.checkData) && data.checkData.length)
    filterList.value = prependMissingRows(filterList.value, data.checkData, props.valueKey)

  if (idsData.length)
    filterList.value = prependMissingRows(filterList.value, idsData, props.valueKey)

  filterList.value = filterExcludeIds(filterList.value, props.excludeIds, props.valueKey)

  if (props.remote && props.showSearch && !props.multiple) {
    const valueIndex = filterList.value.findIndex(d => String(data.value) === String(d[props.valueKey]))
    if (valueIndex === -1)
      data.value = ''
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

function closeTag(item: SelectRow) {
  if (!Array.isArray(data.value) || !Array.isArray(data.checkData))
    return

  data.value = data.value.filter(d => String(d) !== String(item[props.valueKey]))
  data.checkData = data.checkData.filter(d => String(d[props.valueKey]) !== String(item[props.valueKey]))
  isConfirm = true
  reShow(true)
  emit('update:modelValue', data.value)
  emit('change', data.checkData)
  setTimeout(() => {
    isConfirm = false
  }, 100)
}

function isRowDisabled(item: SelectRow) {
  return !!item.disabled
}

function isRowSelected(item: SelectRow) {
  return selectedValueSet.value.has(String(item[props.valueKey]))
}

watch(
  () => props.columns,
  () => {
    reShow()
  },
  { deep: true },
)

watch(
  () => props.params,
  (newVal, oldVal) => {
    if (!shallowEqualObjects(newVal, oldVal)) {
      if (props.remote)
        handleRemoteRefresh()
      else
        reShow()
    }
  },
  { deep: true },
)

watch(
  () => props.modelValue,
  (newVal) => {
    data.value = normalizeSelectValue(newVal, props.multiple)
    if (isConfirm)
      return

    if (show.value) {
      if (props.labelKey === props.valueKey) {
        data.text = String(data.value ?? '')
        emit('update:modelName', data.text)
      }
      return
    }

    if (props.remote && props.labelKey === props.valueKey && !props.allowCreate)
      keyWord.value = String(newVal ?? '')

    if (props.labelKey === props.valueKey) {
      data.text = String(data.value ?? '')
      emit('update:modelName', data.text)
      if (props.allowCreate)
        return
    }

    reShow()
  },
  { immediate: true },
)

watch(show, (val, oldVal) => {
  if (!val && oldVal && !isConfirm)
    emit('cancel')
})

defineExpose({
  onCancel,
  open,
})
</script>

<template>
  <view class="w-full com-select border-box" :class="{ 'b-none': disabled }">
    <view class="border-box w-full flex items-center uni-input h-full text-sm relative" @click="open">
      <view class="flex-1 overflow-hidden flex">
        <slot :data="data">
          <wd-input
            v-if="showType === 'default'"
            v-model="data.text"
            readonly
            no-border
            :disabled="disabled"
            :placeholder="resolvedPlaceholder"
            :custom-class="`w-full ${embedded ? '!bg-transparent' : ''} ${showTags ? 'opacity-0' : ''}`"
          />
          <wd-textarea
            v-else-if="showType === 'textarea'"
            v-model="data.text"
            no-border
            readonly
            auto-height
            :disabled="disabled"
            :placeholder="resolvedPlaceholder"
            custom-class="w-full !py-0"
          />
          <view
            v-if="multiple && showTags && data.text"
            class="flex items-center w-full justify-end gap-1 absolute right-0 z-10 whitespace-nowrap pr-3"
          >
            <scroll-view scroll-x>
              <wd-tag
                v-for="item in (data.checkData as SelectRow[])"
                :key="item[valueKey]"
                round
                closable
                custom-class="mr-1 com-select__tag"
                @close.stop="closeTag(item)"
              >
                {{ item[labelKey] }}
              </wd-tag>
            </scroll-view>
          </view>
        </slot>
      </view>
      <slot name="right">
        <wd-icon
          v-if="!disabled && showArrow"
          :name="embedded ? 'caret-down-small' : 'right'"
          color="#999"
          :size="embedded ? '20' : '14'"
        />
      </slot>
    </view>

    <wd-popup v-model="show" position="bottom" custom-class="rounded-t-lg overflow-hidden" root-portal>
      <view class="select-list">
        <view class="relative h-10">
          <view class="flex items-center h-full justify-center text-base">
            {{ resolvedTitle }}
          </view>
          <wd-icon name="close" size="16" color="#666" custom-class="absolute top-3 right-5" @click="onCancel" />
        </view>
        <wd-search
          v-if="showSearch"
          v-model="keyWord"
          :placeholder="resolvedSearchPlaceholder"
          hide-cancel
          custom-class="pop-search"
          placeholder-left
          @change="handleSearch"
          @clear="onSearch"
        />
        <view class="overflow-hidden">
          <scroll-view
            class="select-list-scroll"
            scroll-y
            :lower-threshold="80"
            @scrolltolower="loadMore"
          >
            <view v-if="isLoading" class="select-list-state">
              {{ t('common.loading') }}
            </view>
            <view v-else-if="!filterList.length && keyWord">
              <slot name="add-empty" :keyword="keyWord" />
            </view>
            <view v-else-if="!filterList.length" class="select-list-state">
              {{ resolvedEmptyText }}
            </view>
            <template v-else>
              <wd-radio-group v-if="!multiple" v-model="data.value" cell>
                <view v-for="item in filterList" :key="item[valueKey]">
                  <wd-radio
                    :value="item[valueKey]"
                    :disabled="isRowDisabled(item)"
                    shape="dot"
                    icon-placement="left"
                    :custom-class="`overflow-hidden !py-2 ${isRowSelected(item) ? 'selected' : ''}`"
                  >
                    {{ formatLabel ? formatLabel(item) : item[labelKey] }}
                  </wd-radio>
                </view>
              </wd-radio-group>
              <wd-checkbox-group v-else v-model="multipleValue" cell>
                <view v-for="item in filterList" :key="item[valueKey]">
                  <wd-checkbox
                    :name="item[valueKey]"
                    :disabled="isRowDisabled(item)"
                    shape="square"
                    :custom-label-class="`flex-1 text-left ${isRowSelected(item) ? '' : 'truncate'}`"
                    custom-class="!flex items-center overflow-hidden !py-2"
                  >
                    {{ formatLabel ? formatLabel(item) : item[labelKey] }}
                  </wd-checkbox>
                </view>
              </wd-checkbox-group>
            </template>
          </scroll-view>
        </view>
        <view class="p-2">
          <wd-button type="primary" block @click="onConfirm">
            {{ t('common.confirm') }}
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.com-select {
  :deep(.com-select__tag) {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    font-size: 24rpx;
    padding: 0 12rpx;
  }
}

.select-list-scroll {
  height: 640rpx;
  box-sizing: border-box;
}

.select-list-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}

:deep(.wd-radio) {
  padding: 0 12px;
}

.select-list {
  :deep(.wd-radio__label) {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selected {
    :deep(.wd-radio__label) {
      white-space: normal;
    }
  }
}
</style>
