<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:35
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 16:25:33
-->

<template>
  <view m="t-5">
    <template v-slot:header>
      <view>ndsdds</view>
    </template>
    <wd-form ref="form" :model="formModel">
      <wd-cell-group border>
        <wd-cell title="你说呢" title-width="100px" prop="sex" required>
          <ComSelect :columns="econNatureList" v-model="formModel.sex" multiple />
        </wd-cell>
        <wd-input label="用户名" label-width="100px" prop="value1" clearable v-model="formModel.value1"
          placeholder="请输入用户名" :rules="[{ required: true, message: '请填写用户名' }]" />
        <wd-input label="密码" label-width="100px" prop="value2" show-password clearable v-model="formModel.value2"
          placeholder="请输入密码" :rules="[{ required: true, message: '请填写密码' }]" />
      </wd-cell-group>
      <view class="footer">
        <wd-button type="primary" size="large" @click="handleSubmit" block>提交</wd-button>
        <wd-button type="primary" size="large" @click="toPage">提交</wd-button>
      </view>
    </wd-form>
  </view>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "首页",
  },
}
</route>

<script setup lang="tsx">
const value = ref('')
const router = useRouter()
const formModel = reactive({ sex: [], fileList: { name: 23, url: '3333' } })
const form = ref()
const handleSubmit = async () => {
  const e = await form.value.validate()
  console.log('e: ', e);
}
const toPage = async () => {
  router.push('/pages-sub/pages/index2')
}
onShow(() => {
  // #ifdef MP-WEIXIN
  uni.hideHomeButton()
  // #endif
})
</script>