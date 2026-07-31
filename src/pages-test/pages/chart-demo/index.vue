<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "图表示例"
  }
}
</route>

<script setup lang="ts">
const chartOption = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    confine: true,
  },
  legend: {
    data: ['销量', '利润'],
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    axisLine: { lineStyle: { color: '#999' } },
    axisLabel: { color: '#666' },
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#999' } },
    axisLabel: { color: '#666' },
  },
  series: [
    {
      name: '销量',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110, 130],
      itemStyle: { color: '#5470c6' },
    },
    {
      name: '利润',
      type: 'line',
      smooth: true,
      data: [20, 32, 18, 15, 12, 22, 28],
      itemStyle: { color: '#91cc75' },
    },
  ],
})

const pieOption = ref({
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      name: '访问来源',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: '搜索引擎' },
        { value: 735, name: '直接访问' },
        { value: 580, name: '邮件营销' },
        { value: 484, name: '联盟广告' },
        { value: 300, name: '视频广告' },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
  ],
})

const activeTab = ref<'bar' | 'pie'>('bar')

const currentOption = computed(() =>
  activeTab.value === 'bar' ? chartOption.value : pieOption.value,
)
</script>

<template>
  <view class="chart-demo">
    <view class="chart-demo__tabs">
      <wd-button
        :type="activeTab === 'bar' ? 'primary' : 'default'"
        size="small"
        @click="activeTab = 'bar'"
      >
        柱状图 + 折线图
      </wd-button>
      <wd-button
        :type="activeTab === 'pie' ? 'primary' : 'default'"
        size="small"
        @click="activeTab = 'pie'"
      >
        饼图
      </wd-button>
    </view>

    <view class="chart-demo__card">
      <ComChart :key="activeTab" :option="currentOption" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.chart-demo {
  min-height: 100%;
  padding: 32rpx;
  background: #f5f7fa;
}

.chart-demo__tabs {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.chart-demo__card {
  height: 600rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
}
</style>
