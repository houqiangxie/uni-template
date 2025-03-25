<route>
  {
    layout:'custom'
  }
  </route>

<script setup>
import { onMounted } from 'vue'
const userStore = useUserStore()
const form = reactive({
  userName: '',
  pwd: '',
  authCode: '',
  uuid: '',
})
const codes = ref('')
const codeUrl = ref('')
function customBlurValidate(prop) {
  if (prop == 'pwd' || prop =='userName') form[prop]=form[prop]?.trim()
  loginForm.value.validate(prop).then(({ valid, errors }) => { })
}
const loginForm = ref(null)
function getCode() {
  getAuthCode().then((res) => {
    // codes.value = res.data.authCode
    codeUrl.value = `data:image/png;base64,${res.data?.authImg}`
    form.uuid = res.data.uuid
    form.authCode = ''
    if (import.meta.env.DEV)
      form.authCode = codes.value
  })
}
function login() {
  loginForm.value.validate().then(async ({ valid, errors }) => {
    if (valid) {
      // #ifdef MP-WEIXIN
      const { deviceId } = uni.getSystemInfoSync()
      form.deviceId = deviceId
      // #endif
      const data = JSON.parse(JSON.stringify(form))
      data.pwd = encryptAes128(data.pwd, 'jgzf;QIYE3316++=')
      const res = await loginUser(data).catch(() => {
        getCode()
      })
      if (res) {
        const obj = res.data
        userStore.setUserInfo(obj)
        // if (obj.userSonInfoVo && obj.userSonInfoVo.length >= 2) {
        //   uni.navigateTo({
        //     url: '/pages/workbench/switchCompany'
        //   })
        // } else {
        uni.redirectTo({
          url: returnUrl||'/pages/index/index',
        })
      }
    }
  })
}
onMounted(() => {
  // if (import.meta.env.DEV) {
  //   // this.form.userName = '深圳森丰真空镀膜有限公司'
  //   // form.userName = '深圳巨涛机械设备有限公司'
  //   // // this.form.pwd = 'Qyjgzf@3349'
  //   // form.pwd = 'Aa@1159359'
  // }
  uni.removeStorageSync('tab')
  getCode()
})
let returnUrl=''
onLoad((option) => {
  returnUrl =option.returnUrl?decodeURIComponent(option.returnUrl):''
})

const showPassWord = ref(false)
</script>

<template>
  <view class="login">
    <view class="top">
      <view class="left">
        <image :src="getUrl('login/hi.png')" style="width: 92rpx;height: 92rpx;" />
        <view class="welcome">
          欢迎使用
        </view>
      </view>
      <view class="right">
        <image :src="getUrl('login/build.png') " style="width: 284rpx;height: 256rpx;" />
      </view>
    </view>
    <view class="content">
      <wd-form ref="loginForm" :model="form">
        <wd-form-item label="用户名" prop="userName" :required="false" :rules="[{ required: true, message: '请输入用户名' }]">
          <wd-input v-model="form.userName" class="nut-input-text" placeholder="请输入用户名" type="text"
            @blur="customBlurValidate('userName')" />
        </wd-form-item>
        <wd-form-item label="密码" prop="pwd" :required="false" :rules="[{ required: true, message: '请输入您的密码' }]">
          <wd-input v-model="form.pwd" class="nut-input-text" placeholder="请输入密码" show-password type="text"
            @blur="customBlurValidate('pwd')" />
          <!-- <input v-model="form.pwd" class="nut-input-text" placeholder="请输入密码" v-else type="password"
            @blur="customBlurValidate('pwd')">
          <view @click="showPassWord = !showPassWord" class="absolute right-0 top-1 z-10">
            <up-icon :name="showPassWord?'eye-off':'eye-fill'"></up-icon>
          </view> -->
        </wd-form-item>
        <wd-form-item label="验证码" prop="authCode" class="code-item" :required="false"
          :rules="[{ required: true, message: '请输入验证码' }]">
          <wd-input v-model="form.authCode" class="nut-input-text" placeholder="请输入验证码" type="text"
            @blur="customBlurValidate('authCode')" />
          <view class="code-box">
            <img :src="codeUrl" class="login-code-img" @click="getCode">
          </view>
        </wd-form-item>
        <button class="login-btn" type="primary" @click="login">
          登 录
        </button>
      </wd-form>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login {
  .top {
    position: relative;
    height: 524rpx;
    background: linear-gradient(225deg, #4590FC 0%, #1575FF 100%);

    .left {
      position: absolute;
      top: 178rpx;
      left: 64rpx;

      .welcome {
        margin-top: 20rpx;
        font-size: 44rpx;
        font-weight: bold;
        color: #FFFFFF;
        line-height: 60rpx;
        letter-spacing: 2px;
      }
    }

    .right {
      position: absolute;
      top: 140rpx;
      right: 54rpx;
    }
  }

  .content {
    position: absolute;
    top: 396rpx;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 98rpx 80rpx 0;
    background: #fff;
    box-shadow: 0rpx -4rpx 24rpx 0rpx #3572CA;
    border-radius: 60rpx 60rpx 4rpx 4rpx;
    ::v-deep .wd-cell__wrapper{
      flex-direction: column;
      .wd-cell__left,.wd-cell__right{
        width: 100%;
      }
    }

    :deep(.nut-cell-group__wrap) {
      box-shadow: none;
      border-radius: none;
      background-color: transparent;
    }
    .code-box {
      position: absolute;
      right: 0;
      top: -30rpx;
      z-index: 10;

      .login-code-img {
        width: 200rpx;
        height: 70rpx;
      }
    }

    .login-btn {
      margin-top: 60rpx;
      height: 92rpx;
      background: #1575FF !important;
      border-radius: 50rpx;
      width: 100%;
    }
  }
}
</style>
