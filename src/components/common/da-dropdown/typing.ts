/**
 * 菜单项-下拉配置
 */
export interface DaCellOption {
  /**
   * 是否显示“不限”选项
   */
  showAll?: boolean
  /**
   * 是否显示勾选图标
   */
  showIcon?: boolean
}
/**
 * 菜单项-点击配置
 */
export interface DaClickOption {}
/**
 * 菜单项-排序配置
 */
export interface DaSortOption {}
/**
 * 菜单项-筛选配置
 */
export interface DaFilterOption {}
/**
 * 菜单项-级联配置
 */
export interface DaPickerOption {
  /**
   * 是否显示“不限”选项
   */
  showAll?: boolean
  /**
   * 是否显示勾选图标
   */
  showIcon?: boolean
  field?: {
    label: string
    value: string
    children: string
  }
}
/**
 * 菜单项-日期范围配置
 */
export interface DaDaterangeOption {
  value?: {
    start: string
    end: string
  }
}
/**
 * 下拉列表-项内容
 */
export interface DaCellItemOption extends DaDropdownMenuListOption {
  /**
   * 右侧子标题
   */
  suffix?: string
}
/**
 * 筛选-项内容
 */
export interface DaFilterItemOption {
  /**
   * 筛选标题
   */
  title: string
  /**
   * 筛选类型，可选 radio 单选按钮、checkbox 多选按钮、slider 滑动选择器
   */
  type: 'radio' | 'checkbox' | 'slider'
  /**
   * 筛选项prop
   */
  prop: string
  /**
   * 已选内容
   */
  value?: string | number | string[] | number[]
  /**
   * 筛选项-slider子项组件prop，具体参考 https://uniapp.dcloud.net.cn/component/slider.html
   */
  componentProp?: object
  /**
   * 筛选项-子项
   */
  options?: DaDropdownMenuListOption[]
}

/**
 * 级联-项内容
 */
export interface DaPickerItem extends DaDropdownMenuListOption {
  isActived: boolean
  /**
   * 子项
   */
  children?: DaPickerItem[]
}

/**
 * 菜单列表选择项
 */
export interface DaDropdownMenuListOption {
  /**
   * 选择项标题
   */
  label: string
  /**
   * 选择项内容
   */
  value: string
}

/**
 * 菜单项
 */
export interface DaDropdownMenuListItem extends DaCellOption, DaClickOption, DaSortOption, DaFilterOption, DaPickerOption {
  /**
   * 菜单标题
   */
  title: string
  /**
   * 菜单类型
   * 可选：cell 下拉选择、click 点击、sort 排序、filter 复杂筛选、picker 级联、daterange 日期范围
   */
  type: 'cell' |'click' | 'sort' | 'filter' | 'picker'| 'daterange'
  /**
   * 菜单项prop
   */
  prop: string
  /**
   * 菜单值
   */
  value?: string
  /**
   * 菜单选项函数，优先级大于 options
   */
  syncDataFn?: Function
  /**
   * 菜单选项
   */
  options?: DaDropdownMenuListOption[] | DaFilterItemOption[]
}

/**
 * 菜单列表
 */
export type DaDropdownMenuList = DaDropdownMenuListItem[]
