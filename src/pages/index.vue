<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:35
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-14 10:59:48
-->
<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:35
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-08 18:13:29
-->

<template>
  <div m="t-5">
    <CommonForm :config="config" v-model:formModel="formModel" ref="form"/>
    <!-- <uni-forms :modelValue="formModel">
      <FileUpload v-model="formModel.fileList" />
    </uni-forms> -->
    <!-- <Sign v-model="formModel.url" showMode="vertical"></Sign> -->
      <nut-button type="primary" @click="submit">主要按钮</nut-button>
  </div>
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
const formModel = reactive({sex:1, fileList :{name:23,url:'3333'}})
const config = reactive([
  {
    label: '大多数', key: 'ee', component: 'input', required: true, on: {
      'update:modelValue': (e) => {
        console.log('e: ', e);
    
  }} },
  { label: '大多数', key: '555', component: 'fileUpload', required: true, },
  { label: '性别', key: 'sex', component: 'selectPlus', required: true,bind:{ columns:sexList} },
])
const form = ref()
const submit = async() => {
  const e= await form.value.validate()
  console.log('e: ', e);
}
</script>