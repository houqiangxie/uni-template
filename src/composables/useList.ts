const CANCEL_KEY = '__cancelKey'

let cancelKeySeq = 0

/**
 * 每个 useList() 调用生成唯一 key（只生成一次，生命周期内不变）。
 * 不用 method+url：同页多个列表调同一接口会互相 cancel；url 级 cancel 已由 useRequest 的 lastKey + pageNum 处理。
 */
function createListCancelKey() {
  const uid = getCurrentInstance()?.uid
  const seq = ++cancelKeySeq
  return uid != null ? `useList_${uid}_${seq}` : `useList_${seq}`
}

export function useList({
  initParams = {},
  apiFunc,
  preFunc,
  sufFunc,
  autoLoad = true,
  disabled,
}: {
  initParams: any
  apiFunc: Function
  preFunc?: Function
  sufFunc?: Function
  autoLoad?: boolean
  /** 为 true / 返回 true 时，跳过接口调用（支持 Ref<boolean> 或 () => boolean） */
  disabled?: Ref<boolean> | (() => boolean)
}) {
  const listObj = reactive({ data: [] as any, total: 0, finish: false })
  const searchModel = reactive({ ...initParams })
  const page = { pageNum: 1, pageSize: 10 }
  let allowWatch = false
  const cancelKey = createListCancelKey()
  let fetchGeneration = 0

  function isDisabled(): boolean {
    if (disabled == null)
      return false
    return typeof disabled === 'function' ? disabled() : unref(disabled)
  }

  function attachCancelKey(params: Record<string, unknown>) {
    Object.defineProperty(params, CANCEL_KEY, {
      value: cancelKey,
      enumerable: false,
      configurable: true,
    })
  }

  function resetList() {
    page.pageNum = 1
    listObj.data = []
    listObj.finish = false
    listObj.total = 0
    getList()
  }

  async function getList() {
    if (isDisabled())
      return

    const generation = ++fetchGeneration
    const params = { ...searchModel, ...page } as Record<string, unknown>

    if (preFunc) {
      try {
        Object.assign(params, preFunc(JSON.parse(JSON.stringify(params))))
      }
      catch {
        return
      }
    }

    attachCancelKey(params)

    try {
      const { data } = await apiFunc(params)
      if (generation !== fetchGeneration)
        return

      sufFunc && (data.records = sufFunc(data.records, data))
      if (data.records?.length < page.pageSize)
        listObj.finish = true
      if (data.records?.length) {
        page.pageNum === 1
          ? (listObj.data = [...data.records])
          : listObj.data.push(...data.records)
      }
      if (data.total != null)
        listObj.total = data.total
      allowWatch = true
    }
    catch (err: any) {
      if (generation !== fetchGeneration || err?.aborted)
        return
      throw err
    }
  }

  function loadMore() {
    if (listObj.finish)
      return
    page.pageNum++
    getList()
  }

  const debouncedResetList = debounce(() => {
    if (!allowWatch)
      return
    resetList()
  }, 300, false)

  watch(() => searchModel, () => {
    debouncedResetList()
  }, { deep: true })

  onMounted(() => {
    if (autoLoad)
      resetList()
    else allowWatch = true
  })

  onBeforeUnmount(() => {
    fetchGeneration++
    abortRequestByKey(cancelKey)
  })

  return { listObj, searchModel, resetList, loadMore, getList, cancelKey }
}
