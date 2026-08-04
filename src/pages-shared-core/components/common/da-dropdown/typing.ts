/**
 * 菜单项-下拉配置
 */
export interface DaCellOption {
  /** 是否显示“不限”选项 */
  showAll?: boolean
  /** 是否显示勾选图标 */
  showIcon?: boolean
  /** 选中后在菜单栏展示 options 中的 label */
  showLabel?: boolean
}

export interface DaClickOption {}

export interface DaSortOption {}

export interface DaFilterOption {
  resetText?: string
  confirmText?: string
}

export interface DaPickerOption {
  showAll?: boolean
  showIcon?: boolean
  /** 级联展示模式：column 多列并排（默认），drill 单列下钻 */
  mode?: 'column' | 'drill'
  field?: {
    label: string
    value: string
    children: string
  }
}

export interface DaDaterangeOption {
  showQuick?: boolean
  resetText?: string
  confirmText?: string
}

export interface DaDropdownMenuListOption {
  label: string
  value: string | number
  suffix?: string
  disabled?: boolean
  checked?: boolean
  isActived?: boolean
  children?: DaDropdownMenuListOption[]
}

export interface DaCellItemOption extends DaDropdownMenuListOption {
  suffix?: string
}

/** 筛选项类型 */
export type DaFilterItemType =
  | 'radio'
  | 'checkbox'
  | 'slider'
  | 'com-select'
  | 'com-tree'
  | 'date-picker'
  | 'search'
  | 'input-range'

/**
 * 筛选-项内容
 */
export interface DaFilterItemOption {
  title: string
  type: DaFilterItemType
  prop: string
  hidden?: boolean
  value?: string | number | string[] | number[] | null
  /** 重置时的默认值，优先于菜单项 defaultValue */
  defaultValue?: string | number | string[] | number[] | null | Record<string, unknown>
  /** slider 等组件 props，兼容 componentProp / componentProps */
  componentProp?: Record<string, unknown>
  componentProps?: Record<string, unknown>
  options?: DaDropdownMenuListOption[]
}

export interface DaPickerItem extends DaDropdownMenuListOption {
  isActived?: boolean
  checked?: boolean
  children?: DaPickerItem[]
}

export type DaDropdownMenuType =
  | 'cell'
  | 'click'
  | 'sort'
  | 'filter'
  | 'picker'
  | 'daterange'
  | 'search'
  | 'com-select'
  | 'com-tree'
  | 'date-picker'
  | 'slider'
  | 'input-range'
  | 'radio'
  | 'checkbox'
  | 'slot'
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'slot4'
  | 'slot5'

/**
 * 菜单项
 */
export interface DaDropdownMenuListItem extends DaCellOption, DaClickOption, DaSortOption, DaFilterOption, DaPickerOption, DaDaterangeOption {
  title: string
  type: DaDropdownMenuType
  prop: string
  /**
   * 选中值运行时字段（内部状态，请使用 v-model）
   */
  value?: unknown
  hidden?: boolean
  isHidden?: boolean
  isActived?: boolean
  isClick?: boolean
  isLoading?: boolean
  showArrow?: boolean
  showSort?: boolean
  displayLabel?: string
  placeholder?: string
  defaultValue?: unknown
  field?: DaPickerOption['field']
  syncDataKey?: string
  syncDataFn?: (item: DaDropdownMenuListItem, index: number) => Promise<unknown>
  /** slider / ComSelect 等组件 props，兼容 componentProp / componentProps */
  componentProp?: Record<string, unknown>
  componentProps?: Record<string, unknown>
  options?: DaDropdownMenuListOption[] | DaFilterItemOption[]
}

export type DaDropdownMenuList = DaDropdownMenuListItem[]

/** v-model 绑定：key 为菜单项 prop，value 为选中值 */
export type DaDropdownModelValue = Record<string, unknown>
