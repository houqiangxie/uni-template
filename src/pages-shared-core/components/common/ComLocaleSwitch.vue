<script setup lang="ts">
import type { LocaleType } from '@/locale/types'

const props = withDefaults(defineProps<{
  /** 展示模式：cell 列表项 / button 按钮 */
  mode?: 'cell' | 'button'
}>(), {
  mode: 'cell',
})

const { t } = useI18n()
const localeStore = useLocaleStore()

const currentLabel = computed(() => localeStore.currentOption.label)

function handleSelect(locale: LocaleType) {
  localeStore.setLocale(locale)
  uni.showToast({
    title: t('common.success'),
    icon: 'success',
  })
}

function openPicker() {
  const itemList = localeStore.localeOptions.map(item => item.label)
  uni.showActionSheet({
    itemList,
    success: (res) => {
      const selected = localeStore.localeOptions[res.tapIndex]
      if (selected)
        handleSelect(selected.value)
    },
  })
}
</script>

<template>
  <!-- 列表项模式 -->
  <view v-if="enableI18n && mode === 'cell'" class="locale-cell" @click="openPicker">
    <view class="locale-cell__left">
      <text class="locale-cell__icon">
        🌐
      </text>
      <text class="locale-cell__label">
        {{ t('common.language') }}
      </text>
    </view>
    <view class="locale-cell__right">
      <text class="locale-cell__value">
        {{ currentLabel }}
      </text>
      <wd-icon name="arrow-right" size="16px" color="#999" />
    </view>
  </view>

  <!-- 按钮模式 -->
  <view v-else-if="enableI18n" class="locale-button" @click="openPicker">
    <text class="locale-button__icon">
      🌐
    </text>
    <text class="locale-button__text">
      {{ currentLabel }}
    </text>
  </view>
</template>

<style lang="scss" scoped>
.locale-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 32rpx;
  background: #fff;
  border-radius: 16rpx;

  &__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__icon {
    font-size: 32rpx;
  }

  &__label {
    font-size: 28rpx;
    color: #333;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__value {
    font-size: 26rpx;
    color: #999;
  }
}

.locale-button {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 32rpx;

  &__icon {
    font-size: 28rpx;
  }

  &__text {
    font-size: 24rpx;
    color: #fff;
  }
}
</style>
