import type { InjectionKey, Ref } from 'vue'
import { inject, provide } from 'vue'
import { deepClone } from '@/utils/common'

export interface TreeNodeModel extends Record<string, any> {
  level?: number
  /** 父节点 id（可序列化；勿挂 parent 对象，小程序 props 遇环会丢数据） */
  parentId?: string | number | null
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
  valueKey: Ref<string>
  loadNode: (node: TreeNodeModel | null) => Promise<void>
  getParentNode: (node: TreeNodeModel) => TreeNodeModel | null
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
  getParent: (node: TreeNodeModel) => TreeNodeModel | null,
) {
  const parent = getParent(child)
  if (!parent)
    return

  const children = parent[childrenKey] as TreeNodeModel[]
  const statuses = new Set(children.map(item => item.checkStatus))
  parent.checkStatus = statuses.size === 1
    ? [...statuses][0]
    : TreeCheckStatus.Indeterminate

  if (getParent(parent))
    setParentCheckStatus(parent, childrenKey, getParent)
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
