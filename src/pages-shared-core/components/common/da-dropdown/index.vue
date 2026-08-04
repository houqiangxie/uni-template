<template>
  <view class="da-dropdown" :class="{ 'is-fixed': fixedTop, 'has-search': hasSearch }" :style="dropdownStyle">
    <view :class="`da-dropdown-header flex justify-between gap-2 ${hasSearch && menuList.length <= 2 ? '' : 'flex-col'}`">
      <view v-if="hasSearch && searchItem" class="da-dropdown-search">
        <Search
          :placeholder="searchItem!.placeholder || '请输入关键词查询'"
          v-model="searchItem!.value"
          v-bind="searchComponentProps"
          @search="handleSearch"
          @change="handleSearch"
        />
      </view>
      <!-- 菜单（项多时可横向滚动） -->
      <scroll-view class="da-dropdown-menu" scroll-x enable-flex :show-scrollbar="false">
        <view class="da-dropdown-menu-inner">
          <template v-for="(item, index) in menuList" :key="item.prop || index">
            <view class="da-dropdown-menu-item" :class="{ 'is-hidden': item.isHidden }" v-if="!item.hidden"
              @click="handleMenuClick(index, item)">
              <text class="da-dropdown-menu-item--text" :class="item.isActived ? 'is-actived' : ''">{{
                item.displayLabel || item.title
                }}</text>
              <view class="da-dropdown-menu-item--icon" v-if="item.showArrow">
                <text v-if="item.isLoading" class="is--loading"></text>
                <text v-else-if="item.isClick" class="is--arrup"></text>
                <text v-else class="is--arrdown"></text>
              </view>
              <view class="da-dropdown-menu-item--sort" v-else-if="item.showSort" :class="'is--' + item.value"></view>
            </view>
          </template>
        </view>
      </scroll-view>
    </view>
    <!-- 弹出 -->
    <view class="da-dropdown-content" :style="{ top: popTop + 'px' }" :class="{ 'is-show': isShow, 'is-visible': isVisible }">
      <view class="da-dropdown-content-popup" :class="isShow ? 'is-show' : ''">
        <view v-if="currentMenuItem" class="da-dropdown-popup-box" :class="{ 'is-field-popup': isFieldPopupMenu }">
          <!-- 下拉列表 -->
          <DropdownCell v-if="currentMenuItem.type === 'cell'" :dropdownItem="currentMenuItem"
            :dropdownIndex="currentIndex" @success="handleCellSelect"></DropdownCell>
          <!-- 多条件筛选 -->
          <DropdownFilter v-else-if="currentMenuItem.type === 'filter'" :dropdownItem="currentMenuItem"
            :dropdownIndex="currentIndex" @success="handleFilterConfirm"></DropdownFilter>
          <!-- 级联选择 -->
          <DropdownPicker v-else-if="currentMenuItem.type === 'picker'" :dropdownItem="currentMenuItem"
            :dropdownIndex="currentIndex" @success="handlePickerConfirm" />
          <!-- 日期范围 -->
          <DropdownDaterange v-else-if="currentMenuItem.type === 'daterange'" :dropdownItem="currentMenuItem"
            :dropdownIndex="currentIndex" @success="handleDaterangeConfirm" />
          <!-- 独立字段：com-select / com-tree / date-picker 等 -->
          <DropdownField v-else-if="isFieldMenuType(currentMenuItem.type)" :dropdownItem="currentMenuItem"
            :dropdownIndex="currentIndex" @success="handleFieldConfirm" @cancel="handleFieldCancel" />
          <!-- 弹窗插槽（小程序不支持动态插槽，固定 slot1~slot5） -->
          <template v-else-if="currentMenuItem.type === 'slot1'">
            <slot name="slot1" :item="currentMenuItem" :index="currentIndex"></slot>
          </template>
          <template v-else-if="currentMenuItem.type === 'slot2'">
            <slot name="slot2" :item="currentMenuItem" :index="currentIndex"></slot>
          </template>
          <template v-else-if="currentMenuItem.type === 'slot3'">
            <slot name="slot3" :item="currentMenuItem" :index="currentIndex"></slot>
          </template>
          <template v-else-if="currentMenuItem.type === 'slot4'">
            <slot name="slot4" :item="currentMenuItem" :index="currentIndex"></slot>
          </template>
          <template v-else-if="currentMenuItem.type === 'slot5'">
            <slot name="slot5" :item="currentMenuItem" :index="currentIndex"></slot>
          </template>
        </view>
      </view>
      <view class="da-dropdown-mask" v-if="isShow" @click="handlePopupMask" @touchmove.stop.prevent="handleMove" />
    </view>
    <view class="da-dropdown--blank" v-if="fixedTop"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance, nextTick } from 'vue'
import { getRect } from '@/utils/common'
import {
  deepClone,
  menuInitOpts,
  getValueByKey,
  checkDataField,
  ensureAllOption,
  computeMenuActived,
  updateMenuDisplayLabel,
  isEmptyObject,
  isAllValue,
  hasDaterangeValue,
  getMenuStructureSnapshot,
  getMenuConfigSnapshot,
  getOptionsConfigSnapshot,
  getModelValuesSnapshot,
  isSameValue,
  isFieldMenuType,
  hasFieldValue,
  isFieldPopupType,
} from './utils'
import type { DaDropdownMenuListItem } from './typing'
import DropdownPicker from './components/picker.vue'
import DropdownCell from './components/cell.vue'
import DropdownFilter from './components/filter.vue'
import DropdownDaterange from './components/daterange.vue'
import DropdownField from './components/field.vue'
import Search from '@/pages-shared-core/components/common/Search.vue'

defineOptions({
  virtualHost: true,
  addGlobalClass: true,
})

type RuntimeMenuItem = DaDropdownMenuListItem & {
  value?: unknown
  isActived?: boolean
  isClick?: boolean
  isLoading?: boolean
  displayLabel?: string
  isHidden?: boolean
}

const props = withDefaults(defineProps<{
  dropdownMenu?: DaDropdownMenuListItem[]
  modelValue?: Record<string, unknown>
  themeColor?: string
  textColor?: string
  bgColor?: string
  bgColor2?: string
  fixedTop?: boolean
  fixedTopValue?: number
  duration?: number | string
}>(), {
  dropdownMenu: () => [],
  modelValue: () => ({}),
  themeColor: '#108EE9',
  textColor: '#666666',
  bgColor: 'transparent',
  bgColor2: 'transparent',
  fixedTop: false,
  fixedTopValue: 0,
  duration: 300,
})

const emit = defineEmits<{
  open: [index: number]
  close: [index: number, menuList: RuntimeMenuItem[]]
  confirm: [partial: Record<string, unknown>]
  'update:modelValue': [value: Record<string, unknown>]
}>()

const instance = getCurrentInstance()
const currentIndex = ref(-1)
const isVisible = ref(false)
const isShow = ref(false)
const menuList = ref<RuntimeMenuItem[]>([])
const hasSearch = ref(false)
const searchItem = ref<RuntimeMenuItem | null>(null)
const searchComponentProps = computed(() => searchItem.value?.componentProps || searchItem.value?.componentProp || {})
const popTop = ref(90)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const currentMenuItem = computed(() => {
  if (currentIndex.value < 0) return null
  return menuList.value[currentIndex.value] || null
})

const isFieldPopupMenu = computed(() => {
  const type = currentMenuItem.value?.type
  return !!type && isFieldPopupType(type)
})

const dropdownStyle = computed(() => `
  --dropdown-theme-color: ${props.themeColor};
  --dropdown-text-color: ${props.textColor};
  --dropdown-background-color: ${props.bgColor};
  --dropdown-background-color2: ${props.bgColor2};
  --dropdown-popup-duration: ${Number(props.duration) / 1000}s;
  --dropdown-fixed-top: ${props.fixedTopValue || 0}px;
`)

const MENU_PATCH_KEYS = ['title', 'hidden', 'placeholder', 'resetText', 'confirmText', 'showQuick', 'showAll', 'showIcon', 'showLabel', 'field'] as const

async function updatePopTop() {
  if (props.fixedTop) return
  try {
    const rect = await getRect('.da-dropdown-menu', false, instance?.proxy)
    popTop.value = ((rect?.top ?? 0) + (rect?.height ?? 0)) || 90
  } catch {
    // 保留上次计算值
  }
}

function resolveMenuItemValue(prop: string, menuIndex: number) {
  const model = props.modelValue
  if (model && Object.prototype.hasOwnProperty.call(model, prop)) {
    return deepClone(model[prop])
  }
  const fromMenu = props.dropdownMenu?.[menuIndex]
  if (fromMenu?.defaultValue !== undefined) {
    return deepClone(fromMenu.defaultValue)
  }
  return undefined
}

function applyItemValueState(item: RuntimeMenuItem, value: unknown) {
  item.value = value
  item.isActived = computeMenuActived(item)
  updateMenuDisplayLabel(item)
}

function getMenuValue() {
  const obj: Record<string, unknown> = {}
  menuList.value.forEach((k) => {
    if (k.prop) {
      obj[k.prop] = k.value
    }
  })
  return obj
}

function emitModelValue() {
  emit('update:modelValue', getMenuValue())
}

function confirmAndEmit(partial: Record<string, unknown>) {
  emitModelValue()
  emit('confirm', partial)
}

function buildMenuItemFromSource(sourceItem: DaDropdownMenuListItem) {
  return { ...(menuInitOpts[sourceItem.type] || {}), ...sourceItem } as RuntimeMenuItem
}

function syncMenuConfig() {
  const sourceMenu = props.dropdownMenu || []
  if (!sourceMenu.length) {
    menuList.value = []
    hasSearch.value = false
    searchItem.value = null
    return
  }

  if (!menuList.value.length || sourceMenu.length !== menuList.value.length) {
    initData()
    return
  }

  for (let i = 0; i < sourceMenu.length; i++) {
    if (sourceMenu[i]?.prop !== menuList.value[i]?.prop || sourceMenu[i]?.type !== menuList.value[i]?.type) {
      initData()
      return
    }
  }

  for (let i = 0; i < sourceMenu.length; i++) {
    const src = buildMenuItemFromSource(sourceMenu[i])
    const target = menuList.value[i]

    MENU_PATCH_KEYS.forEach((key) => {
      if (src[key] !== undefined) {
        ;(target as Record<string, unknown>)[key] = src[key]
      }
    })

    const nextOptionsSnap = getOptionsConfigSnapshot(src.options)
    const curOptionsSnap = getOptionsConfigSnapshot(target.options)
    if (nextOptionsSnap !== curOptionsSnap) {
      target.options = checkDataField(deepClone(src.options || []), src.field || target.field)
      ensureAllOption(target.options, target.showAll)
      updateMenuDisplayLabel(target)
    }

    if (src.type === 'search') {
      target.isHidden = true
      searchItem.value = target
      hasSearch.value = true
    }
  }

  nextTick(updatePopTop)
}

function initData() {
  hasSearch.value = false
  searchItem.value = null

  const sourceMenu = props.dropdownMenu || []
  if (!sourceMenu.length) {
    menuList.value = []
    return
  }

  const newMenu = deepClone(sourceMenu) as RuntimeMenuItem[]

  for (let i = 0; i < newMenu.length; i++) {
    const item = buildMenuItemFromSource(newMenu[i])
    delete item.value

    if (typeof item.syncDataFn === 'function') {
      item.isLoading = true
      const menuIndex = i
      item.syncDataFn(item, menuIndex).then((res) => {
        const target = menuList.value[menuIndex]
        if (!target) return
        target.options = checkDataField(
          item.syncDataKey ? getValueByKey(res, item.syncDataKey) : res,
          item.field,
        )
        ensureAllOption(target.options, target.showAll)
        target.isLoading = false
        updateMenuDisplayLabel(target)
      }).catch(() => {
        if (menuList.value[menuIndex]) {
          menuList.value[menuIndex].isLoading = false
        }
      })
    }

    if (item.options?.length) {
      item.options = checkDataField(item.options, item.field)
      ensureAllOption(item.options, item.showAll)
    }

    applyItemValueState(item, resolveMenuItemValue(item.prop, i))

    if (item.type === 'search') {
      item.isHidden = true
      searchItem.value = item
      hasSearch.value = true
      const searchVal = resolveMenuItemValue(item.prop, i)
      if (searchVal !== undefined) {
        searchItem.value.value = searchVal
      }
    }

    newMenu[i] = item
  }
  menuList.value = newMenu
  nextTick(updatePopTop)
}

function syncValuesFromModel() {
  if (!menuList.value.length) return

  menuList.value.forEach((target, index) => {
    if (!target?.prop) return
    if (!props.modelValue || !Object.prototype.hasOwnProperty.call(props.modelValue, target.prop)) {
      return
    }
    const srcValue = props.modelValue[target.prop]
    if (isSameValue(target.value, srcValue)) return
    applyItemValueState(target, deepClone(srcValue))
  })

  if (searchItem.value?.prop && props.modelValue
    && Object.prototype.hasOwnProperty.call(props.modelValue, searchItem.value.prop)) {
    searchItem.value.value = props.modelValue[searchItem.value.prop]
  }
}

async function openMenuItemPopup(index: number) {
  await updatePopTop()
  isShow.value = true
  isVisible.value = true
  currentIndex.value = index
  menuList.value[index].isClick = true
  emit('open', currentIndex.value)
}

function clearClickState() {
  menuList.value?.forEach(k => {
    k.isClick = false
  })
}

function clearIndex() {
  currentIndex.value = -1
}

function closeMenuPopup() {
  clearClickState()
  isShow.value = false
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
  closeTimer = setTimeout(() => {
    isVisible.value = false
    clearIndex()
    closeTimer = null
  }, Number(props.duration))
  emit('close', currentIndex.value, menuList.value)
}

function handlePopupMask() {
  closeMenuPopup()
}

function handleMove() {
  return false
}

function handleMenuClick(index: number, item: RuntimeMenuItem) {
  if (item.isLoading) return

  menuList.value.forEach(k => {
    k.isClick = false
  })

  if (item.type === 'click') {
    handleItemClick(item, index)
    return
  }

  if (item.type === 'sort') {
    handleItemSort(item, index)
    return
  }

  if (index === currentIndex.value) {
    item.isClick = false
    closeMenuPopup()
    return
  }

  item.isClick = true
  openMenuItemPopup(index)
}

function handleSearch() {
  if (searchItem.value?.prop) {
    confirmAndEmit({ [searchItem.value.prop]: searchItem.value.value })
  } else {
    console.error(`菜单项${searchItem.value?.title}未定义prop，返回内容失败`)
  }
}

function handleCellSelect(callbackData: Record<string, unknown>, cellItem: { value: unknown }, index: number) {
  const item = menuList.value[index]
  item.isClick = false

  if (isAllValue(cellItem.value)) {
    item.isActived = false
    item.value = null
  } else {
    item.isActived = true
    item.value = cellItem.value
  }
  updateMenuDisplayLabel(item)
  closeMenuPopup()
  confirmAndEmit(callbackData)
}

function handleItemClick(item: RuntimeMenuItem, index: number) {
  closeMenuPopup()

  if (currentIndex.value === -1) {
    currentIndex.value = index
    item.value = true
    item.isActived = true
  } else {
    item.value = false
    item.isActived = false
    clearIndex()
  }

  if (item.prop) {
    confirmAndEmit({ [item.prop]: item.value })
  } else {
    console.error(`菜单项${item.title}未定义prop，返回内容失败`)
  }
}

function handleItemSort(item: RuntimeMenuItem, index: number) {
  closeMenuPopup()

  if (item.value === 'asc') {
    item.value = 'desc'
    currentIndex.value = index
    item.isActived = true
  } else if (item.value === 'desc') {
    item.value = undefined
    item.isActived = false
    clearIndex()
  } else {
    item.value = 'asc'
    currentIndex.value = index
    item.isActived = true
  }

  if (item.prop) {
    confirmAndEmit({ [item.prop]: item.value })
  } else {
    console.error(`菜单项${item.title}未定义prop，返回内容失败`)
  }
}

function handleFilterConfirm(callbackData: Record<string, unknown>, filterData: Record<string, unknown>, index: number) {
  const item = menuList.value[index]
  item.isClick = false
  item.isActived = !isEmptyObject(filterData)
  item.value = filterData
  closeMenuPopup()
  confirmAndEmit(callbackData)
}

function handlePickerConfirm(callbackData: Record<string, unknown>, pickerItem: unknown, index: number) {
  const item = menuList.value[index]
  item.isClick = false

  if (!pickerItem || isAllValue(pickerItem)) {
    item.isActived = false
    item.value = null
  } else {
    item.isActived = true
    item.value = pickerItem
  }

  closeMenuPopup()
  confirmAndEmit(callbackData)
}

function handleDaterangeConfirm(callbackData: Record<string, unknown>, daterangeItem: { start?: string, end?: string }, index: number) {
  const item = menuList.value[index]
  item.isClick = false

  if (hasDaterangeValue(daterangeItem)) {
    item.isActived = true
    item.value = daterangeItem
  } else {
    item.isActived = false
    item.value = null
  }

  closeMenuPopup()
  confirmAndEmit(callbackData)
}

function handleFieldConfirm(callbackData: Record<string, unknown>, fieldValue: unknown, index: number) {
  const item = menuList.value[index]
  item.isClick = false
  item.isActived = hasFieldValue(item.type, fieldValue)
  item.value = fieldValue
  updateMenuDisplayLabel(item)
  closeMenuPopup()
  confirmAndEmit(callbackData)
}

function handleFieldCancel() {
  closeMenuPopup()
}

watch(
  () => getMenuStructureSnapshot(props.dropdownMenu),
  (_sig, prevSig) => {
    if (prevSig === undefined) return
    if (isShow.value) {
      closeMenuPopup()
    }
    initData()
  },
)

watch(
  () => getMenuConfigSnapshot(props.dropdownMenu),
  (_sig, prevSig) => {
    if (prevSig === undefined) return
    syncMenuConfig()
  },
)

watch(
  () => getModelValuesSnapshot(props.modelValue),
  (_sig, prevSig) => {
    if (prevSig === undefined) return
    syncValuesFromModel()
  },
)

onMounted(() => {
  initData()
})

onBeforeUnmount(() => {
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
})
</script>

<style lang="scss" scoped>
@font-face {
  font-family: 'da-dropdown-iconfont';
  /* Project id  */
  src: url('data:application/octet-stream;base64,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') format('truetype');
}

.da-dropdown {
  --dropdown-menu-height: 80rpx;
  --dropdown-popup-duration: 0.3s;

  position: relative;
  // z-index: 1;
  width: 100%;
  line-height: 1;
  box-sizing: border-box;

  &-mask {
    position: absolute;
    // top: var(--dropdown-menu-height);
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    // z-index: 1;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.3);
  }

  &--blank {
    width: 100%;
    height: var(--dropdown-menu-height);
  }

  &-search {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    align-items: center;
    width: 100%;
    min-width: 0;
    height: var(--dropdown-menu-height);
    padding: 10rpx 20rpx 6rpx;
    background: var(--dropdown-background-color, #fff);

    :deep(.search-boxs) {
      width: 100%;
      margin: 0;
      --wot-search-input-bg: #e3f5fe;
      --wot-search-input-padding: 0 10px 0 25px;
      --wot-fs-content: 12px;
      --wot-search-cancel-color: #999;
    }

    :deep(.wd-search) {
      width: 100%;
      padding: 0 !important;
      background: transparent !important;
    }

    :deep(.wd-search__input) {
      background-color: #e3f5fe !important;
      border-radius: 9999px;
    }

    :deep(.wd-search__search-left-icon) {
      left: 4px;
      font-size: 14px;
    }
  }

  &-header {
    width: 100%;
  }

  &-menu {
    position: relative;
    width: 100%;
    height: var(--dropdown-menu-height);
    background: var(--dropdown-background-color2, #fff);
    white-space: nowrap;

    &-inner {
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      height: 100%;
      min-width: 100%;
    }

    &-item {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 0 24rpx;
      white-space: nowrap;

      &.is-hidden {
        display: none;
      }

      &--text {
        flex-shrink: 0;
        font-size: 24rpx;
        line-height: 1.2;
        color: var(--dropdown-text-color);
        white-space: nowrap;

        &.is-actived {
          color: var(--dropdown-theme-color);
        }
      }

      &--icon {
        flex-shrink: 0;
        margin-left: 2px;
        color: var(--dropdown-text-color);

        .is--loading,
        .is--arrup,
        .is--arrdown {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24rpx;
          height: 24rpx;

          &::after {
            /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
            font-family: 'da-dropdown-iconfont' !important;
            font-size: 24rpx;
            font-style: normal;
            content: '\e604';
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }

        .is--loading {
          animation: RunLoading 1s linear 0s infinite;

          &::after {
            content: '\e627';
          }
        }

        .is--arrup {
          color: var(--dropdown-theme-color);
          transform: rotate(180deg);
        }
      }

      &--sort {
        position: relative;
        margin-left: 6rpx;
        transition: transform 0.3s;

        &::before,
        &::after {
          position: absolute;
          top: calc(50% - 16rpx);
          left: 0;
          content: '';
          border-color: transparent;
          border-style: solid;
          border-width: 8rpx;
          border-bottom-color: #bbb;
        }

        &::after {
          top: calc(50% + 6rpx);
          border-top-color: #bbb;
          border-bottom-color: transparent;
        }

        &.is--asc::before {
          border-bottom-color: var(--dropdown-theme-color);
        }

        &.is--desc::after {
          border-top-color: var(--dropdown-theme-color);
        }
      }
    }
  }

  &-content {
    position: fixed;
    // top: var(--dropdown-menu-height);
    // top: 90px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    box-sizing: border-box;
    width: 100%;
    overflow: hidden;
    visibility: hidden;
    box-shadow: 0 -1rpx 0 0 #bbb;
    opacity: 0;
    transition: all var(--dropdown-popup-duration, 0.3s) linear;
    border-radius: 0 0 20rpx 20rpx;
    box-shadow: none !important;

    &.is-show {
      z-index: 5;
      opacity: 1;
    }

    &.is-visible {
      visibility: visible;
      animation: CustomBS var(--dropdown-popup-duration) linear var(--dropdown-popup-duration) forwards;
    }

    &-popup {
      position: relative;
      z-index: 10;
      max-height: 100%;
      overflow: auto;
      transition: transform var(--dropdown-popup-duration) linear;
      transform: translateY(-100%);

      &.is-show {
        transform: translateY(0);
      }
    }
  }

  &-popup-box {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-size: 28rpx;
    line-height: 1;
    background: #fff;
    transition: border-radius var(--dropdown-popup-duration) linear;
    border-radius: 0 0 20rpx 20rpx;

    &.is-field-popup {
      height: 0;
      min-height: 0;
      background: transparent;
    }
  }

  &.has-search {
    .da-dropdown {
      &-content {
        top: calc(var(--dropdown-menu-height) + var(--dropdown-menu-height));
      }
    }
  }

  /* 固定至顶 */
  &.is-fixed {
    z-index: 980;

    .da-dropdown {
      &-search {
        position: fixed;
        top: calc(var(--window-top, 0px) + var(--dropdown-fixed-top, 0px));
        right: 0;
        left: 0;
        max-width: 1190px;
        margin: auto;
      }

      &-menu {
        position: fixed;
        top: calc(var(--window-top, 0px) + var(--dropdown-fixed-top, 0px));
        right: 0;
        left: 0;
        max-width: 1190px;
        margin: auto;
      }

      &-content {
        position: fixed;
        top: calc(var(--window-top, 0px) + var(--dropdown-fixed-top, 0px) + var(--dropdown-menu-height, 0px));
        right: 0;
        bottom: 0;
        left: 0;
        height: 100%;
        box-shadow: none;
      }

      &-content-mask {
        position: fixed;
        top: calc(var(--window-top, 0px) + var(--dropdown-fixed-top, 0px) + var(--dropdown-menu-height, 0px));
      }
    }

    &.has-search {
      .da-dropdown {
        &-menu {
          top: calc(var(--window-top, 0px) + var(--dropdown-fixed-top, 0px) + var(--dropdown-menu-height, 0px));
        }

        &-content {
          top: calc(var(--window-top, 0px) + var(--dropdown-fixed-top, 0px) + var(--dropdown-menu-height, 0px) + var(--dropdown-menu-height, 0px));
        }

        &--blank {
          height: calc(var(--dropdown-fixed-top, 0px) + var(--dropdown-menu-height, 0px) + var(--dropdown-menu-height, 0px));
        }
      }
    }
  }
}

@keyframes RunLoading {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes CustomBS {
  0% {
    box-shadow: 0 -1rpx 0 0 #bbb;
  }

  100% {
    box-shadow: 0 -1rpx 0 0 #bbb, 0 20rpx 20rpx -10rpx rgba(0, 0, 0, 0.1);
  }
}
</style>
