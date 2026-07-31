<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2024-01-24 17:33:32
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-02-18 11:55:39
-->
<template>
  <view v-if="isData" class="chart-box">
    <l-echart ref="chart" @finished="init"></l-echart>
  </view>
  <Empty v-else :text="text" :image-size="imageSize" />
</template>

<script>
import LEchart from '@/pages-shared/uni_modules/lime-echart/components/l-echart/l-echart.vue'
import Empty from './Empty.vue'

// #ifdef MP
const echarts = require('../../uni_modules/lime-echart/static/echarts.min')
// #endif
// #ifndef MP
import * as echarts from 'echarts/core'
import {
  LineChart,
  BarChart,
  PieChart,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent,
} from 'echarts/components'
import {
  LabelLayout,
  UniversalTransition,
} from 'echarts/features'
import {
  CanvasRenderer,
} from 'echarts/renderers'

echarts.use([
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LineChart,
  BarChart,
  PieChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
])
// #endif

export default {
  components: {
    LEchart,
    Empty,
  },
  props: {
    option: {
      type: Object,
      required: true,
    },
    isData: {
      type: Boolean,
      default: true,
    },
    text: {
      type: String,
      default: '暂无数据',
    },
    imageSize: {
      type: [String, Number],
      default: 160,
    },
  },
  data() {
    return {
      chartInstance: null,
    }
  },
  watch: {
    option: {
      handler(newOption, oldOption) {
        const newType = newOption?.series?.[0]?.type
        const oldType = oldOption?.series?.[0]?.type
        if (this.chartInstance && oldType && newType && oldType !== newType) {
          this.disposeChart()
          this.$nextTick(() => this.init())
          return
        }
        this.render()
      },
      deep: true,
    },
  },
  beforeUnmount() {
    this.disposeChart()
  },
  methods: {
    async init() {
      if (!this.$refs.chart)
        return

      try {
        this.chartInstance = await this.$refs.chart.init(echarts)
        this.chartInstance.setOption(this.option, { notMerge: true })
        this.chartInstance.resize()
      }
      catch (error) {
        console.error('图表初始化失败:', error)
      }
    },
    render() {
      if (this.chartInstance) {
        this.chartInstance.setOption(this.option, { notMerge: true })
        this.chartInstance.resize()
        return
      }

      this.$refs.chart?.setOption(this.option)
      this.$refs.chart?.resize()
    },
    resize(size) {
      if (this.chartInstance) {
        this.chartInstance.resize(size)
        return
      }

      this.$refs.chart?.resize(size)
    },
    save(options = {}) {
      this.$refs.chart?.canvasToTempFilePath(options)
    },
    disposeChart() {
      if (this.$refs.chart) {
        this.$refs.chart.dispose()
      }
      this.chartInstance = null
    },
  },
}
</script>

<style scoped>
.chart-box {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
