<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-18 08:58:42
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-02-28 16:28:14
-->


<template>
  <view class="w-full overflow-hidden">
    <nut-uploader
      v-if="!readonly && limit > fileList?.length"
      :url="option.url"
      :width="width"
      :height="height"
      :maximum="limit"
      :multiple="limit>1"
      :maximize="maximize"
      :before-upload="beforeXhrUpload"
      @oversize="onOversize"
    >
      <view :style="{ width: `${width - 2}px`, height: `${height - 2}px`, border: '1px dotted #eee' }" class="flex items-center justify-center rounded">
        <nut-icon  name="uploader" color="#e3e0f6" ></nut-icon>
      </view>
    </nut-uploader>
    <view class="w-full flex flex-wrap pt-1">
      <template v-for="(item, index) in fileList" :key="index" >
        <view v-if="item.isImg" class="border-1 border-dotted border-[#eee] rounded w-15 h-15 m-1 relative" @click="previewFile(item)">
          <image :src="item.url"  class="w-full h-full" />
          <nut-icon v-if="!readonly" name="circle-close" color="#f00" @click.stop="clear(index)" class="!absolute top-[1px] right-[1px]"></nut-icon>
        </view>
      </template>
    </view>
    <template v-for="(item, index) in fileList" :key="index">
      <view  class="box-border w-full flex justify-between leading-8" v-if="!item.isImg">
        <view class="flex flex-1 items-center" @click="previewFile(item)" >
          <view class="flex-1 truncate max-w-50">
            {{ item.name }}
          </view>
        </view>
        <view class="max-w-12 flex items-center">
          <nut-icon v-if="readonly" name="download" color="#999" @click="download(item)" ></nut-icon>
          <nut-icon v-if="!readonly" name="circle-close" color="#f00" @click="clear(index)" ></nut-icon>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
const {
  modelValue = [],
  option = {
    // 上传服务器地址，需要替换为你的接口地址
    url: '/gateway/upload', // 该地址非真实路径，需替换为你项目自己的接口地址
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
  // 必传宽高且宽高应与slot宽高保持一致
  width = 60,
  height = 30,
  // 限制允许上传的格式，空串=不限制，默认为空
  formats = 'png,jpg,pdf',
  // 文件上传大小限制
  size = 1,
  // 文件数量限制
  limit = 9,
  // 不可编辑
  readonly = false,

} = defineProps<{ option?: any; instantly?: boolean; width?: number; height?: number; size?: number; limit?: number;formats?: string; readonly?: boolean;modelValue: any }>()
const emit = defineEmits<{
  (e: 'update:modelValue', payload: any): void; (e: 'blur', payload: any): void
}>()

const maximize = computed(()=>size*1024*1024)
// 转换file字段
function transformObj(file) {
  file.url = file.url || file.fileUrl
  file.extname = file.url?.substring(file.url?.lastIndexOf('.') + 1) || ''
  file.name = file.fileName || file.name
  file.progress = 100
  file.isImg = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'].includes(file.extname.toLowerCase())

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
  console.log('val: ', val);
  emit('blur', val)
  // name=指定文件名，不传name默认移除所有文件
  // uploadFile.value.clear(name);
}
function download(item) {
  let url = item.url
  // #ifdef H5
    url = item.url.replace(/(.*)(\/file.*)/g, '$2')
    new Download(url, item.fileName)
  // #endif
  // ifndef
  uni.downloadFile({
    url: import.meta.env.BASE_URL + item.url,
    success(res) {
      // var filePath = res.tempFilePath;
      // uni.openDocument({
      //     filePath: filePath,
      //     showMenu: true,
      //     success: function (res) {
      //         
      //     }
      // });
    },
  })
  // #endif
}

function previewFile(file) {
  if (file.isImg) {
    const urls = fileList.value.filter(item => item.isImg).map(item => item.url)
    const current = urls.findIndex(url => url === file.url) || 0
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
  } else {
     uni.downloadFile({
      url: import.meta.env.BASE_URL + file.url,
      success: function (res) {
        var filePath = res.tempFilePath;
        uni.openDocument({
          filePath: filePath,
          showMenu: true,
          success: function (res) {
            console.log('打开文档成功');
          }
        });
      }
    });
  }
}

// source file https://github.com/jdf2e/nutui/blob/v4/src/packages/__VUE/uploader/uploader.ts#L6
const beforeXhrUpload = (UploadFile: any, options: any) => {
  // 限制文件格式
  const fileName =options.file.name
  const suffix = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase()
  const format = formats.toLowerCase()
  if (format && !format.includes(suffix)) {
    uni.$notify.showNotify({
      type: 'danger',
      msg: `不支持上传${suffix.toUpperCase()}格式文件`,
      position: 'top',
      // background: 'skyblue',
    })
    return
  }
  uni.$notify.showNotify({
    type: 'primary',
    msg: '文件上传中',
    position: 'top',
  })
  //UploadFile  是 uni.uploadFile ， 你也可以自定义设置其它函数
  const uploadTask = UploadFile({
    url: options.url,
    filePath: options.filePath,
    fileType: options.fileType,
    header: {
      'Authorization': uni.getStorageSync("userInfo")?.token,
      ...option.header
    }, //
    formData: option.formData,
    name: option.name,
    success(response: { errMsg: any; statusCode: number; data: string }) {
      if (response.statusCode == 200) {
        const data = JSON.parse(response.data)
        if (data.code == '0') {
          const file =data.data
          fileList.value.push(transformObj({ url: file.newFileName, fileName: file.uploadFileName, ...file }))
          const val = limit == 1 ? fileList.value[0] : fileList.value
          emit('update:modelValue', val)
          emit('blur', val)
        } else {
          uni.$notify.showNotify({
            type: 'danger',
            msg: data.message,
            position: 'top',
          })
        }
      }
      uni.$notify.hideNotify()
      // if (options.xhrState == response.statusCode) {
      //   options.onSuccess?.(response, options);
      // } else {
      //   options.onFailure?.(response, options);
      // }
    },
    fail(e: any) {
      options.onFailure?.(e, options);
    },
  });
  options.onStart?.(options);
  // uploadTask.progress((res: { progress: any; totalBytesSent: any; totalBytesExpectedToSend: any }) => {
  //   options.onProgress?.(res, options);
  //   // console.log('上传进度', res.progress);
  //   // console.log('已经上传的数据长度', res.totalBytesSent);
  //   // console.log('预期需要上传的数据总长度', res.totalBytesExpectedToSend);
  // });
  // uploadTask.abort(); // 取消上传任务
};

const onOversize = (files) => { 
  uni.$notify.showNotify({
    type: 'danger',
    msg: `只允许上传${size}M以内的文件`,
    position: 'top',
    // background: 'skyblue',
  })
  // uni.toast(`只允许上传${size}M以内的文件`)
}

</script>
