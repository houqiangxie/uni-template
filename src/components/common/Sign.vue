<script>
/**
 * c-sign 电子签名
 * @description 电子签名
 * @property {String} canvasId 画布id
 * @property {String} width 图像宽度 默认750rpx 单位rpx/px
 * @property {String} height 图像高度 默认750rpx 单位rpx/px
 * @property {Number} lineWidth 画笔宽度
 * @property {String} lineColor 画笔颜色
 * @property {String} bgColor 画布背景颜色
 * @method {Function()} save 保存为图片
 * @method {Function()} clear 清空画布
 * */
function uuid(len = 32, radix = null) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
  const uuid = []
  radix = radix || chars.length
  if (len) {
    // 如果指定uuid长度,只是取随机的字符,0|x为位运算,能去掉x的小数位,返回整数位
    for (let i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix]
  }
  else {
    let r
    // rfc4122标准要求返回的uuid中,某些位为固定的字符
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
    uuid[14] = '4'

    for (let i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r]
      }
    }
  }
  return uuid.join('')
}

// 签完名的图片旋转处理
function rotateBase64Img(src, edg, callback) {
  // #ifdef MP
  const canvas =uni.createOffscreenCanvas({type:'2d'})
  // #endif
  // #ifndef MP
  const canvas = document.createElement('canvas')
  // #endif
  const ctx = canvas.getContext('2d')
  let imgW// 图片宽度
  let imgH// 图片高度
  let size// canvas初始大小
  if (edg % 90 != 0) {
    
    throw '旋转角度必须是90的倍数!'
  }
  (edg < 0) && (edg = (edg % 360) + 360)
  const quadrant = (edg / 90) % 4 // 旋转象限
  const cutCoor = { sx: 0, sy: 0, ex: 0, ey: 0 } // 裁剪坐标
   // #ifdef MP
   const image = canvas.createImage()
  // #endif
  // #ifndef MP
    const image = new Image()
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
    // drawImage向画布上绘制图片
    ctx.drawImage(image, 0, 0)
    // getImageData() 复制画布上指定矩形的像素数据
    const imgData = ctx.getImageData(cutCoor.sx, cutCoor.sy, cutCoor.ex, cutCoor.ey)
    if (quadrant % 2 == 0) {
      canvas.width = imgW
      canvas.height = imgH
    }
    else {
      canvas.width = imgH
      canvas.height = imgW
    }
    // putImageData() 将图像数据放回画布
    ctx.putImageData(imgData, 0, 0)
    callback(canvas.toDataURL())
  }
}
function transformObj(file) {
  file.name = file.fileName || file.name
  file.url = file.fileUrl || file.url || file.signatureUrl
  file.time = file.time || file.signatureTime || file.createTime || dateFormat(new Date(), 'datetime')
  return file
}
export default {
  name: 'CSign',
  props: {
    canvasId: {
      type: String,
      default: 'myCanvas',
    },
    // width: {
    //     type: String,
    //     default: '750rpx'
    // },
    // height: {
    //     type: String,
    //     default: '750rpx'
    // },
    lineWidth: { // 画笔宽度
      type: Number,
      default: 3,
    },
    lineColor: {
      type: String,
      default: '#000000',
    },
    bgColor: {
      type: String,
      default: '#ffffff',
    },
    modelValue: {
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      default: 'horizontal', // vertical , horizontal
    },
    imgClass: {
      type: String,
      default: 'h-8 w-21', // 非编辑模式图片样式
    },
    itemRef: {
      type: Object,
      default: () => {
        return {}
      },
    },
    multiple: {
      type: Boolean,
      default: true,
    },
    showTriggerBtn: {
      type: Boolean,
      default: true,
    },
    limit: {
      type: Number,
      default: 9,
    },
  },
  data() {
    return {
      issave: false, // 是否已保存
      points: [], // 路径点集合
      showMode: this.mode, // 显示模式
      width: '375rpx',
      height: '375rpx',
    }
  },
  computed: {
    myCanvasId() {
      if (!this.canvasId)
        return `c${uuid(18)}`
      else
        return this.canvasId
    },
    fileList() {
      if (this.modelValue)
        return Array.isArray(this.modelValue) ? this.modelValue.map(m => transformObj(m)) : [transformObj(this.modelValue)]
      else return []
    },
  },
  watch: {
    lineWidth() {
      this.ctx.lineWidth = this.lineWidth
    },
    lineColor() {
      this.ctx.strokeStyle = this.lineColor
    },
    bgColor() {
      this.clear()
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initCanvas()
      if (!this.showTriggerBtn)
        this.showPopup()
    })
  },
  methods: {
    setBgColor() {
      this.ctx.fillStyle = this.bgColor
      const canvas = this.$refs.canvas?.$el
      if (canvas) {
        this.width = canvas.offsetWidth
        this.height = canvas.offsetHeight
      }
      this.ctx.fillRect(0, 0, Number.parseInt(this.width), Number.parseInt(this.height))
      
      // #ifndef MP
      this.ctx.draw(true)
      // #endif
    },
    // #ifdef MP
    getContext() {
      return new Promise((resolve) => {
        const { pixelRatio } = uni.getSystemInfoSync()
        uni.createSelectorQuery()
          .in(this)
          .select(`#${this.canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            const { width, height } = res[0]
            const canvas = res[0].node
            canvas.width = res[0].width * pixelRatio
            canvas.height = res[0].height * pixelRatio
            resolve({ canvas, width, height, pixelRatio })
          })
      })
    },
    // #endif
    async initCanvas() {
      // #ifdef MP
      const { canvas, pixelRatio } = await this.getContext()
      this.canvas = canvas
      this.ctx = canvas.getContext('2d')
      this.ctx.scale(pixelRatio, pixelRatio)
      // #endif

      // #ifndef MP
      this.ctx = uni.createCanvasContext(this.myCanvasId, this)
      // #endif

      // 设置画笔样式
      this.ctx.lineWidth = this.lineWidth
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.ctx.strokeStyle = this.lineColor

      this.setBgColor()
    },
    // 触摸开始，获取到起点
    ontouchstart(e) {
      if (this.issave)
        return
      const startX = e.changedTouches[0].x
      const startY = e.changedTouches[0].y
      const startPoint = {
        X: startX,
        Y: startY,
      }
      this.points.push(startPoint)
      // 每次触摸开始，开启新的路径
      this.ctx.beginPath()
    },
    // 触摸移动，获取到路径点
    touchmove(e) {
      if (this.issave)
        return
      const moveX = e.changedTouches[0].x
      const moveY = e.changedTouches[0].y
      const movePoint = {
        X: moveX,
        Y: moveY,
      }
      this.points.push(movePoint) // 存点
      const len = this.points.length
      if (len >= 2)
        this.draw() // 绘制路径
    },
    // 触摸结束，将未绘制的点清空防止对后续路径产生干扰
    touchend() {
      if (this.issave)
        return
      this.points = []
      this.isSign = true
    },
    /* ***********************************************
        #   绘制笔迹
        #   1.为保证笔迹实时显示，必须在移动的同时绘制笔迹
        #   2.为保证笔迹连续，每次从路径集合中区两个点作为起点（moveTo）和终点(lineTo)
        #   3.将上一次的终点作为下一次绘制的起点（即清除第一个点）
        ************************************************ */
    draw() {
      const point1 = this.points[0]
      const point2 = this.points[1]
      this.points.shift()
      this.ctx.moveTo(point1.X, point1.Y)
      this.ctx.lineTo(point2.X, point2.Y)
      this.ctx.stroke()
      // #ifndef MP
      this.ctx.draw(true)
      // #endif
    },
    // 清空画布
    clear(flag) {
      this.setBgColor()
      // #ifndef MP
      this.ctx.draw(true)
      // #endif
      this.isSign = false
      // if (flag) {
      //     this.$emit('update:modelValue', null)
      //     this.itemRef?.onFieldChange?.(null)
      // }
      // uni.getSystemInfo({
      // 	success:(res)=> {
      // 		let canvasw = res.windowWidth;
      // 		let canvash = res.windowHeight;
      // 		this.ctx.clearRect(0, 0,canvasw,canvash);
      // 		this.setBgColor()
      // 		// #ifndef MP
      // 		this.ctx.draw(true);
      // 		// #endif
      // 		this.isSign = false
      // 	},
      // })
    },
    dataURLtoBlob(dataURL) {
      // 获取 Data URL 的数据部分，去掉头信息
      const parts = dataURL.split(',')
      const contentType = parts[0].split(':')[1]
      const raw = parts[1]

      // 将 Data URL 转换为 Blob 对象
      const byteString = atob(raw)
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      for (let i = 0; i < byteString.length; i++)
        uint8Array[i] = byteString.charCodeAt(i)

      return new Blob([arrayBuffer], { type: contentType })
    },
    save() {
      return new Promise((resolve, reject) => {
        if (!this.isSign) {
          reject({ errCode: -1, errMsg: '请签名' })
          return
        }
        uni.canvasToTempFilePath({
          // #ifdef MP
          canvas: this.canvas,
          // #endif
          // #ifndef MP
          // #endif
          canvasId: this.myCanvasId,
          // fileType:'jpg',
          quality: 1,
          success: async (res) => {
            
            // 
            // #ifdef H5
            // const data = this.dataURLtoBlob(res.tempFilePath)
            // resolve({ errMsg: 'canvasToTempFilePath:ok', tempFilePath: URL.createObjectURL(data) })
            // resolve({ errMsg: 'canvasToTempFilePath:ok', tempFilePath: URL.createObjectURL(data) })
            // #endif
            // #ifdef APP-PLUS||MP
            // #endif
            resolve(res)
          },
          fail(err) {
            
            reject(err)
          },
        })
      })
    },
    saveImg() {
      this.save().then((res) => {
        // 
        //   this.fileList.push(transformObj({ url: res.tempFilePath }))
        //   const val = this.limit == 1 ? this.fileList[0] : this.fileList
        //   this.$emit('update:modelValue', val)
        //   this.$emit('change', val)
        //   this.itemRef?.onFieldChange?.(val)
        //   this.$refs.popup.close()
        rotateBase64Img(res.tempFilePath, this.showMode == 'vertical' ? 270 : 0, (base64data) => {
          this.fileList.push(transformObj({ url: base64data }))
          const val = this.limit == 1 ? this.fileList[0] : this.fileList
          this.$emit('update:modelValue', val)
          this.$emit('change', val)
          this.itemRef?.onFieldChange?.(val)
          this.$refs.popup.close()
        })
        // if (this.showMode == 'vertical') {
        // } else {
        //     this.fileList.push(transformObj({ url: res.tempFilePath }))
        //     const val = this.limit == 1 ? this.fileList[0] : this.fileList
        //     this.$emit('update:modelValue', val)
        //     this.itemRef?.onFieldChange?.(val)
        // }
      }).catch((err) => {
        
        // uni.showToast({
        //   title: err.errMsg,
        //   icon: 'none',
        // })
      })
    },
    showPopup() {
      this.$refs.popup.open()
      nextTick(()=>{
        this.initCanvas()
      })
    },
    spin() {
      this.showMode = this.showMode == 'vertical' ? 'horizontal' : 'vertical'
      this.clear()
      nextTick(()=>{
        this.initCanvas()
      })
    },
    download(item) {
      new Download(item.url, item.fileName||'签名')
    },
    // 移除某个文件
    clearImg(index) {
      this.fileList.splice(index, 1)
      const val = this.limit == 1 ? this.fileList[0] : this.fileList
      this.$emit('update:modelValue', val)
      this.$emit('change', val)
      this.itemRef?.onFieldChange?.(val)
    },
    previewImg(file){
      const urls = this.fileList.map(item => item.url)
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
    }
  },
}
</script>

<template>
  <view class="sign-box">
    <button v-if="!disabled && showTriggerBtn" size="mini" type="primary"  @click="showPopup">
      签名
    </button>
    <slot name="extend"></slot>
    <view v-for="item in fileList" class="box-border w-full flex items-center justify-between leading-8">
      <image :src="item.url" :class="imgClass" mode="aspectFit" @click="previewImg(item)"/>
      <text text="[10px] [#999]">
        {{ item.time }}
      </text>
      <view class="max-w-12 flex items-center">
        <nut-icon v-if="disabled" name="download" color="#999" @click="download(item)" ></nut-icon>
        <nut-icon v-if="!disabled" name="circle-close" color="#f00" @click="clearImg(index)" ></nut-icon>
      </view>
    </view>
    <uni-popup ref="popup" type="bottom">
      <view class="canvas-box" :class="{ flex: showMode == 'vertical' }">
        <template v-if="showMode == 'vertical'">
          <view class="flex flex-col justify-center">
            <text class="opt-btn mb-5" @click="clear">
              清空
            </text>
            <text class="opt-btn mb-5" @click="spin">
              旋转
            </text>
            <text class="opt-btn" @click="saveImg">
              完成
            </text>
          </view>
          <view class="c-sign mx-2 flex-1 b-1 b-[#ddd] rounded b-dashed">
            <canvas
              :id="myCanvasId" ref="canvas" class="canvas" type="2d" :canvas-id="myCanvasId" disable-scroll="true"
              @touchstart="ontouchstart" @touchmove="touchmove" @touchend="touchend"
            />
          </view>
          <view class="text-center write-vertical-right write-orient-sideways">
            请签名
          </view>
        </template>
        <template v-else>
          <view class="mb-2 text-center">
            请签名
          </view>
          <view class="c-sign h-40 w-full b-1 b-[#ddd] rounded b-dashed">
            <canvas
              :id="myCanvasId" ref="canvas" class="canvas" type="2d" :canvas-id="myCanvasId" disable-scroll="true"
              @touchstart="ontouchstart" @touchmove="touchmove" @touchend="touchend"
            />
          </view>
          <view class="flex justify-center">
            <text class="opt-btn-h mr-5" @click="clear">
              清空
            </text>
            <text class="opt-btn-h mr-5" @click="spin">
              旋转
            </text>
            <text class="opt-btn-h" @click="saveImg">
              完成
            </text>
          </view>
        </template>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped>
.sign-box{
    .opt-btn{
        @apply write-vertical-right write-orient-sideways px-1 py-4 tracking-wide rounded text-sm;
        border: 1px solid #eee;
    }
    .opt-btn-h{
        @apply px-4 py-1 tracking-wide rounded mt-3 text-sm;
        border: 1px solid #eee;
    }
    .c-sign {
        .canvas {
            width: 100%;
            height: 100%;
            padding: 2px;
            // background-color: #ffffff;
            box-sizing: border-box;
        }
    }
    .canvas-box{
        width: 100%;
        height: calc(100vh - 44px);
        padding: 10px;
        box-sizing: border-box;
        background-color: #fff;
    }
}
</style>
