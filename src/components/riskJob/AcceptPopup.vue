<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-24 18:12:36
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-10 10:40:17
-->
<script lang='ts' setup>
import { ref, reactive } from 'vue'
const route = useRoute()
const router = useRouter()
const popup = ref()
const emit = defineEmits(['submit'])

const options = ref({
  title: '',
  titleColor: '#4384f5',
  placeholder: '请输入',
  flowOpinion: ''
})

const bindTextAreaBlur = (e) => {
  console.log(e.detail.value)
}

const cancel = () => {
  popup.value.close()
}

const submit = async () => {
  if(!options.value.flowOpinion) return uni.showToast({title: options.value.placeholder})
  emit('submit', options.value)
  popup.value.close()
  // router.replace({ path: '/pages/riskJob/index', query: { ...route.query, type: Number(route.query.type) + 1 } })
  // uni.showToast({title:options.value+'成功'})
}

const open = (data) => {
  popup.value.open('bottom')
  options.value = data
}

defineExpose({
  open
})
</script>

<template>
  <uni-popup ref="popup" background-color="#fff">
    <view class="popup-content" style="height: 200px">
      <view m="2" style="height: 20px;">
        <view class="button" p="2" type="default" size="mini" plain
          style="float: left; border: none; font-size: 12px; color: #333;" @click="cancel">取消</view>
        <view class="button b-none" p="2" type="primary" size="mini" plain
          style="float: right; border: none; font-size: 12px; color: #4384f5;" @click="submit">提交</view>
        <view :style="{ textAlign: 'center', color: options.titleColor }">{{ options.title }}</view>
      </view>
      <view p="2">
        <textarea v-model="options.flowOpinion" @blur="bindTextAreaBlur" :placeholder="options.placeholder"
          style="width: 100%; height: 180px; color: #000; font-size: 12px;" />
      </view>
    </view>
  </uni-popup>
</template>

<style lang='scss' scoped></style>