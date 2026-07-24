<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "上传中心"
  }
}
</route>

<script setup lang="ts">
import { destroyChunkUploadSession } from '@/composables/useChunkUpload'

const { t } = useI18n()
const router = useRouter()

const UPLOAD_SESSION_ID = 'upload-center-demo'

const fileList = ref<Record<string, any>[]>([])

function goHome() {
  router.push({ path: '/pages/index' })
}

function handleClear() {
  uni.showModal({
    title: t('common.tip'),
    content: t('uploadCenterDemo.clearConfirm'),
    success: (res) => {
      if (!res.confirm)
        return
      destroyChunkUploadSession(UPLOAD_SESSION_ID)
      fileList.value = []
    },
  })
}
</script>

<template>
  <view class="upload-center-demo">
    <view class="upload-center-demo__intro">
      {{ t('uploadCenterDemo.intro') }}
    </view>

    <view class="upload-center-demo__section">
      <view class="upload-center-demo__section-title">
        {{ t('uploadCenterDemo.sections.upload') }}
      </view>
      <ComChunkUpload
        v-model="fileList"
        accept="all"
        :limit="10"
        :max-size="500"
        multiple
        :chunk-size="2 * 1024 * 1024"
        :max-retry="3"
        :auto-upload="false"
        :session-id="UPLOAD_SESSION_ID"
        persist-on-navigate
        persist-queue
        show-overall-progress
      />
    </view>

    <view v-if="fileList.length" class="upload-center-demo__section">
      <view class="upload-center-demo__section-title">
        {{ t('uploadCenterDemo.sections.completed') }}
      </view>
      <view
        v-for="file in fileList"
        :key="file.fileId || file.filePath"
        class="upload-center-demo__file"
      >
        <text class="upload-center-demo__file-name">{{ file.fileName || file.name }}</text>
        <text class="upload-center-demo__file-id">{{ file.fileId || file.filePath }}</text>
      </view>
    </view>

    <view class="upload-center-demo__actions">
      <wd-button type="primary" plain block @click="goHome">
        {{ t('uploadCenterDemo.leavePage') }}
      </wd-button>
      <wd-button block @click="handleClear">
        {{ t('uploadCenterDemo.clearSession') }}
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.upload-center-demo {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 24rpx 24rpx 48rpx;
  background: #f5f7fa;
  box-sizing: border-box;

  &__intro {
    margin-bottom: 24rpx;
    padding: 24rpx;
    font-size: 26rpx;
    line-height: 1.6;
    color: #4e5969;
    background: #fff;
    border-radius: 16rpx;
  }

  &__section {
    margin-bottom: 24rpx;
    padding: 24rpx;
    background: #fff;
    border-radius: 16rpx;
  }

  &__section-title {
    margin-bottom: 16rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #1d2129;
  }

  &__file {
    display: flex;
    flex-direction: column;
    padding: 16rpx 0;

    & + & {
      border-top: 1px solid #f2f3f5;
    }
  }

  &__file-name {
    font-size: 26rpx;
    color: #1d2129;
  }

  &__file-id {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #86909c;
    word-break: break-all;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-top: auto;
  }
}
</style>
