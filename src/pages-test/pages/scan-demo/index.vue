<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "扫码示例"
  }
}
</route>

<script setup lang="ts">
import { scanCode, scanCodeFromImage } from '@/composables/useScanCode'

const lastResult = ref('')
const lastError = ref('')

async function runScan(task: () => Promise<{ result: string }>) {
  lastError.value = ''
  try {
    const res = await task()
    lastResult.value = res.result
    uni.showToast({ title: '识别成功', icon: 'success' })
  }
  catch (err: any) {
    lastError.value = err?.message || '识别失败'
    const ignored = ['用户取消扫码', '用户取消选图']
    if (!ignored.includes(lastError.value)) {
      uni.showToast({ title: lastError.value, icon: 'none' })
    }
  }
}

function handleScanBoth() {
  runScan(async () => scanCode({ mode: 'both' }))
}

function handleScanCamera() {
  runScan(async () => scanCode({ mode: 'camera' }))
}

function handleScanImage() {
  runScan(async () => scanCodeFromImage())
}
</script>

<template>
  <view class="scan-demo">
    <view class="scan-demo__card">
      <view class="scan-demo__title">跨端扫码</view>
      <view class="scan-demo__desc">
        三端统一 API：相册 / 图片 jsQR 多码点选。H5 / 微信小程序相机为自定义界面（扫描线 + jsQR）；App 等仍走 uni.scanCode 原生页。
      </view>

      <wd-button type="primary" block @click="handleScanBoth">
        扫码（相机 + 相册）
      </wd-button>
      <wd-button block custom-class="scan-demo__btn" @click="handleScanCamera">
        仅相机扫码
      </wd-button>
      <wd-button block custom-class="scan-demo__btn" @click="handleScanImage">
        图片识别（仅相册）
      </wd-button>
    </view>

    <view v-if="lastResult" class="scan-demo__card">
      <view class="scan-demo__label">最近识别结果</view>
      <view class="scan-demo__result">{{ lastResult }}</view>
    </view>

    <view v-if="lastError && !['用户取消扫码', '用户取消选图'].includes(lastError)" class="scan-demo__error">
      {{ lastError }}
    </view>
  </view>
</template>

<style lang="scss" scoped>
.scan-demo {
  min-height: 100%;
  padding: 32rpx;
  background: #f5f7fa;

  &__card {
    margin-bottom: 24rpx;
    padding: 32rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  &__title {
    margin-bottom: 12rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: #1d2129;
  }

  &__desc {
    margin-bottom: 32rpx;
    font-size: 26rpx;
    line-height: 1.6;
    color: #86909c;
  }

  &__btn {
    margin-top: 24rpx;
  }

  &__label {
    margin-bottom: 12rpx;
    font-size: 24rpx;
    color: #86909c;
  }

  &__result {
    font-size: 28rpx;
    line-height: 1.6;
    color: #1d2129;
    word-break: break-all;
  }

  &__error {
    padding: 24rpx 32rpx;
    font-size: 26rpx;
    color: #f53f3f;
  }
}
</style>
