<template>
  <view>
    <wd-upload v-model:fileList="previewList" :accept="accept" :source-type="['camera', 'album']"
      :custom-evoke-class="{ 'opacity-0': disabled }" :capture="['camera', 'album']" :multiple="multiple"
      :before-preview="beforePreview" :disabled="disabled" :limit="disabled ? 1 : limit" :before-upload="beforeUpload"
      :upload-method="customUpload">
      <template #default>
        <view class="bg-[#f5f5f5] w-15 h-15 flex flex-col items-center justify-center">
          <wd-icon :name="accept == 'all' ? 'file' : 'camera-fill'" size="24px" color="#b8b8b8"/>
          <view class="mt-2 text-sm text-[#b8b8b8]">({{ previewList.length??0 }}/{{ limit }})</view>
        </view>
      </template>
    </wd-upload>
    <wd-root-portal>
      <wd-img-cropper style="z-index: 10000" v-model="cropperShow" :img-src="cropperSrc" :aspect-ratio="aspectRatio"
        @confirm="handleConfirmUpload" @cancel="handleCancel">
      </wd-img-cropper>
    </wd-root-portal>
  </view>
</template>

<script setup>
const router = useRouter()
defineOptions({
  inheritAttrs: false,
})
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
    type: [Number, String],
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
  },
  // 是否压缩
  compress: {
    type: Boolean,
    default: false
  },
  // 是否裁减
  cropper: {
    type: Boolean,
    default: false
  },
  // 裁减比例
  aspectRatio: {
    type: String,
    default: '16:9'
  },
})
const emit = defineEmits(['update:modelValue', 'change'])
let upUrl = (useUserStore().userType == 1 ? '' : '/jgzf') + '/api/system/sys/file/upload'
// #ifndef H5
upUrl = baseUrl + upUrl
// #endif

const userInfo = useUserStore().userInfo

const acceptTypes = computed(() => {
  return props.accept === 'image' ? ['jpg', 'jpeg', 'png', 'heif', 'heic', 'jfif'] : []
})

const previewList = computed({
  get() {
    if (!props.modelValue || (props.modelValue && Object.keys(props.modelValue).length == 0)) return []
    return (Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]).map(item => {
      item.name = item.name || item.fileName
      item.fileName = item.fileName || item.name
      item.fileId = item.fileId || item.filePath || item.fileUrl || item.url || item.id
      item.filePath = item.filePath || item.fileId || item.fileUrl
      item.fileUrl = item.fileUrl || item.filePath || item.fileId
      item.url = formatUrl(item.fileId, '', item.fileName?.toLowerCase().match(/\.(mp4)$/))
      return item
    }).filter(v => (v.status && v.status !== 'fail') || !v.status)
  },
  set(val) {
    const vals=val?.filter(v => (v.status && v.status !== 'fail') || !v.status)
    const value = props.limit == 1 ? vals[0] : vals
    emit('update:modelValue', value)
    emit('change', value)
  }
})

const beforePreview = ({ file, resolve }) => {
  const isVideo = file.fileName?.toLowerCase()?.match(/\.(mp4)$/)
  const isImage = acceptTypes.value.length ? acceptTypes.value.includes(file.name?.slice(file.name.lastIndexOf('.') + 1)?.toLowerCase()) : file.name?.toLowerCase().match(/\.(jpg|jpeg|png|heif|heic|jfif)$/)
  if (isImage || isVideo) {
    resolve(true)
  } else {
    new Download(file.url, file.name,false)
    resolve(false)
  }
}


function beforeUpload({ files }) {
  if (files.length + (props.modelValue?.length || 0) > props.limit) {
    uni.$toast.show(`最多上传${props.limit}张!`)
    return false
  }
  if (acceptTypes.value.length) {
    const correct = files.every(item => {
      const suffix = item.name ? item.name.slice(item.name.lastIndexOf('.') + 1) : item.path ? item.path.slice(item.path.lastIndexOf('.') + 1) : item.url.slice(item.url.lastIndexOf('.') + 1)
      return acceptTypes.value.includes(suffix?.toLowerCase())
    })
    if (!correct) {
      uni.$toast.show('文件格式不正确!')
      return false
    }
  }
  const lt = files.every(item => item.size / 1024 / 1024 <= props.maxSize)
  if (!lt) {
    uni.$toast.show(`上传文件不能超过 ${props.maxSize} MB!`)
    return false
  }
  if (props.cropper) {
    cropperSrc.value = files[0].path
    cropperShow.value = true
    return false
  }
  return true
}


const customUpload = async (file, formData, options) => {
  let method = 'uploadFile'
  let url=''
  let uploadConfig = {
    url: upUrl,
    header: {
      Authorization: userInfo?.token,
      platformType,
    },
  }
  let compressed = null
  if (props.accept === 'image') {
    compressed = await compressSingle(file, props.compress ? { quality: 20, targetKB: 100, qualityMin: 0.2 } : { quality: 40, targetKB: 300 })
    url = compressed?.url || file.url
  }
  // #ifdef H5
  // 3. 构造 FormData
  // H5 下使用 FormData 上传，需要把本地 URL 或 dataURL 转为 Blob/File
  method = 'request'
  const form = new FormData()
  // helper: 将 dataURL 或 URL 转为 Blob
  const toBlob = async (url) => {
    if (!url) return null
    // dataURL (base64)
    if (url.startsWith && url.startsWith('data:')) {
      const arr = url.split(',')
      const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'application/octet-stream'
      const bstr = atob(arr[1] || '')
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: mime })
    }
    // 其它 URL：fetch 并取 blob（支持本地临时文件或远程地址）
    const resp = await fetch(url)
    return await resp.blob()
  }

  const filename = (compressed?.name) || file.name || file.fileName || (file.url && file.url.split('/').pop()) || 'file'
  const fileObj = compressed?.file
  if (fileObj) {
    form.append('file', fileObj, filename)
  } else {
    const blob = await toBlob(url || file.url)
    if (blob) form.append('file', blob, filename)
  }
  form.append('uploadSource', useUserStore().userType == 1 ? '2' : '1')
  uploadConfig.data = form
  uploadConfig.method = 'POST'
  // 不要手动设置 Content-Type，浏览器会自动添加 boundary
  if (uploadConfig.header && uploadConfig.header['Content-Type']) {
    delete uploadConfig.header['Content-Type']
  }
  
  // #endif
  // #ifndef  H5
  uploadConfig = {
    ...uploadConfig,
    name: 'file',
    filePath: url || file.url,
    formData: {
      uploadSource: useUserStore().userType == 1 ? '2' : '1',
    },
  }
  // #endif
  // 抽取 success / fail 处理，使得 H5 可用 XHR 复用相同逻辑
  const handleSuccess = (res) => {
    // res 结构：{ statusCode, data }
    let response
    try {
      response = JSON.parse(res.data)
    } catch (e) {
      response = { data: null, code: res.statusCode }
    }
    const { data, code } = response || {}
    if (res.statusCode === 200 && code === 200) {
      // 设置上传成功
      file.fileId = data.id
      file.name = data.fileName
      file.fileName = data.fileName
      file.filePath = data.id
      if (props.cropper) {
        previewList.value.push(file)
        const value = props.limit == 1 ? previewList.value[0] : previewList.value
        emit('update:modelValue', value)
        emit('change', value)
        return
      }
      options?.onSuccess(data, file, formData)
    } else {
      uni.$notify.showNotify({
        type: 'danger',
        message: code == 401 ? '登录已过期,请重新登录' : response?.message || '上传失败',
        safeHeight: uni.getSystemInfoSync().statusBarHeight
      })
      // 设置上传失败
      options?.onError({ ...res, errMsg: res.errMsg || '' }, file, formData)
      if (code === 401) {
        router.replace('/pages/login/index')
      }
    }
  }

  const handleFail = (err) => {
    options?.onError(err, file, formData)
  }

  let uploadTask = null
  if (method === 'request') {
    // H5: 使用原生 XMLHttpRequest 发送 FormData，确保文件字段被正确提交，并支持进度回调
    const xhr = new XMLHttpRequest()
    xhr.open(uploadConfig.method || 'POST', uploadConfig.url, true)
    // 设置 headers（Authorization 等）
    const headers = uploadConfig.header || {}
    Object.keys(headers).forEach((k) => {
      // 不设置 Content-Type，让浏览器自动加 boundary
      if (k.toLowerCase() === 'content-type') return
      try { xhr.setRequestHeader(k, headers[k]) } catch (e) { /* ignore */ }
    })
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        const res = { statusCode: xhr.status, data: xhr.responseText }
        if (xhr.status >= 200 && xhr.status < 300) {
          handleSuccess(res)
        } else {
          handleFail(res)
        }
      }
    }
    xhr.onerror = function (e) {
      handleFail(e)
    }
    // 进度
    uploadTask = {
      onProgressUpdate(cb) {
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) {
            cb({ progress: Math.floor((e.loaded / e.total) * 100), totalBytesSent: e.loaded, totalBytesExpectedToSend: e.total })
          } else {
            cb({ progress: 0 })
          }
        }
      },
      abort() { xhr.abort() }
    }
    xhr.send(uploadConfig.data)
  } else {
    uploadTask = uni[method]({
      ...uploadConfig,
      success(res) { handleSuccess(res) },
      fail(err) { handleFail(err) }
    })
  }

  // 设置当前文件加载的百分比
  uploadTask && uploadTask.onProgressUpdate && uploadTask.onProgressUpdate((res) => {
    options?.onProgress?.(res, file)
  })
}


const cropperShow = ref(false)
const cropperSrc = ref('')
const handleConfirmUpload = (e) => {
  customUpload({ url: e.tempFilePath }, {}, { name: 'file' })
}
</script>

<style lang="scss" scoped></style>
