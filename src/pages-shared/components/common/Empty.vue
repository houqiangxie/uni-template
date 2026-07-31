<template>
  <view class="custom-empty flex w-full h-full justify-center items-center">
    <wd-empty :tip="text">
      <template #image>
        <image
          class="empty-image"
          :src="getUrl('/common/noData.png')"
          :style="imageStyle"
          mode="aspectFit"
        />
      </template>
    </wd-empty>
  </view>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    default: '暂无数据',
  },
  imageSize: {
    type: [String, Number],
    default: 160,
  },
})

const imageStyle = computed(() => {
  const size = typeof props.imageSize === 'number' ? `${props.imageSize}px` : props.imageSize
  return {
    width: size,
    height: size,
  }
})
</script>

<style scoped>
.empty-image {
  display: block;
}
</style>
