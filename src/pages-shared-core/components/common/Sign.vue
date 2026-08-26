<template>
  <view>
    <view v-if="!disabled && limit > previewList?.length" class="inline-block" @click.stop="showSignature">
      <slot>
        <wd-button size="small">
          签名
        </wd-button>
      </slot>
    </view>
    <view v-if="showList" class="signature-list">
      <view v-for="(item, index) in previewList" :key="item.fileId" class="signature-item">
        <image
          :src="resolvePreviewUrl(item.fileId)"
          class="signature-image"
          mode="aspectFit"
          @click="previewImage(index)"
        />
        <view v-if="!disabled" class="delete-btn" @click="deleteSignature(index)">
          ×
        </view>
      </view>
    </view>
    <wd-root-portal>
      <view v-if="inited" class="landscape-signature">
        <wd-signature
          :height="height"
          :width="width"
          enable-history
          pressure
          :background-color="backgroundColor"
          @confirm="handleConfirm"
        >
          <template #footer="{ clear, confirm, restore, revoke, canUndo, canRedo, historyList }">
            <view class="custom-actions">
              <view class="button-group">
                <wd-button size="small" plain @click="close">
                  返回
                </wd-button>
                <wd-button size="small" plain :disabled="!canUndo" @click="revoke">
                  撤回
                </wd-button>
                <wd-button size="small" plain :disabled="!canRedo" @click="restore">
                  恢复
                </wd-button>
                <wd-button size="small" plain @click="clear">
                  清除
                </wd-button>
                <wd-button size="small" type="primary" :disabled="getDisabled(historyList)" @click="confirm">
                  完成
                </wd-button>
              </view>
            </view>
          </template>
        </wd-signature>
      </view>
    </wd-root-portal>
  </view>
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  modelValue: {
    type: [Array, Object],
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  backgroundColor: {
    type: String,
    default: 'transparent',
  },
  limit: {
    type: Number,
    default: 1,
  },
  /** 自定义上传地址；不传则走系统文件上传 */
  uploadUrl: {
    type: String,
    default: '',
  },
  showList: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'close'])
const router = useRouter()
const userStore = useUserStore()

let upUrl = props.uploadUrl || `${apiPrefix}/system/sys/file/upload`
// #ifndef H5
if (!/^https?:\/\//.test(upUrl))
  upUrl = baseUrl + upUrl
// #endif

const height = ref(0)
const width = ref(0)
const inited = ref(false)

const previewList = computed({
  get() {
    if (!props.modelValue || (props.modelValue && Object.keys(props.modelValue).length == 0))
      return []
    return (Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]).map((item) => {
      const fileId = item.fileId || item.filePath || item.fileUrl || item.url || item.id
      const filePath = item.filePath || fileId || item.fileUrl
      const fileUrl = item.fileUrl || filePath || fileId
      return {
        ...item,
        name: item.name || item.fileName,
        fileName: item.fileName || item.name,
        fileId,
        filePath,
        fileUrl,
        url: resolvePreviewUrl(fileId),
      }
    }).filter(v => (v.status && v.status !== 'fail') || !v.status)
  },
  set(val) {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

/** 签完名的图片旋转处理 */
function rotateBase64Img(src, edg, callback) {
  let canvas = ''
  // #ifdef MP
  canvas = uni.createOffscreenCanvas({ type: '2d' })
  // #endif
  // #ifndef MP
  canvas = document.createElement('canvas')
  // #endif
  const ctx = canvas.getContext('2d')
  let imgW
  let imgH
  let size
  if (edg % 90 != 0)
    throw new Error('旋转角度必须是90的倍数!')

  if (edg < 0)
    edg = (edg % 360) + 360
  const cutCoor = { sx: 0, sy: 0, ex: 0, ey: 0 }
  const quadrant = (edg / 90) % 4
  let image = ''
  // #ifdef MP
  image = canvas.createImage()
  // #endif
  // #ifndef MP
  image = new Image()
  // #endif
  image.crossOrigin = 'anonymous'

  image.src = src
  image.onload = function () {
    imgW = image.width
    imgH = image.height
    size = imgW > imgH ? imgW : imgH
    canvas.width = size * 2
    canvas.height = size * 2
    switch (quadrant) {
      case 0:
        cutCoor.sx = size
        cutCoor.sy = size
        cutCoor.ex = size + imgW
        cutCoor.ey = size + imgH
        break
      case 1:
        cutCoor.sx = size - imgH
        cutCoor.sy = size
        cutCoor.ex = size
        cutCoor.ey = size + imgW
        break
      case 2:
        cutCoor.sx = size - imgW
        cutCoor.sy = size - imgH
        cutCoor.ex = size
        cutCoor.ey = size
        break
      case 3:
        cutCoor.sx = size
        cutCoor.sy = size - imgW
        cutCoor.ex = size + imgH
        cutCoor.ey = size + imgW
        break
    }
    ctx.translate(size, size)
    ctx.rotate(edg * Math.PI / 180)
    ctx.drawImage(image, 0, 0)
    const imgData = ctx.getImageData(cutCoor.sx, cutCoor.sy, cutCoor.ex, cutCoor.ey)
    if (quadrant % 2 == 0) {
      canvas.width = imgW
      canvas.height = imgH
    }
    else {
      canvas.width = imgH
      canvas.height = imgW
    }
    ctx.putImageData(imgData, 0, 0)
    callback(canvas.toDataURL())
  }
}

function formatPublicUrl(fileId) {
  if (!fileId)
    return fileId
  const path = `${apiPrefix}/system/sys/file/public/previewFile?fileId=${fileId}`
  // #ifdef H5
  return path
  // #endif
  // #ifndef H5
  return baseUrl + path
  // #endif
}

function resolvePreviewUrl(fileId) {
  return props.uploadUrl ? formatPublicUrl(fileId) : formatUrl(fileId)
}

function previewImage(index) {
  const urls = previewList.value.map(item => resolvePreviewUrl(item.fileId))
  uni.previewImage({
    urls,
    current: index,
  })
}

function deleteSignature(index) {
  const next = [...previewList.value]
  next.splice(index, 1)
  emit('update:modelValue', next)
  emit('change', next)
}

function showSignature() {
  if (previewList.value?.length >= props.limit) {
    nextTick(() => {
      emit('close')
    })
    return uni.$toast?.show ? uni.$toast.show('已签名') : uni.showToast({ title: '已签名', icon: 'none' })
  }
  const { windowWidth, windowHeight } = uni.getSystemInfoSync()
  width.value = windowWidth - 48
  height.value = windowHeight - 48
  inited.value = true
}

function handleConfirm(data) {
  inited.value = false
  if (data && data.tempFilePath)
    rotateBase64Img(data.tempFilePath, 270, uploadSignature)
}

async function uploadSignature(tempFilePath) {
  try {
    uni.showLoading({ title: '上传中...' })
    const uploadResult = await uploadFile(tempFilePath)
    if (uploadResult) {
      const fileId = uploadResult.id || uploadResult.fileId || uploadResult.data?.id
      const fileObj = {
        fileId,
        name: uploadResult.fileName || uploadResult.name || 'signature.png',
        fileName: uploadResult.fileName || uploadResult.name || 'signature.png',
        filePath: fileId,
        fileUrl: fileId,
        url: fileId,
      }
      const value = [...previewList.value, fileObj]
      emit('update:modelValue', value)
      emit('change', value)
      uni.hideLoading()
      inited.value = false
    }
    else {
      uni.hideLoading()
      inited.value = false
      uni.showToast({
        title: '签名上传失败',
        icon: 'error',
      })
    }
  }
  catch (error) {
    uni.hideLoading()
    inited.value = false
    uni.showToast({
      title: '签名处理失败',
      icon: 'error',
    })
  }
}

function base64ToPath(base64) {
  return new Promise((resolve, reject) => {
    const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(base64) || []
    if (!format) {
      reject(new Error('ERROR_BASE64SRC_PARSE'))
      return
    }
    const filePath = `${wx.env.USER_DATA_PATH}/temp.${format}`
    const buffer = wx.base64ToArrayBuffer(bodyData)
    const fs = wx.getFileSystemManager()
    fs.writeFile({
      filePath,
      data: buffer,
      encoding: 'binary',
      success: () => resolve(filePath),
      fail: reject,
    })
  })
}

async function uploadFile(filePath) {
  // #ifdef MP-WEIXIN
  filePath = await base64ToPath(filePath)
  // #endif
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: upUrl,
      header: {
        Authorization: userStore.userInfo?.token,
        platformType,
      },
      name: 'file',
      filePath,
      formData: {
        uploadSource: '1',
      },
      success(res) {
        if (res.statusCode === 200) {
          const response = JSON.parse(res.data)
          const { data, code } = response
          if (code === 200) {
            resolve(data)
          }
          else {
            reject(new Error(response.message || '上传失败'))
          }
        }
        else {
          if (res.statusCode === 401)
            router.replace('/pages/login/index')
          reject(new Error('上传失败'))
        }
      },
      fail(err) {
        reject(err)
      },
    })
  })
}

function getDisabled(historyList) {
  const filterHistoryList = (historyList || []).filter(item => item.points?.length > 2)
  return !filterHistoryList?.length
}

function close() {
  inited.value = false
  emit('close')
}

defineExpose({
  showSignature,
})
</script>

<style lang="scss" scoped>
.signature-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;

  .signature-item {
    position: relative;
    width: 60px;
    height: 30px;
    border-radius: 6px;
    overflow: hidden;

    .signature-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .delete-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 16px;
      height: 16px;
      background: #ff4757;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      z-index: 10;
    }
  }
}

.landscape-signature {
  height: 100vh;
  background: #fff;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  padding: 24px 24px 0;
  padding-left: 48px;
  box-sizing: border-box;
  z-index: 998;

  .custom-actions {
    position: fixed;
    left: 0;
    top: 50%;
    width: 48px;
    transform: translateY(-50%) rotate(90deg);
    transform-origin: center;
    z-index: 10;

    .button-group {
      display: flex;
      flex-direction: row;
      gap: 12px;
      white-space: nowrap;
      width: max-content;
      transform: translateX(-50%);
    }
  }
}
</style>

<style lang="scss">
.uni-swiper-slide-frame {
  img {
    background: #fff;
  }
}
</style>
