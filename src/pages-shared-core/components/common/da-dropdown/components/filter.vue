<template>
  <view class="da-dropdown-filter">
    <scroll-view class="max-h-80" scroll-y>
      <view v-for="(item, index) in filterList" :key="item.prop || index" class="da-dropdown-filter-box">
        <template v-if="!item.hidden">
          <view class="da-dropdown-filter--title">
            {{ item.title }}
          </view>
          <view class="da-dropdown-filter-content">
            <FilterField :item="item" />
          </view>
        </template>
      </view>
    </scroll-view>
    <PartDropdownFooter
      :reset-text="dropdownItem.resetText"
      :confirm-text="dropdownItem.confirmText"
      @reset="handleReset"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script setup>
import { buildFilterResult, createFilterList } from '../utils'

const props = defineProps({
  dropdownItem: { type: Object, default: null },
  dropdownIndex: { type: Number },
})
const emit = defineEmits(['success'])
const filterList = ref([])
function syncFilterList(mode = 'current') {
  filterList.value = createFilterList(props.dropdownItem, mode)
}
function handleReset() {
  syncFilterList('reset')
}
function handleConfirm() {
  const menuProp = props.dropdownItem?.prop
  if (!menuProp) {
    console.error(`菜单项${props.dropdownItem?.title}未定义prop，返回内容失败`)
    return
  }
  const result = buildFilterResult(filterList.value)
  emit('success', { [menuProp]: result }, result, props.dropdownIndex)
}
watch(
  () => props.dropdownItem?.options,
  () => syncFilterList('current'),
  { deep: true },
)
watch(
  () => props.dropdownItem?.value,
  () => syncFilterList('current'),
  { deep: true },
)
syncFilterList('current')
</script>

<style lang="scss" scoped>
.da-dropdown-filter {
  &-box {
    padding: 0 24rpx;
    line-height: 1;
  }
  &--title {
    flex-shrink: 0;
    padding: 20rpx 0;
    font-size: 26rpx;
    color: var(--dropdown-text-color);
    white-space: nowrap;
  }
  &-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 10px;
  }
}
</style>
