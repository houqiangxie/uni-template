<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "首页",
    "showLeftButton": false
  }
}
</route>

<script setup lang="ts">
import { appTitle, enableI18n } from '@/utils/config'

const router = useRouter()
const userStore = useUserStore()

const isLoggedIn = computed(() => !!userStore.userInfo?.token)

function goLogin() {
  router.push({ path: '/pages/login/index' })
}

function goFormDemo() {
  router.push({ path: '/pages-test/pages/form-demo/index' })
}

function goChunkUploadDemo() {
  router.push({ path: '/pages-test/pages/chunk-upload-demo/index' })
}

function goUploadCenterDemo() {
  router.push({ path: '/pages-test/pages/upload-center-demo/index' })
}

function goComSelectDemo() {
  router.push({ path: '/pages-test/pages/com-select-demo/index' })
}

async function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (!res.confirm)
        return
      await userStore.logout()
      uni.showToast({ title: '已退出登录', icon: 'success' })
    },
  })
}
</script>

<template>
  <view class="home">
    <view class="home-header">
      <view class="home-title">{{ appTitle }}</view>
      <view class="home-slogan">开箱即用的 uni-app 基础模板</view>
    </view>

    <view v-if="enableI18n" class="home-card">
      <ComLocaleSwitch />
    </view>

    <view class="home-card home-info">
      <view class="home-info__label">当前状态</view>
      <view v-if="isLoggedIn" class="home-info__value">
        {{ userStore.userInfo?.info?.username || userStore.userInfo?.info?.nickName || '已登录' }}
      </view>
      <view v-else class="home-info__value home-info__value--muted">
        未登录
      </view>
    </view>

    <view class="home-card home-demos">
      <view class="home-demos__title">示例页面</view>
      <wd-cell title="表单示例" is-link @click="goFormDemo" />
      <wd-cell title="大文件上传" is-link @click="goChunkUploadDemo" />
      <wd-cell title="上传中心" is-link @click="goUploadCenterDemo" />
      <wd-cell title="ComSelect 本地分页" is-link @click="goComSelectDemo" />
    </view>

    <view class="home-actions">
      <wd-button v-if="!isLoggedIn" type="primary" block @click="goLogin">
        登录
      </wd-button>
      <wd-button v-else block @click="handleLogout">
        退出
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.home {
  min-height: 100%;
  padding: 32rpx;
  background: #f5f7fa;
}

.home-header {
  margin-bottom: 32rpx;
  padding: 48rpx 16rpx 24rpx;
  text-align: center;
}

.home-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #1d2129;
}

.home-slogan {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #86909c;
}

.home-card {
  margin-bottom: 24rpx;
  overflow: hidden;
  border-radius: 16rpx;
}

.home-info {
  padding: 32rpx;
  background: #fff;

  &__label {
    margin-bottom: 12rpx;
    font-size: 24rpx;
    color: #86909c;
  }

  &__value {
    font-size: 30rpx;
    color: #1d2129;

    &--muted {
      color: #86909c;
    }
  }
}

.home-demos {
  overflow: hidden;
  background: #fff;

  &__title {
    padding: 24rpx 32rpx 8rpx;
    font-size: 24rpx;
    color: #86909c;
  }
}

.home-actions {
  margin-top: 48rpx;
}
</style>
