<template>
  <view class="da-dropdown" :class="{ 'is-fixed': fixedTop, 'has-search': hasSearch }" :style="dropdownStyle">
    <view :class="` flex justify-between gap-2 ${hasSearch && menuList.length <= 2 ? '' : 'flex-col'}`">
      <Search v-if="hasSearch" :placeholder="searchItem.placeholder || '请输入关键词查询'" v-model="searchItem.value"
        class="!mx-0 !flex-1" @search="handleSearch" @change="handleSearch"></Search>
      <!-- 菜单 -->
      <view class="da-dropdown-menu" @touchmove.stop.prevent="handleMove">
        <template v-for="(item, index) in menuList" :key="index">
          <view class="da-dropdown-menu-item" :class="{ 'is-hidden': item.isHidden === 'true' }" v-if="!item.hidden"
            @click="handleMenuClick(index, item)">
            <text class="da-dropdown-menu-item--text" :class="item.isActived ? 'is-actived' : ''">{{
              formatCellLabel(item)
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
    </view>
    <!-- 弹出 -->
    <view class="da-dropdown-content" :style="{ top: popTop + 'px' }" :class="{ 'is-show': isShow, 'is-visible': isVisible }">
      <view class="da-dropdown-content-popup" :class="isShow ? 'is-show' : ''">
        <view class="da-dropdown-popup-box" v-for="(item, index) in menuList" :key="index">
          <!-- 下拉列表 -->
          <DropdownCell v-if="item.type === 'cell' && index === currentIndex" :dropdownItem="item"
            :dropdownIndex="index" @success="handleCellSelect"></DropdownCell>
          <!-- 多条件筛选 -->
          <DropdownFilter v-if="item.type === 'filter' && index === currentIndex" :dropdownItem="item"
            :dropdownIndex="index" @success="handleFilterConfirm"></DropdownFilter>
          <!-- 级联选择 -->
          <DropdownPicker v-if="item.type === 'picker' && index === currentIndex" :dropdownItem="item"
            :dropdownIndex="index" @success="handlePickerConfirm" />
          <!-- 日期范围 -->
          <DropdownDaterange v-if="item.type === 'daterange' && index === currentIndex" :dropdownItem="item"
            :dropdownIndex="index" @success="handleDaterangeConfirm" />
          <!-- 弹窗插槽拓展X5 -->
          <template v-if="item.type === 'slot1' && index === currentIndex">
            <slot name="slot1" :item="item" :index="index"></slot>
          </template>
          <template v-if="item.type === 'slot2' && index === currentIndex">
            <slot name="slot2" :item="item" :index="index"></slot>
          </template>
          <template v-if="item.type === 'slot3' && index === currentIndex">
            <slot name="slot3" :item="item" :index="index"></slot>
          </template>
          <template v-if="item.type === 'slot4' && index === currentIndex">
            <slot name="slot4" :item="item" :index="index"></slot>
          </template>
          <template v-if="item.type === 'slot5' && index === currentIndex">
            <slot name="slot5" :item="item" :index="index"></slot>
          </template>
        </view>
      </view>
      <view class="da-dropdown-mask" v-if="isShow" @click="handlePopupMask" @touchmove.stop.prevent="handleMove" />
    </view>
    <view class="da-dropdown--blank" v-if="fixedTop"></view>
  </view>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'

import { deepClone, menuInitOpts, getValueByKey, checkDataField } from './utils'
import DropdownPicker from './components/picker.vue'
import DropdownCell from './components/cell.vue'
import DropdownFilter from './components/filter.vue'
import DropdownDaterange from './components/daterange.vue'

export default defineComponent({
  options: {
    virtualHost: true, // 解决小程序虚拟列表问题
    addGlobalClass: true, // 允许全局样式
  },
  components: { DropdownPicker, DropdownCell, DropdownFilter, DropdownDaterange },
  props: {
    /**
     * 导航菜单数据
     */
    dropdownMenu: {
      type: Array,
      default: () => [],
    },
    /**
     * 激活颜色
     */
    themeColor: {
      type: String,
      default: '#108EE9',
    },
    /**
     * 常规颜色
     */
    textColor: {
      type: String,
      default: '#666666',
    },
    /**
     * 背景颜色，当固定在顶部时，此为必填
     */
    bgColor: {
      type: String,
      // default: '#ffffff',
      default: 'transparent',
    },
    bgColor2: {
      type: String,
      // default: '#ffffff',
      default: 'transparent',
    },
    /**
     * 是否固定在顶部
     */
    fixedTop: {
      type: Boolean,
      default: false,
    },
    /**
     * 固定在头部时的位置，单位px
     * 如果页面定义了 "navigationStyle": "custom" ，因此固定头部时需要额外获取状态栏高度，以免被异形屏头部覆盖
     */
    fixedTopValue: {
      type: Number,
      default: 0,
    },
    /**
     * 弹窗过渡时间
     */
    duration: {
      type: [Number, String],
      default: 300,
    },
  },
  emits: ['open', 'close', 'confirm'],
  setup(props, { emit }) {
    const currentIndex = ref(-1)
    const isVisible = ref(false)
    const isShow = ref(false)
    const menuList = ref([])
    const hasSearch = ref(false)
    const searchItem = ref(null)
    const popTop = ref(90)
    nextTick(async () => {
      try {
        popTop.value = await getRect('.da-dropdown-menu').then(rect => (rect?.top + rect.height) || 90) // 获取菜单顶部位置
      } catch (error) {
        
      }
    })
    // 主题样式
    const dropdownStyle = computed(() => {
      return `
        --dropdown-theme-color: ${props.themeColor};
        --dropdown-text-color: ${props.textColor};
        --dropdown-background-color: ${props.bgColor};
        --dropdown-background-color2: ${props.bgColor2};
        --dropdown-popup-duration: ${props.duration / 1000}s;
        --dropdown-fixed-top: ${props.fixedTopValue || 0}px;
      `
    })
    /**
     * 初始化数据
     */
    async function initData() {
      const newMenu = props.dropdownMenu || []
      const allItem = { label: '不限', value: '-9999' }
      if (!newMenu || newMenu.length === 0) {
        menuList.value = []
        return
      }

      for (let i = 0; i < newMenu.length; i++) {
        let item = newMenu[i]
        if (item?.type) {
          item = { ...(menuInitOpts[newMenu[i]['type']] || {}), ...item }
        }

        // if (typeof item.defaultValue === 'undefined') {
        //   item.defaultValue = deepClone(item.value)
        // }

        // 处理异步初始项
        if (typeof item.syncDataFn === 'function') {
          item.isLoading = true
          item.syncDataFn(item, i).then((res) => {
            menuList.value[i].options = checkDataField(item.syncDataKey ? getValueByKey(res, item.syncDataKey) : res, item.field)
            // 处理 不限 项
            if (this.menuList[i].showAll) {
              if (this.menuList[i].options.findIndex((k) => k.value === allItem.value) === -1) {
                this.menuList[i].options.unshift(allItem)
              }
            }
            menuList.value[i].isLoading = false
          }).catch(() => {
            menuList.value[i].isLoading = false
          })
        }

        if (item.options?.length) {
          // 同步差异字段
          item.options = checkDataField(item.options, item.field)
          // 处理 不限 项
          if (item.showAll) {
            if (item.options.findIndex((k) => k.value === allItem.value) === -1) {
              item.options.unshift(allItem)
            }
          }
        }

        // 处理已选项
        if (typeof item.value !== 'undefined') {
          switch (item.type) {
            case 'cell':
              for (let x = 0; x < item.options.length; x++) {
                const k = item.options[x]
                if (k.value === item.value) {
                  item.isActived = true
                  break
                }
              }
              break
            case 'click':
              item.isActived = item.value === true

              break
            case 'sort':
              item.isActived = item.value === 'asc' || item.value === 'desc'

              break
            case 'filter':
              item.isActived = JSON.stringify(item.value || {}) !== '{}'

              break
            case 'picker':
              item.isActived = item.value?.length

              break
            case 'daterange':

              item.isActived = item.value?.start && item.value?.end
              break
            case 'slot':
              item.isActived = !!item.value

              break
            default:
              break
          }
        } else {
          item.isActived = false
        }

        // 搜索项特殊处理
        if (!hasSearch.value && item.type === 'search') {
          item.isHidden = 'true'
          searchItem.value = item
          hasSearch.value = true
        }

        newMenu[i] = item
      }
      menuList.value = newMenu
    }
    /**
     * 更新数据
     * @param prop
     * @param value
     * @param key
     */
    function updateMenu(prop, value, key) {
      if (!key) {
        console.error('updateMenu 错误，key不存在')
        return
      }
      const idx = getMenuIndex(prop)
      menuList.value[idx][key] = key === 'options' ? checkDataField(value, menuList.value[idx].field || null) : value

      // 去除点击效果
      if (key === 'value' && (!value && value !== 0)) {
        menuList.value[idx].isActived = false
      }
    }
    /**
     * 更新数据
     * @param prop
     * @param state
     */
    function setMenuLoading(prop, state) {
      const idx = getMenuIndex(prop)
      menuList.value[idx].isLoading = state
    }
    /**
     * 获取菜单项位置
     * @param prop
     */
    function getMenuIndex(prop) {
      return menuList.value.findIndex(k => k.prop === prop)
    }
    /**
     * 获取菜单数据
     */
    function getMenuList() {
      return menuList.value
    }
    /**
     * 初始化获取系统信息
     */
    function initDomInfo() { }
    /**
     * 打开弹窗
     * @param index 当前激活索引
     */
    function openMenuItemPopup(index) {
      isShow.value = true
      isVisible.value = true
      currentIndex.value = index
      menuList.value[index].isClick = true
      emit('open', currentIndex.value)
    }
    /**
     * 关闭弹窗
     */
    function closeMenuPopup() {
      clearClickState()
      isShow.value = false
      // 延迟移除下拉弹窗
      setTimeout(() => {
        isVisible.value = false
        clearIndex()
      }, props.duration)
      emit('close', currentIndex.value, menuList.value)
    }
    /**
     * 点击蒙层
     */
    function handlePopupMask() {
      closeMenuPopup()
    }
    /**
     * 清除点击状态
     */
    function clearClickState() {
      if (menuList.value?.length) {
        menuList.value.forEach(k => {
          k.isClick = false
        })
      }
    }
    /**
     * 清理滚动
     */
    function handleMove() {
      return false
    }
    /**
     * 关闭弹窗
     */
    function clearIndex() {
      currentIndex.value = -1
    }
    /**
     * 点击菜单项
     */
    function handleMenuClick(index, item) {
      if (item.isLoading) return

      const dropdownMenu = menuList.value
      const menuItem = dropdownMenu[index]

      dropdownMenu.forEach(k => {
        k.isClick = false
      })

      if (menuItem.type === 'click') {
        return handleItemClick(menuItem, index)
      }

      if (menuItem.type === 'sort') {
        return handleItemSort(menuItem, index)
      }
      if (index === currentIndex.value) {
        item.isClick = false
        closeMenuPopup()
        return
      }

      item.isClick = true

      openMenuItemPopup(index)
    }
    /**
     * 获取菜单值
     */
    function getMenuValue() {
      const obj = {}
      menuList.value.forEach(k => {
        obj[k.prop] = k.value
      })

      return obj
    }
    /**
     * 搜索输入
     */
    function handleSearchChange(e) {
      searchItem.value.value = e?.detail?.value
    }
    /**
     * 确定搜索
     */
    function handleSearch() {
      if (searchItem.value?.prop) {
        const res = { [searchItem.value.prop]: searchItem.value.value }
        emit('confirm', res, getMenuValue())
      } else {
        console.error(`菜单项${searchItem.value.title}未定义prop，返回内容失败`)
      }
    }
    /**
     * 菜单项-下拉列表回调
     * @param callbackData 操作返回的数据
     * @param cellItem 下拉列表项数据
     * @param index 菜单索引
     */
    function handleCellSelect(callbackData, cellItem, index) {
      const dropdownMenu = menuList.value
      const item = dropdownMenu[index]
      item.isClick = false

      if (cellItem.value === '-9999') {
        item.isActived = false
        item.value = null
      } else {
        item.isActived = true
        item.value = cellItem.value
      }

      closeMenuPopup()
      emit('confirm', callbackData, getMenuValue())
    }
    /**
     * 菜单项-点击
     * @param item 菜单项
     * @param index 菜单项索引
     */
    function handleItemClick(item, index) {
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
      if (item?.prop) {
        const res = { [item.prop]: item.value }
        emit('confirm', res, getMenuValue())
      } else {
        console.error(`菜单项${item.title}未定义prop，返回内容失败`)
      }
    }
    /**
     * 菜单项-排序
     * @param item 菜单项
     * @param index 菜单项索引
     */
    function handleItemSort(item, index) {
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

      if (item?.prop) {
        const res = { [item.prop]: item.value }
        emit('confirm', res, getMenuValue())
      } else {
        console.error(`菜单项${item.title}未定义prop，返回内容失败`)
      }
    }
    /**
     * 菜单项-筛选回调
     * @param callbackData 操作返回的数据
     * @param filterData 筛选数据
     * @param index 菜单索引
     */
    function handleFilterConfirm(callbackData, filterData, index) {
      const dropdownMenu = menuList.value
      const item = dropdownMenu[index]
      item.isClick = false

      item.isActived = JSON.stringify(filterData || {}) !== '{}'
      item.value = filterData

      closeMenuPopup()
      emit('confirm', callbackData, getMenuValue())
    }
    /**
     * 菜单项-级联回调
     * @param callbackData 操作返回的数据
     * @param pickerItem 级联已选数据
     * @param index 菜单索引
     */
    function handlePickerConfirm(callbackData, pickerItem, index) {
      const dropdownMenu = menuList.value
      const item = dropdownMenu[index]
      item.isClick = false

      if (!pickerItem || pickerItem[0] === '-9999') {
        item.isActived = false
        item.value = null
      } else {
        item.isActived = true
        item.value = pickerItem
      }

      closeMenuPopup()
      emit('confirm', callbackData, getMenuValue())
    }
    /**
     * 菜单项-日期范围回调
     * @param callbackData 操作返回的数据
     * @param daterangeItem 日期范围数据
     * @param index 菜单索引
     */
    function handleDaterangeConfirm(callbackData, daterangeItem, index) {
      const dropdownMenu = menuList.value
      const item = dropdownMenu[index]
      item.isClick = false

      if (daterangeItem?.start && daterangeItem?.end) {
        item.isActived = true
        item.value = daterangeItem
      } else {
        item.isActived = false
        item.value = null
      }

      closeMenuPopup()
      emit('confirm', callbackData, getMenuValue())
    }

    function formatCellLabel(cellItem) {
      return (cellItem.showLabel ? cellItem.options.find(option => option.value === cellItem.value)?.label : cellItem.title) || cellItem.title
    }

    onMounted(() => {
      initDomInfo()
      initData()
    })

    return {
      initData,
      menuList,
      updateMenu,
      setMenuLoading,
      getMenuIndex,
      getMenuList,
      dropdownStyle,
      currentIndex,
      isShow,
      isVisible,
      hasSearch,
      searchItem,
      handleSearchChange,
      handleSearch,
      handleMenuClick,
      handlePopupMask,
      handleMove,
      getMenuValue,

      handleCellSelect,
      handleFilterConfirm,
      handlePickerConfirm,
      handleDaterangeConfirm,
      popTop,
      formatCellLabel,
    }
  },
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
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--dropdown-menu-height);
    padding: 10rpx 20rpx 6rpx;
    background: var(--dropdown-background-color, #fff);

    &-input {
      flex-grow: 1;
      height: 60rpx;
      padding: 0 20rpx;
      overflow: hidden;
      font-size: 28rpx;
      color: var(--dropdown-text-color);
      background: #f6f6f6;
      border-radius: 8rpx 0 0 8rpx;
    }

    &-btn {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      height: 60rpx;
      padding: 0 20rpx;
      overflow: hidden;
      font-size: 28rpx;
      color: var(--dropdown-text-color);
      background: #f6f6f6;
      border: none;
      border-radius: 0 8rpx 8rpx 0;

      &::after {
        display: none;
      }
    }
  }

  &-menu {
    position: relative;
    // z-index: 1;
    display: flex;
    align-items: center;
    height: var(--dropdown-menu-height);
    background: var(--dropdown-background-color2, #fff);
    // box-shadow: 0 1rpx 0 0 #bbb;

    &-item {
      display: flex;
      flex-grow: 1;
      align-items: center;
      justify-content: center;
      height: 100%;

      // &:hover {
      //   background: #fafafa;
      // }

      &.is-hidden {
        display: none;
      }

      &--text {
        font-size: 24rpx;
        color: var(--dropdown-text-color);

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
