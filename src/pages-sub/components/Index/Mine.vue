<script setup>
const router = useRouter()
const scrollHeight = ref(0)
const userInfo=useUserStore().userInfo??{}
const labels = ref(['主要负责人', '安全管理员', '特种作业人员'])
const list = [
  {
    name: '修改密码',
    path: '/pages-sub1/user/password',
    icon: 'user/password.png',
  },
  {
    name: '常规问题',
    path: '/pages-sub1/user/problem',
    icon: 'user/problem.png',
  },
  // {
  //   name: '企业切换',
  //   path: '',
  //   icon: 'user/switch.png',
  // },
  {
    name: '扫一扫',
    // path: '/pages-sub1/user/dangerous',
    icon: 'user/scan.png',
    type:'scan'
  },
]

function handleJump(url,item) {
  if (!url && item.type == 'scan') {
    // uni.navigateTo({
    //   url: '/pages-sub1/areaManage/index?id=5fbf50e5ef6e11ee92d0286ed4895cf9&pId=4887635545c14984af823'
    // })
    // return
    return uni.scanCode({
      success: function (res) {
        const url = res.result
        if (url && url.includes('pages')) {
          let path = '/pages' + (url.includes('sub') ? '' : '-sub1') + url.split('pages')[1]
          path=path+(path.includes('?')?'&':'?')+'plate=wx'
          router.push(path)
        } else {
          uni.showToast({
            title: '请扫描正确的二维码',
            icon: 'none'
          })
        }
      },
      fail: function (res) {
        uni.showToast({
          title: '扫描失败',
          icon: 'none'
        })
      }
    });
  } else {
    
    
    url && router.push(url)
  }
}

function loginOut() {
  uni.removeStorageSync('user')
  uni.reLaunch({ url: '/pages-sub1/login/index' })
}

</script>

<template>
  <view class="user" >
    <view class="user-header">
      <CustomImg src="user/user.png" class="user-avatar !w-10 !h-10" />
      <view class="user-info">
        <text class="user-name">
          {{ userInfo.loginUserName }}
          <text class="user-name-remark">
            ({{ userInfo.userFlag === 1 ? '超级管理员' : '普通用户' }})
          </text>
        </text>
        <view class="user-label">
          <view v-for="item in labels" :key="item" class="item">
            {{ item }}
          </view>
        </view>
        <span class="company-name">{{ userInfo.enterpriseName }}</span>
      </view>
    </view>
    <view class="content">
      <view class="list">
        <wd-cell-group border>
        <wd-cell v-for="(item, index) in list" :key="item.name" @click="handleJump(item.path,item)" is-link custom-class="pr-4" custom-value-class="pr-0">
          <template #title>
            <view class="flex items-center">
              <CustomImg :src="item.icon" width="22px" height="22px" />
              <text class="ml-[6px]">
                {{ item.name }}
              </text>
            </view>
          </template>
        </wd-cell>
        </wd-cell-group>
      </view>
      <view class="list mt-[14px]">
        <wd-cell  is-link custom-class="pr-4" custom-value-class="pr-0" @click="loginOut">
          <template #title>
            <view class="flex items-center">
              <CustomImg src="user/exit.png" width="22px" height="22px" />
              <text class="ml-[6px]">
                退出登录
              </text>
            </view>
          </template>
        </wd-cell>
      </view>
    </view>
  </view>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "我的",
  },
  layout:'tab'
}
</route>

<style lang="scss" scoped>
.user {
  width: 100vw;
  display: flex;
  flex-direction: column;
  // height: calc(100vh - 94px);
  position: relative;

  &-header {
    width: 100vw;
    padding-top: 32px;
    padding-left: 28px;
    height: 122px;
    background: #1575ff;
    display: flex;
    position: absolute;
    z-index: 1;
  }

  &-avatar {
    width: 92rpx;
    height: 92rpx;
    border-radius: 50%;
    background: #ffffff;
    margin-right: 28rpx;
  }

  &-info {
    display: flex;
    flex-direction: column;

    .user-name {
      height: 22px;
      font-size: 16px;
      font-family: PingFangSC, PingFang SC;
      font-weight: 500;
      color: #ffffff;
      line-height: 22px;
      text-align: left;

      .user-name-remark {
        height: 17px;
        font-size: 12px;
        font-family: PingFangSC, PingFang SC;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.8);
        line-height: 17px;
      }
    }

    .user-label {
      margin-top: 5px;
      display: flex;
      justify-content: space-between;

      .item {
        width: 72px;
        height: 18px;
        background: rgba(#000, 0.2);
        margin-right: 2px;
        text-align: center;
        line-height: 18px;
        border-radius: 4px;
        font-size: 10px;
        font-family: PingFangSC, PingFang SC;
        font-weight: 400;
        color: #ffffff;
      }
    }

    .company-name {
      margin-top: 5px;
      height: 17px;
      font-size: 12px;
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      color: #ffffff;
      line-height: 17px;
      text-align: left;
    }
  }

  .content {
    width: 750rpx;
    // height: 344rpx;
    background: #f5f6f8;
    border-radius: 32rpx 32rpx 0rpx 0rpx;
    position: absolute;
    left: 0;
    top: 110px;
    z-index: 2;
    flex: 1;

    .list {
      margin: 42rpx 24rpx;
      // width: 694rpx;
      box-sizing: border-box;
      overflow: hidden;
      background: #FFFFFF;
      box-shadow: 0rpx 4rpx 12rpx 0rpx rgba(172, 172, 172, 0.1);
      border-radius: 12rpx;

      .item {
        text-align: left;
        height: 50px;
        line-height: 50px;
        position: relative;
        padding-left: 12px;
        padding-right: 10px;
        display: flex;
        justify-content: space-between;

      }
      .border-line {
        position: absolute;
        bottom: 0;
        left: 20px;
      }
    }
  }
  ::v-deep .wd-cell__wrapper{
    padding-right: 0;
  }
}
</style>
