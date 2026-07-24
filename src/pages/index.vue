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
const { t } = useI18n()
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

async function handleLogout() {
  uni.showModal({
    title: t('common.tip'),
    content: t('common.logoutConfirm'),
    success: async (res) => {
      if (!res.confirm)
        return
      await userStore.logout()
      uni.showToast({ title: t('common.logoutSuccess'), icon: 'success' })
    },
  })
}
</script>

<template>
  <view class="home">
    <view class="home-header">
      <view class="home-title">{{ t('app.name') }}</view>
      <view class="home-slogan">{{ t('app.slogan') }}</view>
    </view>

    <view class="home-card">
      <ComLocaleSwitch />
    </view>

    <view class="home-card home-info">
      <view class="home-info__label">{{ t('home.welcome') }}</view>
      <view v-if="isLoggedIn" class="home-info__value">
        {{ userStore.userInfo?.info?.username || userStore.userInfo?.info?.nickName || t('home.loggedIn') }}
      </view>
      <view v-else class="home-info__value home-info__value--muted">
        {{ t('home.notLoggedIn') }}
      </view>
    </view>

    <view class="home-card home-demos">
      <view class="home-demos__title">{{ t('home.demos') }}</view>
      <wd-cell :title="t('home.formDemo')" is-link @click="goFormDemo" />
      <wd-cell :title="t('home.chunkUploadDemo')" is-link @click="goChunkUploadDemo" />
      <wd-cell :title="t('home.uploadCenterDemo')" is-link @click="goUploadCenterDemo" />
    </view>

    <view class="home-actions">
      <wd-button v-if="!isLoggedIn" type="primary" block @click="goLogin">
        {{ t('login.login') }}
      </wd-button>
      <wd-button v-else block @click="handleLogout">
        {{ t('common.logout') }}
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
