<template>
  <view m="t-5">
    <wd-form ref="form" :model="formModel" :rules="rules">
      <wd-cell-group border>
        <wd-cell title="你说呢" title-width="100px" prop="sex" required>
          <ComSelect :columns="sexList" v-model="formModel.sex" showSearch multiple />
        </wd-cell>
        <wd-cell title="文件" title-width="100px" prop="fileList" required>
          <ComUpload v-model="formModel.fileList" multiple />
        </wd-cell>
        <wd-cell title="文件" title-width="100px" prop="fileList" required>
          <comTreePicker v-model="formModel.dd" :data="treeList" multiple onlyCheckSelf only-last-node showSearch/>
        </wd-cell>
        <wd-input label="用户名" label-width="100px" prop="value1" clearable v-model="formModel.value1"
          placeholder="请输入用户名" />
      </wd-cell-group>
      <view class="footer">
        <wd-button type="primary" size="large" @click="handleSubmit" block>提交</wd-button>
      </view>
    </wd-form>
  </view>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "测试",
  },
}
</route>

<script setup lang="tsx">
const router = useRouter()
const formModel = reactive({ sex: [], fileList: [] })
const rules={
    sex:[{ required: true, message: '请选择性别' }],
    fileList:[{ required: true, message: '请上传文件' }]
}
const sexList = [
  { text: '男dsddssddsds但是颠三倒四颠三倒四大萨达湿哒哒四大三', value: '1' },
  { text: '男dsddssddsds但是颠三倒四颠三倒四大萨达湿哒哒四大三', value: '21' },
]
const treeList = [
  {name:333,id:3,children:[
    {
      name: 333, id: 344, children: [
      { name: 333, id: 44, children: [{ name: 333, id: 55, children: [] }] },
      { name: 333, id: 5556, children: [] }
    ]}
  ]}
]
const form = ref()
const handleSubmit = async () => {
    console.log('formModel: ', formModel);
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