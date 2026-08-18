/** 「不限」选项的值 */
export const ALL_ITEM_VALUE = '-9999'

/** 运行时状态字段，不参与配置快照比较 */
const RUNTIME_MENU_KEYS = ['value', 'isActived', 'isClick', 'isLoading', 'displayLabel', 'isHidden']

/** 提取菜单结构快照（prop / type） */
export function getMenuStructureSnapshot(menu) {
  if (!menu?.length)
    return '[]'
  return JSON.stringify(menu.map(item => ({ prop: item.prop, type: item.type })))
}

/** 提取 options 配置快照（不含 checked / isActived 等运行时字段） */
export function getOptionsConfigSnapshot(options) {
  if (!options?.length)
    return '[]'
  return JSON.stringify(options.map((item) => {
    const snapshot = { ...item }
    delete snapshot.checked
    delete snapshot.isActived
    if (snapshot.children?.length)
      snapshot.children = JSON.parse(getOptionsConfigSnapshot(snapshot.children))

    return snapshot
  }))
}

/** 提取菜单配置快照（不含 value 等运行时状态） */
export function getMenuConfigSnapshot(menu) {
  if (!menu?.length)
    return '[]'
  return JSON.stringify(menu.map((item) => {
    const snapshot = { ...item }
    RUNTIME_MENU_KEYS.forEach(key => delete snapshot[key])
    delete snapshot.syncDataFn
    if (snapshot.options?.length)
      snapshot.options = JSON.parse(getOptionsConfigSnapshot(snapshot.options))

    return snapshot
  }))
}

/** 提取 v-model 值快照，用于外部受控同步 */
export function getModelValuesSnapshot(modelValue) {
  if (!modelValue || typeof modelValue !== 'object')
    return '{}'

  return JSON.stringify(modelValue)
}

/** 比较两个值是否相同 */
export function isSameValue(a, b) {
  if (Object.is(a, b))
    return true

  if (a == null || b == null)
    return a === b

  if (typeof a === 'object' && typeof b === 'object')
    return JSON.stringify(a) === JSON.stringify(b)

  return false
}

export const ALL_ITEM = { label: '不限', value: ALL_ITEM_VALUE }

/**
 * 深拷贝内容
 * @param originData 拷贝对象
 */
export function deepClone(originData) {
  const type = Object.prototype.toString.call(originData)
  let data
  if (type === '[object Array]') {
    data = []
    for (let i = 0; i < originData.length; i++)
      data.push(deepClone(originData[i]))
  }
  else if (type === '[object Map]') {
    data = new Map()
    originData.forEach((value, key) => {
      data.set(deepClone(key), deepClone(value))
    })
  }
  else if (type === '[object Set]') {
    data = new Set()
    originData.forEach((value) => {
      data.add(deepClone(value))
    })
  }
  else if (type === '[object Object]') {
    data = {}
    for (const prop in originData) {
      // eslint-disable-next-line no-prototype-builtins
      if (originData.hasOwnProperty(prop))
        data[prop] = deepClone(originData[prop])
    }
  }
  else {
    data = originData
  }
  return data
}

export function getValueByKey(object, path, defaultVal = undefined) {
  let newPath = []
  if (Array.isArray(path))
    newPath = path
  else
    newPath = path.replace(/\[/g, '.').replace(/\]/g, '').split('.')

  return newPath.reduce((o, k) => {
    return (o || {})[k]
  }, object) || defaultVal
}

/**
 * 处理部分初始数据，统一 label / value / suffix / children 字段
 */
export function checkDataField(options, fields) {
  if (!fields || !options || options.length === 0)
    return options

  for (let i = 0; i < options.length; i++) {
    const k = options[i]
    k.label = k[fields.label || 'label'] || null
    k.value = k[fields.value || 'value'] || null
    k.suffix = k[fields.suffix || 'suffix'] || null
    k.children = k[fields.children || 'children'] || null
    if (k.children?.length)
      checkDataField(k.children, fields)
  }
  return options
}

/** 判断对象是否为空 */
export function isEmptyObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj))
    return !obj

  return Object.keys(obj).length === 0
}

/** filter / 独立字段子项类型的空值 */
export function getFilterEmptyValue(type) {
  switch (type) {
    case 'checkbox':
      return []
    case 'input-range':
      return ['', '']
    case 'date-picker':
      return []
    case 'search':
      return ''
    default:
      return null
  }
}

/** 顶层可单独使用的字段菜单类型 */
export const FIELD_MENU_TYPES = [
  'com-select',
  'com-tree',
  'date-picker',
  'slider',
  'input-range',
  'radio',
  'checkbox',
]

/** 顶层字段：选完即确认，不需要外层重置/确定（组件自带确认或等同 cell） */
export const FIELD_INSTANT_CONFIRM_TYPES = [
  'com-select',
  'com-tree',
  'date-picker',
  'radio',
]

/** 顶层字段：自带弹层，点击菜单项后应直接打开组件弹窗 */
export const FIELD_POPUP_TYPES = [
  'com-select',
  'com-tree',
  'date-picker',
]

export function isFieldMenuType(type) {
  return FIELD_MENU_TYPES.includes(type)
}

export function isFieldInstantConfirmType(type) {
  return FIELD_INSTANT_CONFIRM_TYPES.includes(type)
}

export function isFieldPopupType(type) {
  return FIELD_POPUP_TYPES.includes(type)
}

export function needsFieldFooter(type) {
  return isFieldMenuType(type) && !isFieldInstantConfirmType(type)
}

/** 同步 filter 子项 value 及 checkbox 选中态 */
export function applyFilterItemValue(item, value) {
  if (item.type === 'input-range') {
    item.value = Array.isArray(value) ? [...value] : getFilterEmptyValue('input-range')
    if (item.value.length < 2)
      item.value = [...item.value, '', ''].slice(0, 2)
  }
  else {
    item.value = value === undefined ? getFilterEmptyValue(item.type) : deepClone(value)
  }

  if (item.type === 'checkbox' && item.options?.length) {
    const selected = Array.isArray(item.value) ? item.value : []
    item.options.forEach((opt) => {
      opt.isActived = selected.includes(opt.value)
    })
  }
}

/** 解析 filter 初始化/重置用的 valueMap */
export function resolveFilterValueMap(dropdownItem, mode = 'current') {
  const { options = [], value = {}, defaultValue = {} } = dropdownItem || {}
  const map = {}

  for (let i = 0; i < options.length; i++) {
    const item = options[i]
    if (!item?.prop)
      continue

    if (mode === 'reset') {
      if (item.defaultValue !== undefined)
        map[item.prop] = deepClone(item.defaultValue)
      else if (Object.prototype.hasOwnProperty.call(defaultValue, item.prop))
        map[item.prop] = deepClone(defaultValue[item.prop])
      else
        map[item.prop] = getFilterEmptyValue(item.type)

      continue
    }

    if (Object.prototype.hasOwnProperty.call(value, item.prop))
      map[item.prop] = deepClone(value[item.prop])
    else
      map[item.prop] = getFilterEmptyValue(item.type)
  }

  return map
}

/** 由配置与 valueMap 生成 filter 编辑态列表 */
export function createFilterList(dropdownItem, mode = 'current') {
  const { options = [] } = dropdownItem || {}
  if (!options.length)
    return []

  const valueMap = resolveFilterValueMap(dropdownItem, mode)
  const list = deepClone(options)
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    const val = Object.prototype.hasOwnProperty.call(valueMap, item.prop)
      ? valueMap[item.prop]
      : getFilterEmptyValue(item.type)
    applyFilterItemValue(item, val)
  }
  return list
}

/** 判断 filter 子项是否有有效提交值 */
export function hasFilterValue(type, value) {
  if (value === null || value === undefined)
    return false

  if (type === 'search')
    return true

  if (type === 'date-picker')
    return Array.isArray(value) ? value.length > 0 : !!value

  if (type === 'checkbox')
    return Array.isArray(value) && value.length > 0

  if (type === 'input-range') {
    if (!Array.isArray(value))
      return false

    return value.some(v => v !== null && v !== undefined && v !== '')
  }
  if (value === '')
    return false

  if (typeof value === 'number' || typeof value === 'boolean')
    return true

  return !!value
}

/** 顶层字段菜单：由 dropdownItem 生成编辑态 field */
export function createStandaloneFieldItem(dropdownItem, mode = 'current') {
  const item = {
    title: dropdownItem?.title,
    type: dropdownItem?.type,
    prop: dropdownItem?.prop,
    options: deepClone(dropdownItem?.options || []),
    componentProps: dropdownItem?.componentProps || dropdownItem?.componentProp,
    hidden: false,
    value: undefined,
  }

  let fieldValue
  if (mode === 'reset') {
    fieldValue = dropdownItem?.defaultValue !== undefined
      ? deepClone(dropdownItem.defaultValue)
      : getFilterEmptyValue(item.type)
  }
  else if (dropdownItem?.value !== undefined) {
    fieldValue = deepClone(dropdownItem.value)
  }
  else {
    fieldValue = getFilterEmptyValue(item.type)
  }

  applyFilterItemValue(item, fieldValue)
  return item
}

/** 顶层字段菜单：提交值 */
export function getFieldConfirmValue(fieldItem) {
  return deepClone(fieldItem?.value)
}

/** 判断字段是否有有效值（顶层菜单激活态） */
export function hasFieldValue(type, value) {
  return hasFilterValue(type, value)
}

/** cell 下拉列表编辑态 */
export function createCellOptions(options, selectedValue) {
  const list = deepClone(options || [])
  for (let i = 0; i < list.length; i++)
    list[i].checked = list[i].value === selectedValue

  return list
}

/** picker 级联编辑态 */
export function createPickerState(options, selectedValues) {
  const viewCol = []
  const viewRow = []
  const list = deepClone(options || [])

  if (!list.length)
    return { viewCol, viewRow }

  if (selectedValues?.length) {
    function applySelected(selected, opts) {
      for (let i = 0; i < opts.length; i++) {
        const node = opts[i]
        for (let j = 0; j < selected.length; j++) {
          if (node.value === selected[j]) {
            node.checked = true
            viewCol.push(node.value)
            viewRow.push(opts)
            if (node.children?.length)
              applySelected(selected, node.children)

            break
          }
        }
      }
    }
    applySelected(selectedValues, list)
  }
  else {
    viewCol.push('tmpValue')
    viewRow.push(list)
  }

  return { viewCol, viewRow }
}

/** 读取 picker 展示模式 */
export function getPickerMode(dropdownItem) {
  const fromProps = dropdownItem?.componentProps?.mode || dropdownItem?.componentProp?.mode
  return fromProps || dropdownItem?.mode || 'column'
}

/** picker 单列下钻编辑态 */
export function createDrillPickerState(options, selectedValues) {
  const rootList = deepClone(options || [])
  const stack = []
  let currentList = rootList

  if (!selectedValues?.length)
    return { stack, currentList, rootList }

  for (let i = 0; i < selectedValues.length; i++) {
    const val = selectedValues[i]
    const node = currentList.find(k => k.value === val)
    if (!node)
      break

    currentList.forEach((k) => {
      k.checked = false
    })
    node.checked = true

    const isLast = i === selectedValues.length - 1
    if (!isLast) {
      stack.push(node)
      currentList = deepClone(node.children || [])
    }
    else if (node.children?.length) {
      stack.push(node)
      currentList = deepClone(node.children)
      currentList.forEach((k) => {
        k.checked = false
      })
    }
  }

  return { stack, currentList, rootList }
}

export function getEmptyDaterangeValue() {
  return { start: '', end: '' }
}

/** daterange 编辑态 */
export function resolveDaterangeValue(dropdownItem, mode = 'current') {
  if (mode === 'reset') {
    const { defaultValue } = dropdownItem || {}
    if (defaultValue && typeof defaultValue === 'object') {
      return {
        start: defaultValue.start || '',
        end: defaultValue.end || '',
      }
    }
    return getEmptyDaterangeValue()
  }

  const value = dropdownItem?.value
  return {
    start: value?.start || '',
    end: value?.end || '',
  }
}

export function createDaterangeState(dropdownItem, mode = 'current') {
  return {
    daterange: resolveDaterangeValue(dropdownItem, mode),
    datetag: '',
  }
}

export function hasDaterangeValue(daterange) {
  return !!(daterange?.start && daterange?.end)
}

/** 由 filter 编辑态列表构建提交对象 */
export function buildFilterResult(list) {
  const obj = {}
  if (!list?.length)
    return obj

  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (item.hidden || !hasFilterValue(item.type, item.value))
      continue

    obj[item.prop] = item.value
    if (item.type === 'input-range') {
      obj[`${item.prop}Start`] = item.value[0] ?? null
      obj[`${item.prop}End`] = item.value[1] ?? null
    }
  }
  return obj
}

/** 是否为「不限」值 */
export function isAllValue(value) {
  return value === ALL_ITEM_VALUE || (Array.isArray(value) && value[0] === ALL_ITEM_VALUE)
}

/** 在 options 头部插入「不限」项 */
export function ensureAllOption(options, showAll) {
  if (!showAll || !options?.length)
    return options

  if (options.findIndex(k => k.value === ALL_ITEM_VALUE) === -1)
    options.unshift({ ...ALL_ITEM })

  return options
}

/** 计算菜单项激活状态 */
export function computeMenuActived(item) {
  if (typeof item.value === 'undefined')
    return false

  switch (item.type) {
    case 'cell':
      return item.options?.some(k => k.value === item.value) ?? false
    case 'click':
      return item.value === true
    case 'sort':
      return item.value === 'asc' || item.value === 'desc'
    case 'filter':
      return !isEmptyObject(item.value)
    case 'picker':
      return !!item.value?.length
    case 'daterange':
      return !!(item.value?.start && item.value?.end)
    case 'com-select':
    case 'com-tree':
    case 'date-picker':
    case 'slider':
    case 'search':
    case 'radio':
    case 'checkbox':
    case 'input-range':
      return hasFieldValue(item.type, item.value)
    case 'slot':
    case 'slot1':
    case 'slot2':
    case 'slot3':
    case 'slot4':
    case 'slot5':
      return !!item.value
    default:
      return false
  }
}

/** 格式化 date-picker 选中值用于菜单展示 */
export function formatDatePickerDisplayLabel(value) {
  if (value == null || value === '')
    return ''

  if (Array.isArray(value))
    return value.filter(v => v != null && v !== '').join(' - ')

  return String(value)
}

/** 更新菜单项展示文案（cell / com-select / date-picker 等 showLabel 时使用） */
export function updateMenuDisplayLabel(item) {
  if (!item.showLabel) {
    item.displayLabel = item.title
    return
  }

  if (item.type === 'date-picker') {
    const dateLabel = formatDatePickerDisplayLabel(item.value)
    item.displayLabel = dateLabel || item.title
    return
  }

  if (item.options?.length && item.value != null && item.value !== '') {
    const matched = item.options.find(opt => opt.value === item.value)
    item.displayLabel = matched?.label || matched?.text || item.title
    return
  }

  item.displayLabel = item.title
}

/**
 * 格式化数值-个位数补零
 */
export function formatNumber(n) {
  let s = Number.parseInt(n)
  if (Number.isNaN(s))
    s = '0'
  else
    s = s.toString()

  return s[1] ? s : `0${s}`
}

/**
 * 格式化时间
 */
export function formatTime(date, format) {
  const daDate = new Date(date.toString().length < 11 ? date * 1000 : date)
  const fromatsRule = ['y', 'm', 'd', 'h', 'i', 's']
  let tmp = []
  const year = daDate.getFullYear()
  const month = daDate.getMonth() + 1
  const day = daDate.getDate()
  const hour = daDate.getHours()
  const minute = daDate.getMinutes()
  const second = daDate.getSeconds()

  if (format) {
    tmp.push(year, month, day, hour, minute, second)
    tmp = tmp.map(formatNumber)
    for (let i = 0; i < tmp.length; i++)
      format = format.toLowerCase().replace(fromatsRule[i], tmp[i])

    return format
  }

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 获取某个时间范围
 */
export function getRangeDate(v) {
  const now = new Date()
  const nowTime = now.getTime()
  const oneDay = 24 * 60 * 60 * 1000
  const dateRange = { start: '', end: '' }
  const nowWeekDay = now.getDay()
  const nowDay = now.getDate()
  const nowMonth = now.getMonth()
  const nowYear = now.getFullYear()

  const getMonthDays = function (month) {
    const monthStartDate = new Date(nowYear, month, 1)
    const monthEndDate = new Date(nowYear, month + 1, 1)
    const days = (monthEndDate - monthStartDate) / oneDay
    return days
  }

  if (v === '-1') {
    dateRange.start = formatTime(new Date(nowTime - oneDay), 'y-m-d')
    dateRange.end = dateRange.start
  }
  else if (v === '-7') {
    const weekStart = new Date(nowYear, nowMonth, nowDay - nowWeekDay + 1)
    const weekEnd = new Date(nowTime + oneDay)
    dateRange.start = formatTime(weekStart, 'y-m-d')
    dateRange.end = formatTime(weekEnd, 'y-m-d')
  }
  else if (v === '-14') {
    const weekStart = new Date(nowYear, nowMonth, nowDay - nowWeekDay - 6)
    const weekEnd = new Date(nowYear, nowMonth, nowDay - nowWeekDay)
    dateRange.start = formatTime(weekStart, 'y-m-d')
    dateRange.end = formatTime(weekEnd, 'y-m-d')
  }
  else if (v === '-30') {
    const monthStart = new Date(nowYear, nowMonth, 1)
    const monthEnd = new Date(nowTime + oneDay)
    dateRange.start = formatTime(monthStart, 'y-m-d')
    dateRange.end = formatTime(monthEnd, 'y-m-d')
  }
  else if (v === '-60') {
    const lastMonthDate = new Date()
    lastMonthDate.setDate(1)
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
    const lastMonth = lastMonthDate.getMonth()
    const lastMonthStart = new Date(nowMonth === 0 ? nowYear - 1 : nowYear, lastMonth, 1)
    const lastMonthEnd = new Date(nowMonth === 0 ? nowYear - 1 : nowYear, lastMonth, getMonthDays(lastMonth))
    dateRange.start = formatTime(lastMonthStart, 'y-m-d')
    dateRange.end = formatTime(lastMonthEnd, 'y-m-d')
  }
  else if (v > 0) {
    dateRange.start = formatTime(new Date(nowTime - oneDay * Number.parseInt(v)), 'y-m-d')
    dateRange.end = formatTime(new Date(nowTime - oneDay), 'y-m-d')
  }
  return dateRange
}

const slotMenuOpts = { showArrow: true }

export const menuInitOpts = {
  'cell': { showArrow: true },
  'click': {},
  'sort': { showSort: true },
  'filter': { showArrow: true },
  'picker': { showArrow: true },
  'daterange': { showQuick: true, showArrow: true },
  'com-select': { showArrow: true, showLabel: true },
  'com-tree': { showArrow: true },
  'date-picker': { showArrow: true },
  'slider': { showArrow: true },
  'input-range': { showArrow: true },
  'radio': { showArrow: true, showLabel: true },
  'checkbox': { showArrow: true },
  'slot': slotMenuOpts,
  'slot1': slotMenuOpts,
  'slot2': slotMenuOpts,
  'slot3': slotMenuOpts,
  'slot4': slotMenuOpts,
  'slot5': slotMenuOpts,
  'search': { showSearch: true },
}
