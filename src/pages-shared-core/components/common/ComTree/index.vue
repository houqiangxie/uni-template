<script lang="ts">
import type { InjectionKey, Ref } from 'vue'
import { inject, provide } from 'vue'
import { deepClone } from '@/utils/common'

export interface TreeNodeModel extends Record<string, any> {
  level?: number
  parent?: TreeNodeModel | null
  isShowChild?: boolean
  checkStatus?: number
  disabled?: boolean
  /** 懒加载：是否为叶子节点 */
  isLeaf?: boolean
  /** 懒加载：子节点是否已加载（内部状态） */
  loaded?: boolean
  /** 懒加载：是否正在加载子节点（内部状态） */
  loading?: boolean
}

export type TreeLoadHandler = (
  node: TreeNodeModel | null,
  resolve: (children: TreeNodeModel[]) => void,
) => void | Promise<TreeNodeModel[]>

export type TreeSearchSideEffectHandler = (
  keyword: string,
) => void | Promise<void>

export type TreeRemoteSearchHandler = (
  keyword: string,
) => Promise<TreeNodeModel[]> | TreeNodeModel[]

/** 远程搜索：返回树数据则组件内直接渲染；无返回值则由外部更新 options */
export type TreeSearchHandler = TreeRemoteSearchHandler | TreeSearchSideEffectHandler

export type TreeParams = Record<string, unknown>

export type TreeValue = string | number | Array<string | number> | null | undefined

export type TreeSearchMode = 'flat' | 'tree'

/** 0 未选 | 1 半选 | 2 全选 */
export const TreeCheckStatus = {
  Unchecked: 0,
  Indeterminate: 1,
  Checked: 2,
} as const

export interface ComTreeContext {
  treeFlat: Ref<TreeNodeModel[]>
  submit: () => void
  popup: Ref<boolean>
  clearCustomNodes: () => void
  lazy: Ref<boolean>
  isLeafKey: Ref<string>
  childrenKey: Ref<string>
  loadNode: (node: TreeNodeModel | null) => Promise<void>
}

export const comTreeContextKey: InjectionKey<ComTreeContext> = Symbol('comTreeContext')

export function provideComTreeContext(ctx: ComTreeContext) {
  provide(comTreeContextKey, ctx)
}

export function useComTreeContext() {
  const ctx = inject(comTreeContextKey)
  if (!ctx)
    throw new Error('useComTreeContext must be used within ComTree')
  return ctx
}

export function isSameTreeValue(
  a: TreeValue,
  b: TreeValue,
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

export function cloneTreeNodes(
  nodes: TreeNodeModel[],
  childrenKey: string,
): TreeNodeModel[] {
  return deepClone(nodes) as TreeNodeModel[]
}

export function buildTreeNodeMap(
  treeFlat: TreeNodeModel[],
  valueKey: string,
): Map<string, TreeNodeModel> {
  const map = new Map<string, TreeNodeModel>()
  treeFlat.forEach((item) => {
    map.set(String(item[valueKey]), item)
  })
  return map
}

export function setChildCheckStatus(
  parent: TreeNodeModel,
  status: number,
  childrenKey: string,
) {
  const list = parent[childrenKey] as TreeNodeModel[] | undefined
  if (!list?.length)
    return
  list.forEach((item) => {
    item.checkStatus = status
    setChildCheckStatus(item, status, childrenKey)
  })
}

export function setParentCheckStatus(
  child: TreeNodeModel,
  childrenKey: string,
) {
  const parent = child.parent
  if (!parent)
    return

  const children = parent[childrenKey] as TreeNodeModel[]
  const statuses = new Set(children.map(item => item.checkStatus))
  parent.checkStatus = statuses.size === 1
    ? [...statuses][0]
    : TreeCheckStatus.Indeterminate

  if (parent.parent)
    setParentCheckStatus(parent, childrenKey)
}

export function treeFindPathByKey(
  tree: TreeNodeModel[],
  childrenKey: string,
  predicate: (node: TreeNodeModel) => boolean,
  path: TreeNodeModel[] = [],
): TreeNodeModel[] {
  for (const node of tree) {
    path.push(node)
    if (predicate(node))
      return [...path]
    const children = node[childrenKey] as TreeNodeModel[] | undefined
    if (children?.length) {
      const found = treeFindPathByKey(children, childrenKey, predicate, path)
      if (found.length)
        return found
    }
    path.pop()
  }
  return []
}

export function filterTreeFlat(
  list: TreeNodeModel[],
  keyword: string,
  labelKey: string,
  childrenKey: string,
): TreeNodeModel[] {
  return list
    .filter(item => !item[childrenKey]?.length)
    .filter(item => String(item[labelKey] ?? '').includes(keyword))
}

/** Filter precomputed leaf nodes — avoids scanning non-leaf nodes on each search. */
export function filterTreeLeaves(
  leafNodes: TreeNodeModel[],
  keyword: string,
  labelKey: string,
): TreeNodeModel[] {
  if (!keyword)
    return leafNodes
  return leafNodes.filter(item => String(item[labelKey] ?? '').includes(keyword))
}

export function resetTreeExpandState(
  list: TreeNodeModel[],
  childrenKey: string,
) {
  list.forEach((node) => {
    node.isShowChild = false
    const children = node[childrenKey] as TreeNodeModel[] | undefined
    if (children?.length)
      resetTreeExpandState(children, childrenKey)
  })
}

export function filterTreeVisibleRoots(
  list: TreeNodeModel[],
  keyword: string,
  labelKey: string,
  childrenKey: string,
): TreeNodeModel[] {
  if (!keyword)
    return list

  function matchBranch(node: TreeNodeModel): boolean {
    const label = String(node[labelKey] ?? '')
    const children = node[childrenKey] as TreeNodeModel[] | undefined
    let childMatched = false
    if (children?.length) {
      const visibleChildren = children.filter(matchBranch)
      node.isShowChild = visibleChildren.length > 0
      childMatched = visibleChildren.length > 0
    }
    return label.includes(keyword) || childMatched
  }

  return list.filter(matchBranch)
}

export function isTreeNodeLeaf(
  node: TreeNodeModel,
  childrenKey: string,
  isLeafKey: string,
  lazy: boolean,
): boolean {
  if (lazy)
    return node[isLeafKey] === true
  return !node[childrenKey]?.length
}

export function isTreeNodeExpandable(
  node: TreeNodeModel,
  childrenKey: string,
  isLeafKey: string,
  lazy: boolean,
): boolean {
  if (lazy)
    return node[isLeafKey] !== true
  return !!node[childrenKey]?.length
}

export function applyCheckStatusFromValue(
  treeFlat: TreeNodeModel[],
  value: TreeValue,
  multiple: boolean,
  valueKey: string,
) {
  const valueSet = multiple && Array.isArray(value)
    ? new Set(value.map(v => String(v)))
    : null

  treeFlat.forEach((item) => {
    const key = String(item[valueKey])
    if (multiple) {
      item.checkStatus = valueSet?.has(key)
        ? TreeCheckStatus.Checked
        : TreeCheckStatus.Unchecked
    }
    else {
      item.checkStatus = value != null && String(value) === key
        ? TreeCheckStatus.Checked
        : TreeCheckStatus.Unchecked
    }
  })
}

export function getTreeValueList(value: TreeValue): Array<string | number> {
  if (Array.isArray(value))
    return value
  if (value === '' || value == null)
    return []
  return [value]
}

export function parseRemoteTreeResponse(result: unknown): TreeNodeModel[] {
  const data = (result as { data?: unknown })?.data
  if (Array.isArray((data as { records?: unknown })?.records))
    return (data as { records: TreeNodeModel[] }).records
  if (Array.isArray(data))
    return data as TreeNodeModel[]
  if (Array.isArray((data as { list?: unknown })?.list))
    return (data as { list: TreeNodeModel[] }).list
  return []
}

export function mergeTreeNodesByKey(
  base: TreeNodeModel[],
  extra: TreeNodeModel[],
  valueKey: string,
): TreeNodeModel[] {
  if (!extra.length)
    return base
  const keySet = new Set(base.map(item => String(item[valueKey])))
  const missing = extra.filter(row => !keySet.has(String(row[valueKey])))
  return missing.length ? [...missing, ...base] : base
}
</script>

<script setup lang="ts">
import { toRef } from 'vue'
import ComTreePanel from './components/ComTreePanel.vue'
import {
  buildRemoteRequestSignature,
  createRemoteRequestCoordinator,
  shallowEqualObjects,
} from '../ComSelect/index.vue'
import { debounce } from '@/utils/common'

defineOptions({
  name: 'ComTree',
  styleIsolation: 'shared',
})

const props = withDefaults(defineProps<{
  modelValue?: TreeValue
  options?: TreeNodeModel[]
  multiple?: boolean
  leafOnly?: boolean
  checkStrictly?: boolean
  showSearch?: boolean
  remote?: boolean
  remoteUrl?: string
  customFunc?: TreeRemoteSearchHandler
  /** 远程搜索回调，等同 @search；返回树数组时组件内直接渲染 */
  searchFunc?: TreeSearchHandler
  searchKey?: string
  params?: TreeParams | null
  token?: string
  emptySearch?: boolean
  lazy?: boolean
  load?: TreeLoadHandler
  /** 懒加载回调，等同 @load */
  loadFunc?: TreeLoadHandler
  isLeafKey?: string
  /** 外部 loading，仅 @search 事件模式使用 */
  loading?: boolean
  showFullPath?: boolean
  pathSeparator?: string
  showField?: boolean
  showArrow?: boolean
  popup?: boolean
  allowCreate?: boolean
  disabled?: boolean
  showTags?: boolean
  embedded?: boolean
  searchMode?: TreeSearchMode
  valueKey?: string
  labelKey?: string
  childrenKey?: string
  placeholder?: string
  title?: string
  searchPlaceholder?: string
  emptyText?: string
}>(), {
  modelValue: null,
  options: () => [],
  multiple: false,
  leafOnly: false,
  checkStrictly: false,
  showSearch: false,
  remote: false,
  remoteUrl: '',
  customFunc: undefined,
  searchFunc: undefined,
  searchKey: 'keyword',
  params: null,
  token: '',
  emptySearch: true,
  lazy: false,
  load: undefined,
  loadFunc: undefined,
  isLeafKey: 'isLeaf',
  loading: false,
  showFullPath: false,
  pathSeparator: '-',
  showField: true,
  showArrow: true,
  popup: true,
  allowCreate: false,
  disabled: false,
  showTags: false,
  embedded: false,
  searchMode: 'flat',
  valueKey: 'id',
  labelKey: 'name',
  childrenKey: 'children',
  placeholder: '',
  title: '',
  searchPlaceholder: '',
  emptyText: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: TreeValue]
  change: [node: TreeNodeModel | TreeNodeModel[], label: string]
  cancel: []
  search: [keyword: string]
  load: [node: TreeNodeModel | null, resolve: (children: TreeNodeModel[]) => void]
}>()

const { t } = useI18n()

const resolvedPlaceholder = computed(() => props.placeholder || t('comTree.placeholder'))
const resolvedTitle = computed(() => props.title || t('comTree.title'))
const resolvedSearchPlaceholder = computed(() => props.searchPlaceholder || t('comTree.searchPlaceholder'))
const resolvedEmptyText = computed(() => props.emptyText || t('comTree.empty'))

const show = ref(false)
let confirmedClose = false
const keyword = ref('')
const filterList = ref<TreeNodeModel[]>([])
const formatText = ref('')
const formatList = ref<TreeNodeModel[]>([])
const treeList = ref<TreeNodeModel[]>([])
const treeFlat = ref<TreeNodeModel[]>([])
const treeLeafNodes = ref<TreeNodeModel[]>([])
const customNodes = ref<TreeNodeModel[]>([])
let optionsRef: TreeNodeModel[] | null = null
let flatSearchCacheKeyword = ''
let flatSearchCacheResult: TreeNodeModel[] = []
const isLoading = ref(false)
const remoteCoordinator = createRemoteRequestCoordinator()
let inflightSignature = ''
let inflightPromise: Promise<void> | null = null

const isRemoteBuiltIn = computed(() => props.remote && (!!props.remoteUrl || !!props.customFunc))
const remoteLoading = computed(() => isRemoteBuiltIn.value ? isLoading.value : props.loading)
const resolvedLoad = computed(() => props.load || props.loadFunc)

// 依赖 loadNode / submit，放在函数定义之后
provideComTreeContext({
  treeFlat,
  submit,
  popup: toRef(props, 'popup'),
  clearCustomNodes,
  lazy: toRef(props, 'lazy'),
  isLeafKey: toRef(props, 'isLeafKey'),
  childrenKey: toRef(props, 'childrenKey'),
  loadNode,
})

function syncFilterList() {
  if (props.remote) {
    filterList.value = treeList.value
    return
  }
  runLocalSearch()
}

function runLocalSearch() {
  if (!keyword.value) {
    resetTreeExpandState(treeList.value, props.childrenKey)
    filterList.value = treeList.value
    flatSearchCacheKeyword = ''
    flatSearchCacheResult = []
    return
  }

  if (props.searchMode === 'tree') {
    resetTreeExpandState(treeList.value, props.childrenKey)
    filterList.value = filterTreeVisibleRoots(
      treeList.value,
      keyword.value,
      props.labelKey,
      props.childrenKey,
    )
    return
  }

  if (keyword.value === flatSearchCacheKeyword) {
    filterList.value = flatSearchCacheResult
    return
  }

  filterList.value = filterTreeLeaves(
    treeLeafNodes.value,
    keyword.value,
    props.labelKey,
  )
  flatSearchCacheKeyword = keyword.value
  flatSearchCacheResult = filterList.value
}

const handleSearch = debounce(onSearch, 300)
const handleRemoteRefresh = debounce(onSearch, 200)

async function onSearch() {
  if (!props.remote) {
    runLocalSearch()

    if (keyword.value && props.allowCreate && !props.multiple) {
      customNodes.value = []
      applyCheckStatusFromValue(treeFlat.value, props.multiple ? [] : '', props.multiple, props.valueKey)
    }
  }
  else if (isRemoteBuiltIn.value) {
    await getRemoteData()
  }
  else if (props.searchFunc) {
    const result = await props.searchFunc(keyword.value)
    if (Array.isArray(result))
      applyRemoteTreeData(result)
  }
  else {
    emit('search', keyword.value)
  }

  if (props.allowCreate && props.multiple)
    filterList.value = [...filterList.value, ...customNodes.value]
}

function applyRemoteTreeData(nodes: TreeNodeModel[], idsData: TreeNodeModel[] = []) {
  const merged = mergeTreeNodesByKey(nodes, idsData, props.valueKey)
  optionsRef = merged
  resetTreeState()
  treeList.value = cloneTreeNodes(merged, props.childrenKey)
  markLoadedNodes(treeList.value)
  flattenTree(treeList.value)
  syncSelectionFromModel()
  syncFilterList()
}

async function getRemoteData(force = false) {
  if (props.customFunc) {
    const requestId = remoteCoordinator.next()
    isLoading.value = true
    try {
      const nodes = await props.customFunc(keyword.value)
      if (remoteCoordinator.isStale(requestId))
        return
      applyRemoteTreeData(nodes || [])
    }
    finally {
      if (!remoteCoordinator.isStale(requestId))
        isLoading.value = false
      if (remoteCoordinator.consumePending())
        getRemoteData(true)
    }
    return
  }

  if (props.params && Object.values(props.params).every(e => e === undefined || e === null))
    return
  if (!props.remoteUrl)
    return

  const req = {
    [props.searchKey]: keyword.value,
    ...(props.params || {}),
  }
  const ids = getTreeValueList(normalizeValue(props.modelValue))
  const needIdsFetch = !show.value && ids.length > 0 && props.emptySearch
  const needMainFetch = props.emptySearch || !!keyword.value
  const signature = buildRemoteRequestSignature({
    needIdsFetch,
    needMainFetch,
    req,
    ids,
  })

  if (!force && inflightPromise && inflightSignature === signature)
    return inflightPromise

  if (isLoading.value && !force) {
    remoteCoordinator.markPending()
    return
  }

  const requestId = remoteCoordinator.next()
  isLoading.value = true
  inflightSignature = signature

  inflightPromise = (async () => {
    try {
      const [idsResult, mainResult] = await Promise.all([
        needIdsFetch
          ? post(props.remoteUrl!, { ...req, ids }, { token: props.token })
          : Promise.resolve(null),
        needMainFetch
          ? post(props.remoteUrl!, req, { token: props.token })
          : Promise.resolve(null),
      ])

      if (remoteCoordinator.isStale(requestId))
        return

      const idsData = idsResult ? parseRemoteTreeResponse(idsResult) : []
      const nodes = mainResult ? parseRemoteTreeResponse(mainResult) : []

      if (needMainFetch)
        applyRemoteTreeData(nodes, idsData)
      else if (idsData.length)
        applyRemoteTreeData(treeList.value.length ? treeList.value : [], idsData)
    }
    finally {
      if (!remoteCoordinator.isStale(requestId)) {
        isLoading.value = false
        inflightSignature = ''
        inflightPromise = null
      }
      if (remoteCoordinator.consumePending())
        getRemoteData(true)
    }
  })()

  return inflightPromise
}

function getFormatText() {
  const selected = [...nodeList.value]
  formatList.value = selected
  return selected.map((item) => {
    if (props.showFullPath) {
      const pathData = treeFindPathByKey(
        treeList.value,
        props.childrenKey,
        node => node[props.valueKey] === item[props.valueKey],
      )
      return pathData.length
        ? pathData.map(node => node[props.labelKey]).join(props.pathSeparator)
        : String(item[props.labelKey] ?? '')
    }
    return String(item[props.labelKey] ?? '')
  }).join(';')
}

function open() {
  if (props.disabled)
    return
  void prepareTreeData()
  show.value = true
}

async function refreshTreeFromOptions() {
  optionsRef = null
  await rebuildTreeFromOptions()
  syncSelectionFromModel()
  syncFilterList()
}

async function prepareTreeData() {
  if (!isRemoteBuiltIn.value)
    await rebuildTreeFromOptions()
  syncSelectionFromModel()
  if (props.remote)
    await onSearch()
  else
    runLocalSearch()
}

function close() {
  show.value = false
}

function cancelPopup() {
  close()
}

function submit() {
  const list = treeFlat.value.concat(cloneTreeNodes(customNodes.value, props.childrenKey))
  let selectKeys: Array<string | number> = []

  list.forEach((item) => {
    if (item.checkStatus !== TreeCheckStatus.Checked)
      return

    if (props.multiple) {
      if (props.checkStrictly || isTreeNodeLeaf(item, props.childrenKey, props.isLeafKey, props.lazy))
        selectKeys.push(item[props.valueKey])
    }
    else {
      selectKeys.push(item[props.valueKey])
    }
  })

  selectKeys = [...new Set(selectKeys)]
  const selectKeySet = new Set(selectKeys.map(key => String(key)))
  let selectNodes = list.filter(item => selectKeySet.has(String(item[props.valueKey])))

  if (!selectNodes.length && props.allowCreate && !props.multiple && keyword.value) {
    const customNode = {
      [props.labelKey]: keyword.value,
      [props.valueKey]: keyword.value,
      checkStatus: TreeCheckStatus.Checked,
    } as TreeNodeModel
    selectNodes = [customNode]
    selectKeys = [keyword.value]
    customNodes.value.push(customNode)
  }

  selectKeys = [...new Set(selectKeys)]
  const value = props.multiple ? selectKeys : selectKeys[selectKeys.length - 1]

  if (props.popup && show.value) {
    confirmedClose = true
    show.value = false
  }

  if (isSameTreeValue(value, props.modelValue, props.multiple))
    return

  const label = props.multiple
    ? selectNodes.map(item => item[props.labelKey]).join(',')
    : String(selectNodes[selectNodes.length - 1]?.[props.labelKey] ?? '')

  emit('update:modelValue', value || (props.multiple ? [] : ''))
  emit(
    'change',
    props.multiple ? selectNodes : selectNodes[selectNodes.length - 1] || {},
    label,
  )
}

function addCustomNode() {
  if (!keyword.value || customNodes.value.some(item => item[props.valueKey] === keyword.value))
    return

  customNodes.value.push({
    [props.labelKey]: keyword.value,
    [props.valueKey]: keyword.value,
    checkStatus: TreeCheckStatus.Checked,
  } as TreeNodeModel)
  keyword.value = ''
  onSearch()
}

function clearCustomNodes() {
  customNodes.value = []
}

function normalizeValue(val: TreeValue) {
  if (val === undefined || val === null)
    return props.multiple ? [] : ''
  return val
}

function invokeLoad(node: TreeNodeModel | null): Promise<TreeNodeModel[]> {
  return new Promise((resolve) => {
    const done = (children: TreeNodeModel[]) => resolve(children || [])
    const handler = resolvedLoad.value

    if (handler) {
      const result = handler(node, done)
      if (result instanceof Promise)
        result.then(done).catch(() => done([]))
      return
    }

    emit('load', node, done)
  })
}

async function loadNode(node: TreeNodeModel | null) {
  if (node?.loaded || node?.loading)
    return

  if (node)
    node.loading = true

  try {
    const children = await invokeLoad(node)

    if (node === null) {
      optionsRef = children
      resetTreeState()
      treeList.value = cloneTreeNodes(children, props.childrenKey)
      flattenTree(treeList.value)
      filterList.value = treeList.value
      syncSelectionFromModel()
      return
    }

    appendLoadedChildren(node, children)
  }
  finally {
    if (node)
      node.loading = false
  }
}

function resetTreeState() {
  treeFlat.value = []
  treeLeafNodes.value = []
  flatSearchCacheKeyword = ''
  flatSearchCacheResult = []
}

function appendLoadedChildren(parent: TreeNodeModel, rawChildren: TreeNodeModel[]) {
  const children = cloneTreeNodes(rawChildren, props.childrenKey)
  parent[props.childrenKey] = children
  parent.loaded = true

  if (!children.length)
    parent[props.isLeafKey] = true

  flattenTree(children, (parent.level ?? 1) + 1, parent)

  const value = normalizeValue(props.modelValue)
  applyCheckStatusFromValue(children, value, props.multiple, props.valueKey)

  if (!props.checkStrictly && props.multiple) {
    children
      .filter(item => isTreeNodeLeaf(item, props.childrenKey, props.isLeafKey, props.lazy))
      .forEach(item => setParentCheckStatus(item, props.childrenKey))
  }
}

function markLoadedNodes(list: TreeNodeModel[]) {
  list.forEach((item) => {
    const children = item[props.childrenKey] as TreeNodeModel[] | undefined
    if (children?.length) {
      item.loaded = true
      markLoadedNodes(children)
    }
  })
}

async function rebuildTreeFromOptions() {
  if (isRemoteBuiltIn.value)
    return

  if (optionsRef === props.options && treeList.value.length)
    return

  if (props.lazy && !props.options.length && resolvedLoad.value) {
    await loadNode(null)
    return
  }

  if (props.lazy && !props.options.length && props.remote) {
    optionsRef = props.options
    resetTreeState()
    treeList.value = []
    filterList.value = []
    return
  }

  optionsRef = props.options
  resetTreeState()
  treeList.value = cloneTreeNodes(props.options, props.childrenKey)
  markLoadedNodes(treeList.value)
  flattenTree(treeList.value)
}

function flattenTree(list: TreeNodeModel[], level = 1, parent: TreeNodeModel | null = null) {
  list.forEach((item) => {
    item.level = level
    item.parent = parent
    item.isShowChild = false
    treeFlat.value.push(item)

    const children = item[props.childrenKey] as TreeNodeModel[] | undefined
    if (children?.length) {
      flattenTree(children, level + 1, item)
    }
    else if (isTreeNodeLeaf(item, props.childrenKey, props.isLeafKey, props.lazy)) {
      treeLeafNodes.value.push(item)
    }
  })
}

function syncCustomNodesFromValue(value: TreeValue) {
  customNodes.value = []
  if (!value)
    return

  const flatKeySet = new Set(treeFlat.value.map(item => String(item[props.valueKey])))

  if (props.multiple && Array.isArray(value)) {
    customNodes.value = value
      .filter(id => !flatKeySet.has(String(id)))
      .map(id => ({
        [props.labelKey]: id,
        [props.valueKey]: id,
        checkStatus: TreeCheckStatus.Checked,
      })) as TreeNodeModel[]
  }
  else if (!props.multiple && !flatKeySet.has(String(value))) {
    customNodes.value.push({
      [props.labelKey]: value,
      [props.valueKey]: value,
      checkStatus: TreeCheckStatus.Checked,
    } as TreeNodeModel)
  }
}

function syncSelectionFromModel() {
  const value = normalizeValue(props.modelValue)
  applyCheckStatusFromValue(treeFlat.value, value, props.multiple, props.valueKey)
  syncCustomNodesFromValue(value)

  if (!props.checkStrictly && props.multiple) {
    treeFlat.value
      .filter(item => isTreeNodeLeaf(item, props.childrenKey, props.isLeafKey, props.lazy))
      .forEach(item => setParentCheckStatus(item, props.childrenKey))
  }

  formatText.value = getFormatText()
}

const nodeMap = computed(() => buildTreeNodeMap(treeFlat.value, props.valueKey))

const nodeList = computed(() => {
  const selected: TreeNodeModel[] = []
  const map = nodeMap.value

  if (Array.isArray(props.modelValue)) {
    props.modelValue.forEach((id) => {
      const node = map.get(String(id))
      if (node)
        selected.push(node)
    })
  }
  else if (props.modelValue != null && props.modelValue !== '') {
    const node = map.get(String(props.modelValue))
    if (node)
      selected.push(node)
  }

  const mergedKeys = new Set(selected.map(item => String(item[props.valueKey])))
  customNodes.value.forEach((node) => {
    const key = String(node[props.valueKey])
    if (!mergedKeys.has(key)) {
      mergedKeys.add(key)
      selected.push(node)
    }
  })
  return selected
})

function closeTag(item: TreeNodeModel) {
  item.checkStatus = TreeCheckStatus.Unchecked
  customNodes.value = customNodes.value.filter(node => node[props.valueKey] !== item[props.valueKey])
  submit()
}

function initData() {
  void prepareTreeData()
}

watch(
  () => props.options,
  () => {
    if (isRemoteBuiltIn.value)
      return
    if (props.popup && show.value) {
      void refreshTreeFromOptions()
      return
    }
    initData()
  },
  { deep: true },
)

watch(
  () => props.modelValue,
  () => {
    if (props.popup && show.value) {
      formatText.value = getFormatText()
      return
    }
    if (treeList.value.length)
      syncSelectionFromModel()
    else
      initData()
  },
)

watch(
  () => props.remote && !isRemoteBuiltIn.value ? props.loading : false,
  (val, oldVal) => {
    if (props.remote && !isRemoteBuiltIn.value && oldVal && !val)
      void refreshTreeFromOptions()
  },
)

watch(
  () => props.params,
  (newVal, oldVal) => {
    if (isRemoteBuiltIn.value && !shallowEqualObjects(newVal, oldVal))
      handleRemoteRefresh()
  },
  { deep: true },
)

onMounted(() => {
  if (props.popup) {
    if (isRemoteBuiltIn.value)
      void getRemoteData().then(() => syncSelectionFromModel())
    else
      void rebuildTreeFromOptions().then(() => syncSelectionFromModel())
  }
  else {
    initData()
  }
})

watch(show, (val, oldVal) => {
  if (!val && oldVal && !confirmedClose)
    emit('cancel')
  confirmedClose = false
})

defineExpose({ open })
</script>

<template>
  <view class="com-tree" :class="{ 'h-full flex flex-col': !popup }">
    <view v-if="popup" class="com-tree__trigger" @click.stop="open">
      <view v-if="showField" class="com-tree__field relative min-w-0">
        <wd-input
          v-model="formatText"
          readonly
          no-border
          :disabled="disabled"
          :placeholder="resolvedPlaceholder"
          :custom-class="`w-full ${showTags && formatText ? 'opacity-0' : ''} ${embedded ? '!bg-transparent' : ''}`"
        />
        <view
          v-if="multiple && showTags && formatText"
          class="flex items-center gap-1 overflow-x-scroll absolute right-0 w-full"
        >
          <wd-tag
            v-for="item in formatList"
            :key="item[valueKey]"
            round
            closable
            custom-class="com-tree__tag"
            @close.stop="closeTag(item)"
          >
            {{ item[labelKey] }}
          </wd-tag>
        </view>
      </view>
      <slot v-if="showArrow">
        <wd-icon
          :name="embedded ? 'caret-down-small' : 'arrow-right'"
          color="#999"
          :size="embedded ? '20' : '14'"
        />
      </slot>
    </view>

    <wd-popup
      v-if="popup"
      v-model="show"
      root-portal
      position="bottom"
      custom-class="rounded-t-lg overflow-hidden h-100 flex flex-col"
      @close="close"
    >
      <view class="h-10 relative">
        <view class="flex items-center justify-center h-full text-base">{{ resolvedTitle }}</view>
        <wd-icon name="close" size="16" color="#666" custom-class="absolute top-3 right-5" @click="cancelPopup" />
      </view>
      <ComTreePanel
        v-model:keyword="keyword"
        :nodes="filterList"
        :show-search="showSearch"
        :search-placeholder="resolvedSearchPlaceholder"
        :multiple="multiple"
        :allow-create="allowCreate"
        :leaf-only="leafOnly"
        :check-strictly="checkStrictly"
        :loading="remote && remoteLoading"
        :empty-text="resolvedEmptyText"
        :value-key="valueKey"
        :label-key="labelKey"
        :children-key="childrenKey"
        :flat="!!keyword && searchMode === 'flat'"
        @search="handleSearch"
        @clear="onSearch"
        @add-custom="addCustomNode"
      />
      <view class="p-2">
        <wd-button type="primary" block @click="submit">
          {{ t('common.confirm') }}
        </wd-button>
      </view>
    </wd-popup>

    <ComTreePanel
      v-else
      v-model:keyword="keyword"
      class="flex-1"
      :nodes="filterList"
      :show-search="showSearch"
      :search-placeholder="resolvedSearchPlaceholder"
      :multiple="multiple"
      :allow-create="allowCreate"
      :leaf-only="leafOnly"
      :check-strictly="checkStrictly"
      :loading="remote && remoteLoading"
      :empty-text="resolvedEmptyText"
      :value-key="valueKey"
      :label-key="labelKey"
      :children-key="childrenKey"
      :flat="!!keyword && searchMode === 'flat'"
      panel-class="com-tree__inline-panel"
      @search="handleSearch"
      @clear="onSearch"
      @add-custom="addCustomNode"
    />
  </view>
</template>

<style lang="scss" scoped>
.com-tree {
  width: 100%;

  &__trigger {
    width: 100%;
    display: flex;
    align-items: center;
  }

  &__field {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: 28rpx;
  }

  &__inline-panel {
    :deep(.com-tree-panel__body) {
      height: 400rpx;
      padding: 20rpx 0;
    }
  }

  :deep(.wd-tag) {
    white-space: nowrap;
    display: flex;
    align-items: center;
    font-size: 24rpx;
    padding: 0 12rpx;
  }

  :deep(.com-tree__tag) {
    margin-right: 4rpx;
  }

  :deep(.wd-tag__close) {
    margin-left: 0;
  }
}
</style>
