<template>
  <view class="da-dropdown-cell">
    <view
      class="da-dropdown-cell-item"
      :class="[item.checked ? 'is-actived' : '',item.disabled ? 'is-disabled' : '']"
      v-for="(item, index) in cellOptions"
      :key="index"
      @click="handleSelect(item)">
      <text class="da-dropdown-cell-item--label">{{ item.label }}</text>
      <text class="da-dropdown-cell-item--suffix">{{ item.suffix }}</text>
      <text class="da-dropdown-cell-item--check" v-if="item.checked && showIcon" />
    </view>
  </view>
</template>

<script>
import { defineComponent, watch, ref } from 'vue'
import { deepClone } from '../utils'

export default defineComponent({
  props: {
    dropdownItem: {
      type: Object,
      default: null,
    },
    dropdownIndex: {
      type: Number,
    },
  },
  emits: ['success'],
  setup(props, { emit }) {
    const cellOptions = ref([])
    const showIcon = ref(false)

    function initData(options, value) {
      const list = deepClone(options)
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        if (item.value === value) {
          item.checked = true
          break
        }
      }
      cellOptions.value = list
    }

    function handleSelect(item) {
      if (item.disabled) {
        return
      }

      if (props.dropdownItem?.prop) {
        const res = { [props.dropdownItem.prop]: item.value }
        emit('success', res, item, props.dropdownIndex)
      } else {
        console.error(`菜单项${props.dropdownItem.title}未定义prop，返回内容失败`)
      }
    }

    watch(() => props.dropdownItem,
      (v) => {
        if (v?.options?.length) {
          initData(v.options, v.value)
        } else {
          cellOptions.value = []
        }
        showIcon.value = v?.showIcon || false
      }, { immediate: true, deep: true })

    return {
      cellOptions,
      showIcon,
      handleSelect,
    }
  },
})
</script>

<style lang="scss" scoped>
// 下拉列表
.da-dropdown-cell {
  --cell-height: 94rpx;
  --cell-height1: 60rpx;
  padding: 0rpx 20rpx;

  width: 100%;
  max-height: 60vh;
  box-sizing: border-box;
  overflow: hidden auto;

  &-item {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: var(--cell-height);
    padding: 0 24rpx;
    overflow: hidden;
    font-size: 28rpx;
    color: var(--dropdown-text-color);
    white-space: nowrap;
    border-bottom: 1rpx dashed #dedede;

    &:last-child {
      border-bottom: none;
    }

    &--label {
      flex-grow: 1;
      max-width: 80%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      // #ifdef H5
      :deep(> span) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      // #endif
    }

    &--suffix {
      flex-grow: 1;
      margin-left: 10px;
      overflow: hidden;
      font-size: 24rpx;
      color: #999;
      text-align: right;
      text-overflow: ellipsis;
      white-space: nowrap;

      // #ifdef H5
      :deep(> span) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      // #endif
    }

    &--check {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: var(--cell-height1);
      height: var(--cell-height);

      &::after {
        /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
        font-family: 'da-dropdown-iconfont' !important;
        font-size: calc(var(--cell-height) / 2 );
        font-style: normal;
        content: '\e736';
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    }

    &.is-actived {
      color: var(--dropdown-theme-color);
    }

    &.is-disabled {
      color: #aaa;
      background: #efefef;
    }
  }
}
</style>
