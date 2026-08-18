export type ScrollIntoViewPosition = 'start' | 'center' | 'end' | 'nearest'

export interface ScrollIntoViewValueOptions {
  position?: ScrollIntoViewPosition
  startOffset?: number
  endOffset?: number
}

export interface ScrollIntoViewOptions {
  position?: ScrollIntoViewPosition
  startOffset?: number
  endOffset?: number
  duration?: number
}

/**
```
                      page
                     ╱
    ╭───────────────╮    viewport
  ╭─│─ ─ ─ ─ ─ ─ ─ ─│─╮ ╱
  │ │ ╭───────────╮ │ │
  │ │ │  element  │ │ │
  │ │ ╰───────────╯ │ │
  ╰─│─ ─ ─ ─ ─ ─ ─ ─│─╯
    │               │
    │               │
    ╰───────────────╯
```

# 参数
- viewportHeight: viewport 高度
- viewportScrollTop: viewport 垂直滚动值
- elementHeight: element 高度
- elementOffsetTop: element 距离页面顶部距离

# 选项
- position: element 在视窗中的位置(start, center, end, nearest)
- startOffset: element 距离视窗顶部的偏移量
- endOffset: element 距离视窗底部的偏移量

# 结果值
- viewportScrollTop: viewport 新的垂直滚动值

*/
export function getScrollIntoViewValue(
  viewportHeight: number,
  viewportScrollTop: number,
  elementHeight: number,
  elementOffsetTop: number,
  options: ScrollIntoViewValueOptions = {},
) {
  const { startOffset = 0, endOffset = 0 } = options

  let position = options.position || 'nearest'

  const elementToViewportTopOffset
        = elementOffsetTop - viewportScrollTop - startOffset
  const elementToViewportBottomOffset
        = elementOffsetTop
        + elementHeight
        - viewportScrollTop
        - viewportHeight
        + endOffset

  if (position === 'nearest') {
    if (elementToViewportTopOffset >= 0 && elementToViewportBottomOffset <= 0) {
      return viewportScrollTop
    }
    else {
      position
                = Math.abs(elementToViewportTopOffset)
                    > Math.abs(elementToViewportBottomOffset)
          ? 'end'
          : 'start'
    }
  }

  let nextScrollTop = 0

  switch (position) {
    case 'start':
      nextScrollTop = elementOffsetTop - startOffset
      break
    case 'center':
      nextScrollTop
                = elementOffsetTop
                - (viewportHeight - elementHeight - endOffset - startOffset) / 2
                + startOffset
      break
    case 'end':
      nextScrollTop
                = elementOffsetTop + elementHeight - viewportHeight + endOffset
      break
  }

  return nextScrollTop
}

// 使用示例
// <scroll-view class="container flex-1 overflow-auto" scroll-y :scroll-top="scrollTop" scroll-with-animation />
// <wd-form ref="formRef" :model="formModel" :schema="schema">...</wd-form>
// const { scrollTop, formRef, validate, validateField } = useForm()

// wd-form-item 校验错误优先；其余为子组件内置错误提示
const ERROR_MESSAGE_SELECTORS = [
  '.wd-form-item__error-message',
  '.wd-cell__error-message',
  '.wd-calendar__error-message',
  '.wd-input__error-message',
  '.wd-textarea__error-message',
  '.wd-picker__error-message',
]
const FORM_ITEM_SELECTORS = [
  '.wd-form-item',
  '.wd-cell',
  '.wd-calendar__cell',
  '.wd-input',
  '.wd-textarea',
]
const ERROR_SELECTOR_COUNT = ERROR_MESSAGE_SELECTORS.length
const FORM_SELECTOR_COUNT = FORM_ITEM_SELECTORS.length

/**
 * 执行 DOM 查询并获取结果
 */
function executeQuery(scrollContainer: string): Promise<any[]> {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery()
    query.select(scrollContainer).boundingClientRect()
    query.select(scrollContainer).scrollOffset()

    // #ifdef MP
    const containerPrefix = `${scrollContainer} >>> `
    ERROR_MESSAGE_SELECTORS.forEach((selector) => {
      query.selectAll(containerPrefix + selector).boundingClientRect()
    })
    FORM_ITEM_SELECTORS.forEach((selector) => {
      query.selectAll(containerPrefix + selector).boundingClientRect()
    })
    // #endif

    // #ifndef MP
    ERROR_MESSAGE_SELECTORS.forEach((selector) => {
      query.selectAll(selector).boundingClientRect()
    })
    FORM_ITEM_SELECTORS.forEach((selector) => {
      query.selectAll(selector).boundingClientRect()
    })
    // #endif

    query.exec(resolve)
  })
}

/**
 * 解析查询结果
 */
function parseQueryResults(res: any[]) {
  const container = res[0]
  const scrollInfo = res[1]
  // 使用 flatMap 高效合并多个数组
  const errorItems = res.slice(2, 2 + ERROR_SELECTOR_COUNT).flatMap(item => item || [])
  const formItems = res.slice(2 + ERROR_SELECTOR_COUNT, 2 + ERROR_SELECTOR_COUNT + FORM_SELECTOR_COUNT).flatMap(item => item || [])
  return { container, scrollInfo, errorItems, formItems }
}

/**
 * 计算滚动目标
 */
function calculateScrollTarget(container: any,
  scrollInfo: any,
  firstErrorItem: any,
  formItems: any[],
  windowHeight: number,
  extraOffset: number) {
  // 找出包含错误项的最小父节点（优先 wd-form-item）
  const parentCell = formItems
    .filter(cell => firstErrorItem.top >= cell.top && firstErrorItem.top <= (cell.top + cell.height))
    .sort((a, b) => a.height - b.height)[0]
  const cell = parentCell || firstErrorItem

  return getScrollIntoViewValue(
    container.height,
    scrollInfo.scrollTop,
    cell.height,
    firstErrorItem.top + scrollInfo.scrollTop,
    {
      startOffset: container.top + (cell.height - firstErrorItem.height - 10) + extraOffset,
      endOffset: windowHeight - container.height - container.top,
    },
  )
}

export function useForm(
  scroll: boolean = true,
  popHeight: number = 0,
  formRefs: any = null,
  extraOffset: number = 0,
  scrollContainer: string = '.container',
) {
  const scrollTop = ref(0)
  const formRef = ref<any>(null)
  let isScrolling = false // 防止重复滚动

  const getFormRef = () => formRefs || formRef

  // 滚动到错误字段
  const scrollToErrorField = async (offset?: number): Promise<number> => {
    const scrollOffset = offset ?? extraOffset
    try {
      if (isScrolling)
        return scrollTop.value

      isScrolling = true

      // 等待 wd-form-item 错误信息渲染到 DOM
      await nextTick()
      await nextTick()

      const res = await executeQuery(scrollContainer)
      const { container, scrollInfo, errorItems, formItems } = parseQueryResults(res)

      // 过滤不可见错误节点
      const visibleErrors = (errorItems || []).filter(
        (item: any) => item && item.height > 0 && item.width > 0,
      )

      if (!visibleErrors.length || !container || !scrollInfo) {
        isScrolling = false
        return scrollTop.value
      }

      const windowHeight = popHeight || uni.getSystemInfoSync().windowHeight
      // 选择最靠上的错误项
      const firstErrorItem = visibleErrors.reduce((prev, curr) => (prev.top < curr.top ? prev : curr))

      let nextScrollTop = calculateScrollTarget(
        container,
        scrollInfo,
        firstErrorItem,
        formItems,
        windowHeight,
        scrollOffset,
      )

      // 如果和上次一样，+1，确保 scroll-view 能触发滚动
      if (scrollTop.value === nextScrollTop)
        nextScrollTop = nextScrollTop + 1

      scrollTop.value = nextScrollTop
      isScrolling = false
      return nextScrollTop
    }
    catch (error) {
      console.error('[scrollToErrorField] Error:', error)
      isScrolling = false
      throw error
    }
  }

  const scrollAfterValidate = async (valid: boolean) => {
    if (!valid && scroll)
      await scrollToErrorField()
  }

  const validate = async () => {
    try {
      const fr = getFormRef()
      if (!fr.value?.validate) {
        console.error('[validate] formRef 未绑定 wd-form')
        return false
      }
      const { valid } = await fr.value.validate()
      await scrollAfterValidate(valid)
      return valid
    }
    catch (error) {
      console.error('[validate] Error:', error)
      return false
    }
  }

  const validateField = async (prop?: string | string[]) => {
    try {
      const fr = getFormRef()
      if (!fr.value?.validate) {
        console.error('[validateField] formRef 未绑定 wd-form')
        return { valid: false, errors: [] }
      }
      const result = await fr.value.validate(prop)
      await scrollAfterValidate(result.valid)
      return result
    }
    catch (error) {
      console.error('[validateField] Error:', error)
      return { valid: false, errors: [] }
    }
  }

  return {
    validate,
    validateField,
    scrollTop,
    formRef: getFormRef(),
    scrollToErrorField,
  }
}
