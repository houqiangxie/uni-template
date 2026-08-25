
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

/** 滚动位置比较容差，避免浮点/亚像素导致误判 */
const SCROLL_EPS = 1

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
- elementOffsetTop: element 距离滚动内容顶部距离

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

    const elementToViewportTopOffset =
        elementOffsetTop - viewportScrollTop - startOffset
    const elementToViewportBottomOffset =
        elementOffsetTop +
        elementHeight -
        viewportScrollTop -
        viewportHeight +
        endOffset

    if (position === 'nearest') {
        // 已完全在可视区内（含偏移），保持当前滚动
        if (elementToViewportTopOffset >= -SCROLL_EPS && elementToViewportBottomOffset <= SCROLL_EPS) {
            return viewportScrollTop
        }
        position =
            Math.abs(elementToViewportTopOffset) >
                Math.abs(elementToViewportBottomOffset)
                ? 'end'
                : 'start'
    }

    let nextScrollTop = 0

    switch (position) {
        case 'start':
            nextScrollTop = elementOffsetTop - startOffset
            break
        case 'center':
            nextScrollTop =
                elementOffsetTop -
                (viewportHeight - elementHeight - endOffset - startOffset) / 2 +
                startOffset
            break
        case 'end':
            nextScrollTop =
                elementOffsetTop + elementHeight - viewportHeight + endOffset
            break
    }

    return Math.max(0, nextScrollTop)
}


// 使用示例
// <scroll-view class="container flex-1 overflow-auto" scroll-y :scroll-top="scrollTop" scroll-with-animation />
// <wd-form ref="formRef" :model="formModel" :schema="schema">...</wd-form>
// const { scrollTop, formRef, validate, validateField } = useForm()
// // 自定义滚动容器：useForm(true, 0, null, 0, '.my-scroll')

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
const executeQuery = (scrollContainer: string): Promise<any[]> => {
    return new Promise((resolve) => {
        const query = uni.createSelectorQuery()
        query.select(scrollContainer).boundingClientRect()
        query.select(scrollContainer).scrollOffset()

        // #ifdef MP
        const containerPrefix = `${scrollContainer} >>> `
        ERROR_MESSAGE_SELECTORS.forEach(selector => {
            query.selectAll(containerPrefix + selector).boundingClientRect()
        })
        FORM_ITEM_SELECTORS.forEach(selector => {
            query.selectAll(containerPrefix + selector).boundingClientRect()
        })
        // #endif

        // #ifndef MP
        ERROR_MESSAGE_SELECTORS.forEach(selector => {
            query.selectAll(selector).boundingClientRect()
        })
        FORM_ITEM_SELECTORS.forEach(selector => {
            query.selectAll(selector).boundingClientRect()
        })
        // #endif

        query.exec(resolve)
    })
}

/**
 * 解析查询结果
 */
const parseQueryResults = (res: any[]) => {
    const container = res[0]
    const scrollInfo = res[1]
    const errorItems = res.slice(2, 2 + ERROR_SELECTOR_COUNT).flatMap(item => item || [])
    const formItems = res.slice(2 + ERROR_SELECTOR_COUNT, 2 + ERROR_SELECTOR_COUNT + FORM_SELECTOR_COUNT).flatMap(item => item || [])
    return { container, scrollInfo, errorItems, formItems }
}

/**
 * 元素相对 scroll-view 内容顶部的偏移
 */
const getContentOffsetTop = (elementTop: number, containerTop: number, scrollTop: number) => {
    return elementTop - containerTop + scrollTop
}

/**
 * 计算滚动目标：
 * - 用错误文案判断是否已在可视区（避免超高表单项永远判为不可见）
 * - 需要滚动时：表单项能放下则滚到项顶部；否则滚到错误文案
 */
const calculateScrollTarget = (
    container: any,
    scrollInfo: any,
    firstErrorItem: any,
    formItems: any[],
    windowHeight: number,
    extraOffset: number,
) => {
    const parentCell = formItems.find(cell => {
        return firstErrorItem.top >= cell.top && firstErrorItem.top <= (cell.top + cell.height)
    })
    const cell = parentCell || firstErrorItem
    const currentScrollTop = scrollInfo.scrollTop || 0
    const endOffset = Math.max(0, windowHeight - container.height - container.top)
    const options = { startOffset: extraOffset, endOffset, position: 'nearest' as const }

    const errorOffsetTop = getContentOffsetTop(firstErrorItem.top, container.top, currentScrollTop)
    const errorScrollTop = getScrollIntoViewValue(
        container.height,
        currentScrollTop,
        firstErrorItem.height,
        errorOffsetTop,
        options,
    )
    // 错误已在可视区
    if (Math.abs(errorScrollTop - currentScrollTop) <= SCROLL_EPS) {
        return currentScrollTop
    }

    const usableHeight = container.height - extraOffset - endOffset
    // 表单项过高时滚到错误处，否则滚到表单项顶部露出标题
    if (cell.height > usableHeight) {
        return getScrollIntoViewValue(
            container.height,
            currentScrollTop,
            firstErrorItem.height,
            errorOffsetTop,
            { ...options, position: 'start' },
        )
    }

    const cellOffsetTop = getContentOffsetTop(cell.top, container.top, currentScrollTop)
    return getScrollIntoViewValue(
        container.height,
        currentScrollTop,
        cell.height,
        cellOffsetTop,
        { ...options, position: 'start' },
    )
}

/**
 * 驱动 scroll-view：先对齐实际滚动再设目标，兼容绑定值未变不触发滚动的问题，且无 +1 闪烁
 */
const applyScrollViewTop = async (scrollTopRef: { value: number }, current: number, target: number) => {
    if (Math.abs(target - current) <= SCROLL_EPS) {
        return false
    }
    // 绑定值已等于目标时直接赋值不会触发滚动，先同步到真实位置
    if (Math.abs(scrollTopRef.value - target) <= SCROLL_EPS) {
        scrollTopRef.value = current
        await nextTick()
    }
    scrollTopRef.value = target
    return true
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
    let isScrolling = false

    const getFormInstance = () => {
        const fr = formRefs || formRef
        // 兼容传入 ref / computed / 实例本身
        const inst = fr?.value !== undefined ? fr.value : fr
        return inst?.value !== undefined && typeof inst.value?.validate === 'function'
            ? inst.value
            : inst
    }

    // 滚动到错误字段
    const scrollToErrorField = (offset: number = extraOffset) => {
        return new Promise<number>(async (resolve, reject) => {
            if (isScrolling) {
                resolve(scrollTop.value)
                return
            }

            isScrolling = true
            try {
                // 等校验错误文案渲染完成
                await nextTick()
                const res = await executeQuery(scrollContainer)
                const { container, scrollInfo, errorItems, formItems } = parseQueryResults(res)

                if (!errorItems?.length || !container || !scrollInfo) {
                    resolve(scrollTop.value)
                    return
                }

                const windowHeight = popHeight || uni.getSystemInfoSync().windowHeight
                const firstErrorItem = errorItems.reduce((prev, curr) => (prev.top < curr.top ? prev : curr))

                const nextScrollTop = calculateScrollTarget(
                    container,
                    scrollInfo,
                    firstErrorItem,
                    formItems,
                    windowHeight,
                    offset,
                )

                await applyScrollViewTop(scrollTop, scrollInfo.scrollTop || 0, nextScrollTop)
                resolve(scrollTop.value)
            } catch (error) {
                console.error('[scrollToErrorField] Error:', error)
                reject(error)
            } finally {
                isScrolling = false
            }
        })
    }

    const validate = async () => {
        try {
            const form = getFormInstance()
            const { valid } = await form.validate()
            if (valid) {
                return true
            }
            if (scroll) {
                await scrollToErrorField(extraOffset)
            }
            return false
        } catch (error) {
            console.error('[validate] Error:', error)
            return false
        }
    }

    const validateField = (prop?: string | string[]) => {
        try {
            const form = getFormInstance()
            return form?.validate(prop)
        } catch (error) {
            console.error('[validateField] Error:', error)
        }
    }

    return {
        validate,
        validateField,
        scrollTop,
        formRef: formRefs || formRef,
        scrollToErrorField
    }
}
