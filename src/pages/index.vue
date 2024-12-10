<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:35
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-12-10 15:50:01
-->

<template>
  <view m="t-5">
    <!-- <wd-form ref="form" :model="formModel">
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
      </view>
    </wd-form> -->
    <CodeInput v-model="formModel.code"  customString="测*的**司*" />
  </view>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "首页",
    "app-plus": {
      "bounce": "none", //关闭窗口回弹效果
      "titleNView": {
        "backButton": { //自定义 backButton
          "background": "#fff"
        }
      }
    }
  }
}
</route>

<script setup lang="tsx">
const value = ref('')
const router = useRouter()
const formModel = reactive({sex:[], fileList :{name:23,url:'3333'},code:''})
const form = ref()
const handleSubmit = async() => {
  // const e= await form.value.validate()
  // console.log('e: ', e);
  console.log(formModel)
}

</script>