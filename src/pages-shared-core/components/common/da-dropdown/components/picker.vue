<template>

  <!-- 单列下钻模式 -->

  <view

    v-if="isDrillMode && drillCurrentList.length"

    class="da-dropdown-picker is-drill">

    <scroll-view

      v-if="drillStack.length"

      class="da-dropdown-picker-breadcrumb"

      scroll-x

      :show-scrollbar="false">

      <view class="da-dropdown-picker-breadcrumb-inner">

        <text class="da-dropdown-picker-breadcrumb-item" @click="handleDrillCrumb(-1)">请选择</text>

        <template v-for="(node, idx) in drillStack" :key="idx">

          <text class="da-dropdown-picker-breadcrumb-sep">&gt;</text>

          <text

            class="da-dropdown-picker-breadcrumb-item"

            :class="{ 'is-last': idx === drillStack.length - 1 }"

            @click="handleDrillCrumb(idx)">{{ node.label }}</text>

        </template>

      </view>

    </scroll-view>

    <scroll-view class="da-dropdown-picker-view is-drill" scroll-y>

      <view

        class="da-dropdown-picker-item"

        :class="item.checked ? 'is-actived' : ''"

        v-for="(item, idx) in drillCurrentList"

        :key="idx"

        @click="handleDrillSelect(item)">

        <text class="da-dropdown-picker-item--name">{{ item.label }}</text>

        <text class="da-dropdown-picker-item--icon" v-if="item.children && item.children.length"></text>

        <text class="da-dropdown-picker-item--check" v-if="item.checked && (!item.children || item.children.length === 0)" />

      </view>

    </scroll-view>

  </view>



  <!-- 多列并排模式（默认） -->

  <view class="da-dropdown-picker" v-else-if="viewCol.length">

    <view

      class="da-dropdown-picker-inner"

      v-for="(vc, vci) in viewCol"

      :key="vci">

      <scroll-view

        class="da-dropdown-picker-view"

        scroll-y>

        <view

          class="da-dropdown-picker-item"

          :class="vr.checked ? 'is-actived' : ''"

          v-for="(vr, vri) in viewRow[vci]"

          :key="vri"

          @click="handleSelect(vr, vci, vri)">

          <text class="da-dropdown-picker-item--name">{{ vr.label }}</text>

          <text class="da-dropdown-picker-item--icon" v-if="vr.children && vr.children.length"></text>

          <text class="da-dropdown-picker-item--check" v-if="vr.checked && (!vr.children || vr.children.length === 0)" />

        </view>

      </scroll-view>

    </view>

  </view>

</template>



<script setup>

import { ref, computed, watch } from 'vue'

import { createPickerState, createDrillPickerState, deepClone, getPickerMode, isAllValue } from '../utils'



const props = defineProps({

  dropdownItem: { type: Object, default: null },

  dropdownIndex: { type: Number },

})



const emit = defineEmits(['success'])



const viewCol = ref([])

const viewRow = ref([])

const drillStack = ref([])

const drillCurrentList = ref([])

const drillRootList = ref([])



const isDrillMode = computed(() => getPickerMode(props.dropdownItem) === 'drill')



function emitPickerSuccess(selected) {

  const menuProp = props.dropdownItem?.prop

  if (!menuProp) {

    console.error(`菜单项${props.dropdownItem?.title}未定义prop，返回内容失败`)

    return

  }

  const value = deepClone(selected)

  emit('success', { [menuProp]: value }, value, props.dropdownIndex)

}



function syncPickerState() {

  if (isDrillMode.value) {

    const state = createDrillPickerState(props.dropdownItem?.options, props.dropdownItem?.value)

    drillStack.value = state.stack

    drillCurrentList.value = state.currentList

    drillRootList.value = state.rootList

    return

  }



  const state = createPickerState(props.dropdownItem?.options, props.dropdownItem?.value)

  viewCol.value = state.viewCol

  viewRow.value = state.viewRow

}



function handleDrillSelect(item) {

  drillCurrentList.value.forEach(k => {

    k.checked = false

  })

  item.checked = true



  if (item.children?.length) {

    drillStack.value.push(item)

    drillCurrentList.value = deepClone(item.children)

    return

  }



  const selected = drillStack.value.map(n => n.value).concat(item.value)

  if (isAllValue(item.value) || isAllValue(selected)) {

    emitPickerSuccess([item.value])

    return

  }

  emitPickerSuccess(selected)

}



function handleDrillCrumb(index) {

  if (index === -1) {

    drillStack.value = []

    drillCurrentList.value = deepClone(drillRootList.value)

    return

  }



  drillStack.value = drillStack.value.slice(0, index + 1)

  const node = drillStack.value[index]

  drillCurrentList.value = deepClone(node?.children || [])

}



function handleSelect(item, colIndex, _rowIndex) {

  let lastItem = false

  viewCol.value.splice(colIndex)

  viewCol.value[colIndex] = item.value



  if (viewRow.value[colIndex]?.length) {

    viewRow.value[colIndex].forEach(k => {

      k.checked = false

    })

  }



  item.checked = true

  const list = item?.children || null



  if (list?.length) {

    viewCol.value[colIndex + 1] = 'tmpValue'

    viewRow.value[colIndex + 1] = list

    lastItem = false

  } else {

    lastItem = true

  }



  if (viewRow.value[colIndex + 1]?.length) {

    viewRow.value[colIndex + 1].forEach(k => {

      k.checked = false

    })

  }



  if (lastItem) {

    emitPickerSuccess(viewCol.value)

  }

}



watch(() => props.dropdownItem?.options, syncPickerState, { deep: true })

watch(() => props.dropdownItem?.value, syncPickerState)

watch(() => getPickerMode(props.dropdownItem), syncPickerState)



syncPickerState()

</script>



<style lang="scss" scoped>

.da-dropdown-picker {

  display: flex;

  width: 100%;

  max-height: 60vh;

  overflow: hidden;

  line-height: 1;



  &.is-drill {

    flex-direction: column;

  }



  &-breadcrumb {

    flex-shrink: 0;

    width: 100%;

    border-bottom: 1px solid #eee;



    &-inner {

      display: inline-flex;

      align-items: center;

      max-width: 100%;

      padding: 20rpx 24rpx;

      white-space: nowrap;

    }



    &-item {

      flex-shrink: 0;

      font-size: 24rpx;

      color: var(--dropdown-theme-color);



      &.is-last {

        color: var(--dropdown-text-color);

      }

    }



    &-sep {

      flex-shrink: 0;

      margin: 0 8rpx;

      font-size: 22rpx;

      color: #c9cdd4;

    }

  }



  &-inner {

    flex-grow: 1;

  }



  &-view {

    display: flex;



    /* #ifdef MP-ALIPAY */

    flex-direction: column;

    flex-wrap: wrap;



    /* #endif */



    width: 100%;

    height: 100%;



    &.is-drill {

      max-height: calc(60vh - 72rpx);

    }



    + .da-dropdown-picker-view {

      border-left: 1px solid #eee;

    }

  }



  &-item {

    display: flex;

    align-items: center;

    justify-content: space-between;

    padding: 24rpx;

    font-size: 24rpx;

    color: var(--dropdown-text-color);

    text-align: left;



    &--icon {

      width: 24rpx;

      height: 24rpx;



      &::after {

        /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */

        font-family: 'da-dropdown-iconfont' !important;

        font-size: 24rpx;

        font-style: normal;

        content: '\e643';

        -webkit-font-smoothing: antialiased;

        -moz-osx-font-smoothing: grayscale;

      }

    }



    &--check {

      flex-shrink: 0;

      width: 24rpx;

      height: 24rpx;



      &::after {

        /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */

        font-family: 'da-dropdown-iconfont' !important;

        font-size: 24rpx;

        font-style: normal;

        content: '\e696';

        -webkit-font-smoothing: antialiased;

        -moz-osx-font-smoothing: grayscale;

      }

    }



    &.is-actived {

      color: var(--dropdown-theme-color);

    }

  }

}

</style>


