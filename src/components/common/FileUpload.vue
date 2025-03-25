<script lang="ts" setup>
let upUrl = ''
// #if H5
upUrl = '/gateway/upload'
// #endif
// #ifdef MP-WEIXIN
upUrl = baseUrl+ '/api/upload'
// #endif
const {
  modelValue = [],
  option = {
    // 上传服务器地址，需要替换为你的接口地址
    url: '', // 该地址非真实路径，需替换为你项目自己的接口地址
    // 上传附件的key
    name: 'fileUpload',
    // 根据你接口需求自定义请求头,默认不要写content-type,让浏览器自适配
    header: {
      // 示例参数可删除
      // 'Authorization': uni.getStorageSync("userInfo")?.token,
    },
    // 根据你接口需求自定义body参数
    formData: {
      // 'orderId': 1000
    },
  },
  // 选择文件后是否立即自动上传，true=选择后立即上传
  instantly = true,
  // 必传宽高且宽高应与slot宽高保持一致
  width = 60,
  height = 30,
  // 限制允许上传的格式，空串=不限制，默认为空
  formats = 'png,jpg,jpeg',
  // 文件上传大小限制
  size = 30,
  // 文件数量限制
  limit = 9,
  // 是否多选(一次选择多张图片)
  multiple = true,
  // 是否显示调试
  debug = false,
  // 不可编辑
  disabled = false,
  itemRef = {},
  isCamera = false,
  showTip = false,
  alignRight=false,
} = defineProps<{ option?: any; instantly?: boolean; width?: number; height?: number; size?: number; limit?: number; multiple?: boolean; debug?: boolean; formats?: string; disabled?: boolean; itemRef?: any; modelValue: any; isCamera?: boolean; showTip?: boolean, alignRight?:boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', payload: any): void
  (e: 'change', payload: any): void
}>()
if(!option.url) option.url=upUrl

// 转换file字段
function transformObj(file) {
  file.url = file.url || file.fileUrl
  // #ifdef MP-WEIXIN
  if (file.url?.startsWith('/file')) file.url = baseUrl + file.url
  // #endif
  
  file.extname = file.url?.substring(file.url?.lastIndexOf('.') + 1) || ''
  
  file.name = file.fileName || file.name
  file.fileSize = file.fileSize || file.size
  file.progress = 100
  file.isImg = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].includes(file.extname.toLowerCase())
  // if (file.url?.startsWith('/file'))
  //   file.url = `/enterprise_h5${file.url}`
  file.previewUrl=formatUrl(file.url)
  return file
}

const fileList = computed({
  get() {
    if (modelValue)
      return Array.isArray(modelValue) ? modelValue.map(m => transformObj(m)) : [transformObj(modelValue)]
    else return []
  },
  set(value) {
    // const val = limit == 1 ? value[0] : value
    // emit('update:modelValue', val)
    // itemRef.onFieldChange(val)
  },
})
// 移除某个文件
function clear(index) {
  fileList.value.splice(index, 1)
  const val = limit == 1 ? fileList.value[0] : fileList.value
  emit('update:modelValue', val)
  emit('change', val)
  itemRef?.onFieldChange?.(val)
  // name=指定文件名，不传name默认移除所有文件
  // uploadFile.value.clear(name);
}
function download(item) {
  new Download(item.url, item.fileName)
}

function previewImg(file) {
  if (!file.isImg)
    return
  const urls = fileList.value.filter(item => item.isImg).map(item => item.previewUrl)
  const current = urls.findIndex(url => url === file.previewUrl) || 0
  uni.previewImage({
    urls,
    current,
    longPressActions: {
      itemList: ['发送给朋友', '保存图片', '收藏'],
      success(data) {

      },
      fail(err) {

      },
    },
  })
}

function handleUploadEnd(item,name) {
  // const responseText = JSON.parse(item.responseText)
  item.fileUrl = item.newFileName
  item.fileName = name||item.uploadFileName
  if (fileList.value.length < limit)fileList.value.push(transformObj(item))
  const val = limit == 1 ? fileList.value[0] : fileList.value
  emit('update:modelValue', val)
  emit('change', val)
  itemRef?.onFieldChange?.(val)
}

let canUpload = true

const afterRead=async(event) =>{
  let files = Array.isArray(event.file) ? event.file : [event.file]
  
  let fileTypeBool =true
  let fileSizeBool =true
  files.forEach(item => {
    let suffix = ''
    // #ifdef MP-WEIXIN
    suffix = item.url.slice(item.url.lastIndexOf('.') + 1)
    // #endif
    // #ifndef MP-WEIXIN
    suffix = item.name.slice(item.name.lastIndexOf('.') + 1)
    // #endif
    // let suffix = item.url.slice(item.url.lastIndexOf('.') + 1)
    // return this.acceptTypes.includes(suffix)
    // return this.acceptTypes.includes(suffix)
    if (formats && !formats.includes(suffix.toLowerCase())) {
      fileTypeBool=false
      uni.showToast({title:`不支持上传${suffix.toLowerCase()}格式文件`,icon:'none'})
      return false
    }
    // 限制文件大小
    if (item.size > 1024 * 1024 * Math.abs(size)) {
      fileSizeBool=false
      uni.showToast({title:`附件大小请勿超过${size}M`,icon:'none'})
      return false
    }
  })
  if(!fileTypeBool||!fileSizeBool)  return
  // let files = Array.isArray(event.file) ? event.file : [event.file]
  for (let i = 0; i < files.length; i++) {
    let item = files[i]
    
    uploadFileFunc(item.url,item.name)
    // 
    // fileList.value.push(transformObj(item))
    // const val = limit === 1 ? fileList.value[0] : fileList.value
    // emit('update:modelValue', val)
  }
}

const uploadFileFunc=(url,name)=> {
  let token = null
  const str = uni.getStorageSync('user')
  if (str) {
    const user = JSON.parse(str)
    token = user?.userInfo?.token
  }
  if (!token)
  token = uni.getStorageSync('userInfo')?.token
  uni.uploadFile({
    url: upUrl,
    filePath: url,
    name: 'fileUpload',
    header: {
      Authorization: token,
    },
    success: (res) => {
      const result = JSON.parse(res.data)
      handleUploadEnd(result.data,name)
    },
    fail: (err) => {
      
    }
  })
}

/**
 * ---可删除--演示在组件上方添加新内容DOM变化
 * DOM重排演示，重排后组件内部updated默认会触发show方法,若特殊情况未能触发updated也可以手动调用一次show()
 * 什么是DOM重排？自行百度去
 */
// add() {
//     this.list.push('DOM重排测试');
//     // App端如在自定义组件内使用则需要页面插入新内容后调用show()来重新定位
//     // this.$nextTick(()=>{
//     // 	this.$refs['lsjUpload'+this.tabIndex].show();
//     // })
// }
</script>

<template>
  <view class="w-full overflow-hidden">
    <up-upload v-if="!disabled && limit > fileList?.length" :source-type="['camera', 'album']" :capture="['camera', 'album']"
      :multiple="limit > 1 ? multiple : false" useBeforeRead  @afterRead="afterRead">
    </up-upload>
    <view v-if="showTip && !disabled && limit > fileList?.length" class="my-1 text-xs">
      请上传大小不超过 <text class="text-[#f00]">
        {{ size }}MB
      </text>,格式为<text class="text-[#f00]">
        {{ formats }}
      </text>的文件,最多上传<text class="text-[#f00]">
        {{ limit }}
      </text>个
    </view>

    <view class="w-full flex flex-wrap pt-1">
      <template v-for="(item, index) in fileList" :key="index">
        <view
          v-if="item.isImg" class="relative m-1 h-15 w-15 border-1 border-[#eee] rounded border-dotted"
        >
          <image :src="item.url" class="h-full w-full" @click="previewImg(item)"/>
          <view v-if="!disabled" class="right-[1px] top-[1px] !absolute">
            <up-icon
               name="close-circle" color="#f00" 
              @click="clear(index)"
            />
          </view>
        </view>
      </template>
    </view>
    <template v-for="(item, index) in fileList" :key="index">
      <view v-if="!item.isImg" class="box-border w-full flex justify-between leading-8">
        <view class="flex flex-1 items-center" @click="previewImg(item)">
          <view class="max-w-50 flex-1 truncate">
            {{ item.name }}
          </view>
        </view>
        <view class="max-w-12 flex items-center">
          <up-icon v-if="disabled" name="download" color="#999" @click="download(item)" />
          <up-icon v-if="!disabled" name="close-circle" color="#f00" @click="clear(index)" />
        </view>
      </view>
    </template>
  </view>
</template>
