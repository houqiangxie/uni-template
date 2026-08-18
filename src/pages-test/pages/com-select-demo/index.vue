<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "ComSelect 本地分页"
  }
}
</route>

<script setup lang="ts">
const selected = ref<string | number | Array<string | number>>()
const selectedName = ref('')

const columns = Array.from({ length: 80 }, (_, i) => ({
  value: i + 1,
  text: `选项 ${i + 1}`,
}))

function onChange(row: Record<string, unknown> | Record<string, unknown>[]) {
  console.log('[com-select-demo] change', row)
}
</script>

<template>
  <view class="demo">
    <view class="demo-card">
      <view class="demo-title">
        本地列表 + 分页加载
      </view>
      <view class="demo-desc">
        不走远程接口，演示 ComSelect 对本地 columns 的关键词过滤与滚动分页。
      </view>
      <ComSelect
        v-model="selected"
        v-model:model-name="selectedName"
        :columns="columns"
        show-search
        label-key="text"
        value-key="value"
        search-key="text"
        title="请选择"
        placeholder="点击选择"
        @change="onChange"
      />
      <view class="demo-result">
        当前值：{{ selected ?? '空' }} / {{ selectedName || '-' }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.demo {
  min-height: 100%;
  padding: 32rpx;
  background: #f5f7fa;
}

.demo-card {
  padding: 32rpx;
  background: #fff;
  border-radius: 16rpx;
}

.demo-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1d2129;
}

.demo-desc {
  margin: 12rpx 0 24rpx;
  font-size: 26rpx;
  color: #86909c;
  line-height: 1.5;
}

.demo-result {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #4e5969;
}
</style>
