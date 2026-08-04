<template>

  <view class="da-dropdown-daterange-box">

    <view class="da-dropdown-daterange">

      <uni-datetime-picker

        v-model="pickerValue"

        type="daterange"

        :clear-icon="false"

        custom-class="w-full da-dropdown-daterange-picker"

        v-bind="componentProps"

        @change="handlePickerChange"

      >

        <view class="da-dropdown-daterange-inner">

          <view class="da-dropdown-daterange--date" :class="daterange.start ? 'is-actived' : ''">

            {{ daterange.start || '请选择日期' }}

          </view>

          <view class="da-dropdown-daterange--separate">至</view>

          <view class="da-dropdown-daterange--date" :class="daterange.end ? 'is-actived' : ''">

            {{ daterange.end || '请选择日期' }}

          </view>

        </view>

      </uni-datetime-picker>

    </view>

    <view class="da-dropdown-daterange-tags" v-if="dropdownItem.showQuick">

      <block v-for="tag in dateTagList" :key="tag.value">

        <view class="da-dropdown-tag" :class="datetag === tag.value ? 'is-actived' : ''"

          @click="handleTagDate(tag.value)">

          <text class="da-dropdown-tag--text">{{ tag.label }}</text>

        </view>

      </block>

    </view>

    <PartDropdownFooter

      :resetText="dropdownItem.resetText"

      :confirmText="dropdownItem.confirmText"

      @reset="handleReset"

      @confirm="handleConfirm"

    />

  </view>

</template>



<script setup>

import { computed, ref, watch } from 'vue'

import { createDaterangeState, deepClone, getRangeDate, hasDaterangeValue } from '../utils'

import PartDropdownFooter from './part-dropdown-footer.vue'



const props = defineProps({

  dropdownItem: { type: Object, default: null },

  dropdownIndex: { type: Number },

})



const emit = defineEmits(['success'])



const daterange = ref({ start: '', end: '' })

const pickerValue = ref([])

const datetag = ref('')

const dateTagList = [

  { value: '-7', label: '本周' },

  { value: '-14', label: '上周' },

  { value: '-30', label: '本月' },

  { value: '-60', label: '上月' },

  { value: '7', label: '近7天' },

  { value: '15', label: '近15天' },

  { value: '30', label: '近30天' },

]



const componentProps = computed(() => props.dropdownItem?.componentProps || props.dropdownItem?.componentProp || {})



function toPickerValue(range) {

  if (range?.start && range?.end) {

    return [range.start, range.end]

  }

  return []

}



function fromPickerValue(value) {

  if (Array.isArray(value) && value.length >= 2 && value[0] && value[1]) {

    return { start: value[0], end: value[1] }

  }

  return { start: '', end: '' }

}



function syncDaterange(mode = 'current') {

  const state = createDaterangeState(props.dropdownItem, mode)

  daterange.value = state.daterange

  pickerValue.value = toPickerValue(state.daterange)

  datetag.value = state.datetag

}



function handlePickerChange(value) {

  pickerValue.value = Array.isArray(value) ? value : []

  daterange.value = fromPickerValue(pickerValue.value)

  datetag.value = ''

}



function handleTagDate(code) {

  daterange.value = getRangeDate(code)

  pickerValue.value = toPickerValue(daterange.value)

  datetag.value = code

}



function handleReset() {

  syncDaterange('reset')

}



function handleConfirm() {

  const menuProp = props.dropdownItem?.prop

  if (!menuProp) {

    console.error(`菜单项${props.dropdownItem?.title}未定义prop，返回内容失败`)

    return

  }



  const result = hasDaterangeValue(daterange.value) ? deepClone(daterange.value) : { start: '', end: '' }

  emit('success', { [menuProp]: result }, result, props.dropdownIndex)

}



watch(() => props.dropdownItem?.value, () => syncDaterange('current'), { deep: true })



syncDaterange('current')

</script>



<style lang="scss" scoped>

// 日期范围

.da-dropdown-daterange {

  margin: 24rpx;

  background-color: #f5f5f5;

  border-radius: 999rpx;



  &-picker {

    width: 100%;

  }



  &-inner {

    display: flex;

    align-items: center;

    width: 100%;

  }



  &--date {

    flex-grow: 1;

    height: 66rpx;

    padding: 0 24rpx;

    font-size: 26rpx;

    line-height: 66rpx;

    color: var(--dropdown-text-color);

    text-align: center;

    border-radius: 4rpx;



    &.is-actived {

      color: var(--dropdown-theme-color);

    }

  }



  &--separate {

    flex-shrink: 0;

    padding: 0 20rpx;

  }



  &-tags {

    display: flex;

    flex-wrap: wrap;

    justify-content: flex-start;

    padding: 0 24rpx;

  }

}



.da-dropdown-tag {

  position: relative;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 20rpx 40rpx;

  margin-right: 20rpx;

  margin-bottom: 20rpx;

  overflow: hidden;

  font-size: 28rpx;

  color: var(--dropdown-text-color);

  background-color: #f5f5f5;

  border-radius: 999rpx;



  &--text {

    position: relative;

    z-index: 1;

  }



  &.is-actived {

    color: var(--dropdown-theme-color);

    background-color: #fff;



    &::after {

      position: absolute;

      top: 0;

      right: 0;

      bottom: 0;

      left: 0;

      z-index: 0;

      content: '';

      background-color: var(--dropdown-theme-color);

      opacity: 0.05;

    }

  }

}

</style>


