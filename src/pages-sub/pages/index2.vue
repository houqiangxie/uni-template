<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:35
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 15:14:54
-->

<template>
  <view m="t-5">
    <wd-form ref="form" :model="formModel">
      <view class="footer">
        <wd-button type="primary" size="large" @click="toPage" block>提交</wd-button>
      </view>
    </wd-form>
  </view>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "fuye",
    "app-plus": {
      "bounce": "none", //关闭窗口回弹效果
      "titleNView": {
        "backButton": { //自定义 backButton
          "background": "#fff"
        }
      }
    }
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
  router.push('/pages-sub/pages/index')
}
onShow(() => {
  // #ifdef MP-WEIXIN
  // uni.hideHomeButton()
  // #endif
})
</script>