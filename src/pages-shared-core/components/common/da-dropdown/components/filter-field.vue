<template>
  <view class="da-dropdown-filter-field">
    <!-- 单选 -->
    <block v-if="item.type === 'radio'">
      <view
        v-for="(opt, optIdx) in item.options"
        :key="optIdx"
        class="da-dropdown-filter-item da-dropdown-tag"
        :class="item.value === opt.value ? 'is-actived' : ''"
        @click="handleRadioChange(opt)"
      >
        <text class="da-dropdown-tag--text">{{ opt.label }}</text>
      </view>
    </block>
    <!-- 多选 -->
    <block v-else-if="item.type === 'checkbox'">
      <view
        v-for="(opt, optIdx) in item.options"
        :key="optIdx"
        class="da-dropdown-filter-item da-dropdown-tag"
        :class="opt.isActived ? 'is-actived' : ''"
        @click="handleCheckboxChange(opt)"
      >
        <text class="da-dropdown-tag--text">{{ opt.label }}</text>
      </view>
    </block>
    <!-- 滑块 -->
    <block v-else-if="item.type === 'slider'">
      <slider
        style="width: 100%"
        :value="item.value"
        :min="sliderProps.min || 0"
        :max="sliderProps.max || 100"
        :step="sliderProps.step || 1"
        :activeColor="sliderProps.activeColor"
        :show-value="sliderProps.showValue"
        @change="handleSliderChange"
      />
    </block>
    <view v-else-if="item.type === 'com-select'" class="w-full flex items-center gap-2" :class="{ 'is-auto-open': autoOpen }">
      <view class="flex-1 min-w-0 bg-[#f5f5f5] rounded-2xl px-2 py-1">
        <ComSelect
          ref="comSelectRef"
          v-model="item.value"
          :columns="item.options"
          show-search
          embedded
          v-bind="componentProps"
          @change="handleSelectChange"
          @cancel="handlePopupCancel"
        />
      </view>
      <view
        v-if="componentProps.linkText"
        class="link-text text-xs"
        @click.stop="handleLink(componentProps.linkUrl)"
      >
        {{ componentProps.linkText }}
      </view>
    </view>
    <view v-else-if="item.type === 'com-tree'" class="bg-[#f5f5f5] rounded-2xl w-full px-2 py-1" :class="{ 'is-auto-open': autoOpen }">
      <com-tree
        ref="treeRef"
        v-model="item.value"
        :options="item.options"
        show-search
        embedded
        v-bind="componentProps"
        @change="handleSelectChange"
        @cancel="handlePopupCancel"
      />
    </view>
    <view v-else-if="item.type === 'date-picker'" class="w-full rounded-50 overflow-hidden" :class="{ 'is-auto-open': autoOpen }">
      <ComDateTimeRangeSelect
        ref="datePickerRef"
        v-model="item.value"
        type="date"
        :clearable="false"
        bgColor="#f5f5f5"
        v-bind="componentProps"
        class="!mx-0"
        @change="handleDateChange"
        @cancel="handlePopupCancel"
      />
    </view>
    <view v-else-if="item.type === 'search'" class="w-full">
      <Search
        v-model="item.value"
        v-bind="componentProps"
        class="search-boxss rounded-12 !bg-[#f5f5f5] !mx-0"
      />
    </view>
    <view
      v-else-if="item.type === 'input-range'"
      class="flex items-center gap-1 vertical level w-full px-2 border-box"
    >
      <wd-input v-model="item.value[0]" type="decimal" no-border @input="handleInputRangeChange(0)" />
      ~
      <wd-input v-model="item.value[1]" type="decimal" no-border @input="handleInputRangeChange(1)" />
    </view>
  </view>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { isFieldPopupType } from '../utils'

const props = defineProps({
  item: { type: Object, required: true },
  /** 选完即确认（顶层 com-select / radio 等，等同 cell） */
  instantConfirm: { type: Boolean, default: false },
  /** 顶层独立使用时，挂载后自动打开组件弹层 */
  autoOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['change', 'cancel'])

const comSelectRef = ref()
const treeRef = ref()
const datePickerRef = ref()

const componentProps = computed(() => props.item?.componentProps || props.item?.componentProp || {})
const sliderProps = computed(() => componentProps.value)

function formatNumber(val) {
  val = val.replace(/[^\d.]/g, '')
  val = val.replace(/\.{2,}/g, '.')
  val = val.replace('.', '#').replace(/\./g, '').replace('#', '.')
  val = val.replace(/^(\d+)(\.\d{0,4})?.*$/, '$1$2')
  return val
}

function emitChange() {
  emit('change', props.item.value)
}

function handleRadioChange(opt) {
  props.item.value = props.item.value === opt.value ? null : opt.value
  if (props.instantConfirm) {
    emitChange()
  }
}

function handleCheckboxChange(opt) {
  if (!Array.isArray(props.item.value)) {
    props.item.value = []
  }
  if (opt.isActived) {
    opt.isActived = false
    const idx = props.item.value.findIndex(k => k === opt.value)
    if (idx > -1) {
      props.item.value.splice(idx, 1)
    }
  } else {
    opt.isActived = true
    props.item.value.push(opt.value)
  }
}

function handleSliderChange(event) {
  props.item.value = event.detail.value
}

function handleSelectChange(v) {
  if (v?.value !== undefined) {
    props.item.value = v.value
  } else if (v !== undefined) {
    props.item.value = v
  }
  if (props.instantConfirm) {
    emitChange()
  }
}

function handleDateChange(v) {
  props.item.value = v
  if (props.instantConfirm) {
    emitChange()
  }
}

function handleLink(url) {
  if (url) {
    uni.navigateTo({ url })
  }
}

function handleInputRangeChange(index) {
  props.item.value[index] = formatNumber(props.item.value[index] || '')
}

function handlePopupCancel() {
  emit('cancel')
}

function openFieldPopup() {
  if (!props.autoOpen || !isFieldPopupType(props.item?.type)) {
    return
  }

  nextTick(() => {
    switch (props.item.type) {
      case 'com-select':
        comSelectRef.value?.open?.()
        break
      case 'com-tree':
        treeRef.value?.open?.()
        break
      case 'date-picker':
        datePickerRef.value?.open?.()
        break
    }
  })
}

onMounted(openFieldPopup)
</script>

<style lang="scss" scoped>
.da-dropdown-filter-field {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
  width: 100%;

  .search-boxss {
    --wot-search-input-bg: #f5f5f5 !important;
  }

  .link-text {
    color: var(--dropdown-theme-color);
  }

  .is-auto-open {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }
}

.da-dropdown-tag {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  overflow: hidden;
  font-size: 14px;
  color: var(--dropdown-text-color);
  background-color: #f5f5f5;
  border-radius: 16px;

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
