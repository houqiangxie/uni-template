<template>
  <view class="da-dropdown-field">
    <scroll-view v-if="needScroll" class="max-h-80" scroll-y>
      <view class="da-dropdown-field-body">
        <FilterField
          :item="fieldItem"
          :instant-confirm="instantConfirm"
          :auto-open="autoOpen"
          @change="handleInstantChange"
          @cancel="handlePopupCancel"
        />
      </view>
    </scroll-view>
    <view v-else class="da-dropdown-field-body" :class="{ 'is-instant': instantConfirm, 'is-popup': autoOpen }">
      <FilterField
        :item="fieldItem"
        :instant-confirm="instantConfirm"
        :auto-open="autoOpen"
        @change="handleInstantChange"
        @cancel="handlePopupCancel"
      />
    </view>
    <PartDropdownFooter
      v-if="showFooter"
      :reset-text="dropdownItem.resetText"
      :confirm-text="dropdownItem.confirmText"
      @reset="handleReset"
      @confirm="handleConfirm"
    />
  </view>
</template>

<script setup>
import { createStandaloneFieldItem, getFieldConfirmValue, isFieldInstantConfirmType, isFieldPopupType } from '../utils'

const props = defineProps({
  dropdownItem: { type: Object, default: null },
  dropdownIndex: { type: Number },
})

const emit = defineEmits(['success', 'cancel'])

const fieldItem = ref(createStandaloneFieldItem(props.dropdownItem, 'current'))

const instantConfirm = computed(() => isFieldInstantConfirmType(props.dropdownItem?.type))
const autoOpen = computed(() => isFieldPopupType(props.dropdownItem?.type))
const showFooter = computed(() => !instantConfirm.value)
const needScroll = computed(() => {
  const type = props.dropdownItem?.type
  return type === 'checkbox' || (type === 'radio' && !instantConfirm.value)
})

function syncField(mode = 'current') {
  fieldItem.value = createStandaloneFieldItem(props.dropdownItem, mode)
}

function emitSuccess() {
  const menuProp = props.dropdownItem?.prop
  if (!menuProp) {
    console.error(`菜单项${props.dropdownItem?.title}未定义prop，返回内容失败`)
    return
  }

  const result = getFieldConfirmValue(fieldItem.value)
  emit('success', { [menuProp]: result }, result, props.dropdownIndex)
}

function handleReset() {
  syncField('reset')
}

function handleConfirm() {
  emitSuccess()
}

function handleInstantChange() {
  if (instantConfirm.value)
    emitSuccess()
}

function handlePopupCancel() {
  emit('cancel')
}

watch(
  () => props.dropdownItem?.options,
  () => syncField('current'),
  { deep: true },
)

watch(
  () => props.dropdownItem?.value,
  () => syncField('current'),
  { deep: true },
)

syncField('current')
</script>

<style lang="scss" scoped>
.da-dropdown-field {
  &-body {
    padding: 16rpx 24rpx 0;

    &.is-instant {
      padding: 24rpx;
    }

    &.is-popup {
      height: 0;
      min-height: 0;
      padding: 0;
      overflow: hidden;
    }
  }
}
</style>
