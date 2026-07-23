<route>
  {
    "style": {
      "navigationStyle": "custom",
      "hideNavbar": true,
    }
  }
  </route>

<script setup>
import { onMounted } from "vue";
import logoImg from "@/static/logo.png";

const { t } = useI18n()
const router = useRouter();
const userStore = useUserStore();
const form = reactive({
  username: "",
  password: "",
});
const codes = ref("");
const codeUrl = ref("");
const showPassword = ref(false);

function customBlurValidate(prop) {
  if (prop == "password" || prop == "username") form[prop] = form[prop]?.trim();
  // 自定义表单不需要WOT表单验证
}

// 表单验证函数
function validateForm() {
  if (!form.username?.trim()) {
    uni.showToast({
      title: t('login.usernameRequired'),
      icon: 'none'
    });
    return false;
  }
  if (!form.password?.trim()) {
    uni.showToast({
      title: t('login.passwordRequired'),
      icon: 'none'
    });
    return false;
  }
  if (!form.captchaCode?.trim()) {
    uni.showToast({
      title: t('login.captchaRequired'),
      icon: 'none'
    });
    return false;
  }
  return true;
}
/** 将后端 base64 验证码图片转为 data URL */
function toCaptchaDataUrl(img) {
  if (!img)
    return ''
  if (img.startsWith('data:'))
    return img
  const mime = img.startsWith('/9j/') ? 'image/jpeg' : img.startsWith('R0lGOD') ? 'image/gif' : 'image/png'
  return `data:${mime};base64,${img}`
}
function getCode() {
  getAuthCode().then((res) => {
    const data = res.data ?? {}
    codeUrl.value = toCaptchaDataUrl(data.authImg)
    form.captchaKey = data.uuid;
    form.captchaCode = "";
  });
}

function login() {
  // 使用自定义验证
  if (!validateForm()) {
    return;
  }
  // 执行登录逻辑
  const data = JSON.parse(JSON.stringify(form));
  data.password = encryptAes128(data.password);
  loginUser(data).then(async (res) => {
    if (res) {
      userStore.setUserInfo({
        token: res.data.token
      });
      const {data: info } = await getInfo()
      userStore.setUserInfo({
        info,
        token: res.data.token,
      });
      nextTick(() => {
        router.replace({
          path: returnUrl || '/pages/index',
        })
      })
    }
  }).catch((error) => {
    console.log('登录失败', error);
  }).finally(() => {
    // 无论成功还是失败，都刷新验证码
    getCode();
  });
}

onMounted(() => {
  // if (import.meta.env.DEV) {
  //   // this.form.username = '深圳森丰真空镀膜有限公司'
  //   // form.username = '深圳巨涛机械设备有限公司'
  //   // // this.form.password = 'Qyjgzf@3349'
  //   // form.password = 'Aa@1159359'
  // }
  uni.removeStorageSync("tab");
  getCode();
});

let returnUrl = "";
onLoad((option) => {
  returnUrl = option.returnUrl ? decodeURIComponent(option.returnUrl) : "";
});

</script>

<template>
  <view class="login-container">
    <!-- 语言切换 -->
    <view class="login-locale">
      <ComLocaleSwitch mode="button" />
    </view>

    <!-- 顶部品牌标识区 -->
    <view class="brand-section">
      <!-- Logo -->
      <view class="logo-wrapper">
        <image :src="logoImg" class="logo" />
      </view>

      <!-- 主标题 -->
      <view class="main-title">
        {{ t('login.brandTitle') }}
      </view>

      <!-- 副标题 -->
      <view class="sub-title">
        {{ t('login.brandSubtitle') }}
      </view>
    </view>

    <!-- 中部登录表单区 -->
    <view class="form-section">
      <!-- 用户名输入框 -->
      <view class="input-wrapper">
        <view class="input-container">
          <wd-icon name="user" class="input-icon" />
          <input
            v-model="form.username"
            type="text"
            :placeholder="t('login.usernameRequired')"
            class="custom-input"
            @blur="customBlurValidate('username')"
            @confirm="login"
          />
        </view>
      </view>

      <!-- 密码输入框 -->
      <view class="input-wrapper">
        <view class="input-container">
          <wd-icon name="lock" class="input-icon" size="28rpx" color="#999" />
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="t('login.passwordPlaceholder')"
            class="custom-input"
            @blur="customBlurValidate('password')"
            @confirm="login"
          />
          <wd-icon
            :name="showPassword ? 'eye' : 'eye-invisible'"
            class="password-toggle"
            size="28rpx"
            color="#999"
            @click="showPassword = !showPassword"
          />
        </view>
      </view>

      <!-- 验证码输入区 -->
      <view class="input-wrapper">
        <view class="captcha-container">
          <!-- 左侧验证码输入框 -->
          <view class="captcha-input-container">
            <wd-icon name="check-circle" class="input-icon" />
            <input
              v-model="form.captchaCode"
              type="text"
              :placeholder="t('login.captchaRequired')"
              class="custom-input captcha-input"
              @blur="customBlurValidate('captchaCode')"
              @confirm="login"
            />
          </view>

          <!-- 右侧验证码展示区 -->
          <view class="captcha-display" @click="getCode">
            <image :src="codeUrl" class="captcha-img" />
          </view>
        </view>
      </view>
    </view>

    <!-- 底部登录按钮 -->
    <view class="button-section">
      <wd-button
        type="primary"
        size="large"
        block
        @click="login"
        custom-class="login-button"
      >
        {{ t('login.login') }}
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.custom-input {
  // background-color: red;
}

.login-container {
  min-height: 100vh;
  background: #1891ff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 60rpx;
  box-sizing: border-box;
  position: relative;
}

.login-locale {
  position: absolute;
  top: 40rpx;
  right: 40rpx;
  z-index: 10;
}

/* 顶部品牌标识区 */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 150rpx;

  .logo-wrapper {
    margin-bottom: 50rpx;

    .logo {
      width: 180rpx;
      height: 180rpx;
      border-radius: 50%;
    }
  }

  .main-title {
    font-size: 52rpx;
    font-weight: bold;
    color: #FFFFFF;
    text-align: center;
    margin-bottom: 32rpx;
    line-height: 1.4;
  }

  .sub-title {
    font-size: 32rpx;
    color: #FFFFFF;
    text-align: center;
    // margin-bottom: 80rpx;
  }
}

/* 中部登录表单区 */
.form-section {
  width: 90%;
  margin-bottom: 60rpx;
  margin-top: 80rpx; /* 距离副标题约1.2倍高度 */

  .input-wrapper {
    margin-bottom: 40rpx; /* 输入框间距约为输入框高度的0.7倍 */

    .input-container {
      position: relative;
      // width: 100%;
      height: 88rpx;
      background: #FFFFFF;
      // border: 2rpx solid #E5E5E5;
      border-radius: 5rpx;
      display: flex;
      align-items: center;
      padding: 0 30rpx;

      .input-icon {
        color: #999999;
        font-size: 28rpx;
        margin-right: 20rpx;
        flex-shrink: 0;
      }

      .custom-input {
        flex: 1;
        height: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 28rpx;
        color: #333333;

        &::placeholder {
          color: #999999;
        }
      }

      .password-toggle {
        color: #999999;
        font-size: 28rpx;
        margin-left: 20rpx;
        flex-shrink: 0;
        cursor: pointer;
      }
    }
  }

  /* 验证码容器特殊样式 */
  .captcha-container {
    display: flex;
    align-items: center;
    gap: 20rpx; /* 无间隙 */

    .captcha-input-container {
      flex: 1; /* 占2/3宽度 */
      height: 88rpx;
      background: #FFFFFF;
      // border: 2rpx solid #E5E5E5;
      border-radius: 5rpx; /* 左侧圆角 */
      display: flex;
      align-items: center;
      padding: 0 30rpx;

      .input-icon {
        color: #999999;
        font-size: 28rpx;
        margin-right: 20rpx;
        flex-shrink: 0;
      }

      .captcha-input {
        flex: 1;
        height: 100%;
        border: none;
        outline: none;
        background: transparent;
        font-size: 28rpx;
        color: #333333;

        &::placeholder {
          color: #999999;
        }
      }
    }

    .captcha-display {
      flex: 1; /* 占1/3宽度 */
      height: 88rpx;
      // background: #F5F5F5;
      // border: 2rpx solid #E5E5E5;
      border-left: none; /* 与输入框无缝连接 */
      border-radius: 0 20rpx 20rpx 0; /* 右侧圆角 */
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      // gap: 20rpx;

      &:active {
        background: #E8E8E8;
      }

      .captcha-img {
        width: 100%;
        height: 100%;
        // height: 60rpx;
        border-radius: 8rpx;
      }
    }
  }
}

/* 底部登录按钮 */
.button-section {
  width: 90%;

  :deep(.login-button) {
    background: #1d2569 !important;
    border: none !important;
    border-radius: 50rpx !important;
    height: 92rpx !important;
    font-size: 32rpx !important;
    font-weight: bold !important;
    color: #FFFFFF !important;
    box-shadow: 0 8rpx 16rpx rgba(21, 101, 192, 0.3) !important;
  }
}
</style>
