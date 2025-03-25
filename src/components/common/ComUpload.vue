<template>
  <wd-upload 
    v-model:fileList="previewList"
    :accept="accept" 
    :source-type="['camera', 'album']" 
    :capture="['camera', 'album']"
    :multiple="multiple" 
    :disabled="disabled"
    :before-upload ="beforeUpload" 
    :upload-method="customUpload">
  </wd-upload>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  accept: {
    type: String,
    default: 'image'
  },
  limit: {
    type: Number,
    default: 9
  },
  multiple: {
    type: Boolean,
    default: true
  },
  maxSize: {
    type: Number,
    default: 30
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:modelValue'])
let upUrl = ''
// #if H5
upUrl = '/gateway/upload'
// #endif
// #ifndef H5
upUrl = baseUrl + '/api/upload'
// #endif

const userInfo = useUserStore().userInfo

const acceptTypes = computed(() => {
  return props.accept === 'image' ? ['jpg', 'jpeg', 'png'] : []
})

const previewList = computed({
  get() {
    return (props.modelValue||[])?.map(item => {
      item.url = formatUrl(item.url)
    return item
  }).filter(v=>(v.status&&v.status==='success')||!v.status)
  },
  set(val) {
    emit('update:modelValue', val)
  }
})


function beforeUpload ({files,resolve}) {
  if (files.length + (props.modelValue?.length||0) > props.limit) {
    return uni.$toast.show(`最多上传${props.limit}张!`)
  }
  if (acceptTypes.value.length) {
    const correct = files.every(item => {
      const suffix = item.name.slice(item.name.lastIndexOf('.') + 1)
      return acceptTypes.value.includes(suffix)
    })
    if (!correct) {
      return uni.$toast.show('文件格式不正确!')
    }
  }
  const lt = files.every(item => item.size / 1024 / 1024 <= props.maxSize)
  if (!lt) {
    return uni.$toast.show(`上传文件不能超过 ${props.maxSize} MB!`)
  }
  resolve(true)
}


const customUpload = (file, formData, options) => {
  const uploadTask = uni.uploadFile({
    url: upUrl,
    header: {
      Authorization: userInfo?.token||'cfc4a676f704403ca684ac9cafcb0432'
    },
    name: 'fileUpload',
    fileName: options.name,
    fileType: options.fileType,
    formData,
    filePath: file.url,
    success(res) {
      const response = JSON.parse(res.data)
      const {data,code}=response
      if (res.statusCode === 200&&code===0) {
        // 设置上传成功
        file.url = data.newFileName
        file.name = data.uploadFileName
        options.onSuccess(data, file, formData)
      } else {
        // 设置上传失败
        options.onError({ ...res, errMsg: res.errMsg || '' }, file, formData)
      }
    },
    fail(err) {
      
      // 设置上传失败
      options.onError(err, file, formData)
    }
  })
  // 设置当前文件加载的百分比
  uploadTask.onProgressUpdate((res) => {
    options.onProgress(res, file)
  })
}

function getToken() {
  let token = null
  const str = uni.getStorageSync('user')
  if (str) {
    const user = JSON.parse(str)
    token = user?.userInfo?.token
  }
  return token
}

</script>

<style lang="scss" scoped></style>
