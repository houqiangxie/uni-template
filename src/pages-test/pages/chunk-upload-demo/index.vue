<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "大文件上传"
  }
}
</route>

<script setup lang="ts">
import { configToSchema } from '@/utils/formConfig'
import { useForm } from '@/composables/useForm'
import { destroyChunkUploadSession } from '@/composables/useChunkUpload'

const { t } = useI18n()

const formModel = reactive({
  attachments: [] as Record<string, any>[],
  images: null as Record<string, any> | null,
})

const uploadConfig = computed(() => [
  {
    prop: 'attachments',
    label: t('chunkUploadDemo.fields.attachments'),
    compType: 'chunk-upload',
    required: true,
    limit: 5,
    accept: 'all',
    maxSize: 500,
    multiple: true,
    chunkSize: 2 * 1024 * 1024,
    maxRetry: 3,
    autoUpload: false,
    sessionId: 'demo-attachments',
    persistOnNavigate: true,
    persistQueue: true,
  },
  {
    prop: 'images',
    label: t('chunkUploadDemo.fields.images'),
    compType: 'chunk-upload',
    limit: 1,
    accept: 'image',
    maxSize: 50,
    multiple: false,
    chunkSize: 1024 * 1024,
    autoUpload: true,
  },
])

const schema = computed(() => configToSchema(() => uploadConfig.value))

const { scrollTop, formRef, validate } = useForm()

async function handleSubmit() {
  const valid = await validate()
  if (!valid)
    return

  uni.showModal({
    title: t('chunkUploadDemo.submitSuccess'),
    content: JSON.stringify(formModel, null, 2),
    showCancel: false,
  })
}

function handleReset() {
  destroyChunkUploadSession('demo-attachments')
  formModel.attachments = []
  formModel.images = null
}
</script>

<template>
  <view class="chunk-upload-demo card-form h-full overflow-auto">
    <view class="chunk-upload-demo__intro">
      {{ t('chunkUploadDemo.intro') }}
    </view>

    <scroll-view class="container" scroll-y :scroll-top="scrollTop" scroll-with-animation>
      <wd-form ref="formRef" :model="formModel" :schema="schema" layout="horizontal" title-width="auto">
        <view class="chunk-upload-demo__section">
          <view class="chunk-upload-demo__section-title">
            {{ t('chunkUploadDemo.sections.upload') }}
          </view>
          <com-form :config="uploadConfig" :form="formModel" embedded />
        </view>
      </wd-form>
    </scroll-view>

    <view class="footer-box">
      <wd-button type="primary" @click="handleSubmit">
        {{ t('common.submit') }}
      </wd-button>
      <wd-button custom-class="chunk-upload-demo__reset-btn" @click="handleReset">
        {{ t('common.reset') }}
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.chunk-upload-demo {
  display: flex;
  flex-direction: column;
  height: 100%;
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
    overflow: hidden;
    background: #fff;
    border-radius: 16rpx;
  }

  &__section-title {
    padding: 24rpx 24rpx 8rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #1d2129;
  }

  :deep(.chunk-upload-demo__reset-btn) {
    margin-top: 0 !important;
  }
}
</style>
