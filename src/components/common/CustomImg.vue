<script setup lang="ts">
defineOptions({
  options: {
    styleIsolation: 'shared',
    virtualHost: true,
  },
})

const props = defineProps<{
  src?: string
  width?: string | number
  height?: string | number
  customClass?: string
  /**
   * 与文字混排垂直对齐。
   * H5 默认 middle；小程序多数场景默认 sub（图标易偏高）。
   */
  verticalAlign?: string
}>()

const emits = defineEmits<{
  (e: 'click'): void
}>()

const attrs = useAttrs()
const url = computed(() => getUrl(props.src || ''))
const imageWidth = ref<string | number>('')
const imageHeight = ref<string | number>('')

/** 与文字混排默认对齐：小程序偏 sub，其它端 middle（条件编译后只保留一端） */
let platformAlign = 'middle'
// #ifdef MP
platformAlign = 'sub'
// #endif

const resolvedAlign = computed(() => props.verticalAlign || platformAlign)

const imgStyle = computed(() => {
  const style: Record<string, string | number> = {
    display: 'inline-flex',
    verticalAlign: resolvedAlign.value,
  }
  const width = props.width || imageWidth.value
  const height = props.height || imageHeight.value
  if (width)
    style.width = width
  if (height)
    style.height = height
  return style
})

function onImageLoad(event: { detail: { width: number; height: number } }) {
  // 已指定尺寸或走 class / custom-class 时，不要用原图像素覆盖样式
  if ((props.width && props.height) || props.customClass || attrs.class)
    return
  const { width, height } = event.detail
  imageWidth.value = `${width / 2}px`
  imageHeight.value = `${height / 2}px`
}
</script>

<template>
  <wd-img
    :src="url"
    :style="imgStyle"
    :custom-class="props.customClass"
    @load="onImageLoad"
    @click="emits('click')"
  />
</template>
