<script setup>
import uQRCode from './uqrcode.js'

const options = ref({
  // 二维码标识串
  qrcodeText: 'null',
  // 二维码尺寸
  qrcodeSize: 136,
  // 最终生成的二维码图片
  qrcodeSrc: '',
})

function make(data) {
  options.value = data

  uni.showLoading({
    title: '二维码生成中',
    mask: true,
  })

  uQRCode.make({
    canvasId: 'qrcode',
    text: options.value.qrcodeText,
    size: options.value.qrcodeSize,
    margin: 10,
    success: (res) => {
      options.value.qrcodeSrc = res
      console.log(`qrcodeSrc = ${options.value.qrcodeSrc}`)
    },
    complete: () => {
      uni.hideLoading()
    },
  })
}

function copy() {
  uni.setClipboardData({
    data: options.value.qrcodeText, // 当前点击的地址
    success: () => {
      uni.showToast({
        title: '已复制地址成功 请在浏览器打开',
      })
      // 获取刚复制好的地址到剪切板，
      // uni.getClipboardData({
      // 	success: () => {
      // 		uni.showToast({
      // 			title: '已复制地址成功 请在浏览器打开'
      // 		})
      // 	}
      // })
    },
  })
}

// 保存图片到相册
function savePhoto() {
  uni.showLoading({
    title: '保存中...',
    icon: 'loading',
  })

  const url = `_doc/${new Date().getTime()}.png`
  // #ifdef H5
  new Download(options.value.qrcodeSrc, url)
  uni.hideLoading()
  uni.showToast({ title: '图片保存成功' })
  return
  // #endif
  const bitmap = new plus.nativeObj.Bitmap('base64')
  bitmap.loadBase64Data(base64, () => {
    bitmap.save(
      url,
      {
        overwrite: false, // 是否覆盖
        // quality: 'quality'  // 图片清晰度
      },
      (i) => {
        uni.saveImageToPhotosAlbum({
          filePath: url,
          success: () => {
            uni.hideLoading()
            uni.showToast({ title: '图片保存成功' })
            bitmap.clear()
          },
        })
      },
      (e) => {
        uni.hideLoading()
        uni.showToast({
          title: '保存失败，请稍后重试',
          icon: 'none',
        })
        bitmap.clear()
      },
    )
  },
  (e) => {
    uni.hideLoading()
    uni.showToast({
      title: '保存失败，请稍后重试',
      icon: 'none',
    })
    bitmap.clear()
  },
  )
}

defineExpose({
  make,
})
</script>

<template>
  <view class="content">
    <view class="canvas">
      <!-- 二维码插件 width height设置宽高 -->
      <canvas canvas-id="qrcode" :style="{ width: `${qrcodeSize}px`, height: `${qrcodeSize}px` }" />
    </view>

    <button class="button" type="primary" size="mini" style="margin-bottom: 20px;" @click="savePhoto()">
      保存二维码
    </button>

    <view style="text-align: center; font-size: 12px;">
      <text class="list-text">
        {{ options.qrcodeText }}
      </text>
    </view>

    <button class="button" type="primary" size="mini" style="margin-top: 20px;" @click="copy()">
      复制链接
    </button>
  </view>
</template>

<style>
.content {
	margin-top: -50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  height: 100%;
}

.canvas {
	width: 136px;
	margin-bottom: 36rpx;
	text-align: center;
}
</style>
