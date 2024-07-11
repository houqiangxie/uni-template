<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2024-01-24 17:33:32
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-07-11 09:14:25
-->
<template>
	<view class="chart-box"><l-echart ref="chart" @finished="init"></l-echart></view>
</template>

<script>
	import LEchart from '@/components/lime-echart/components/l-echart/l-echart.vue';
	// import * as echarts from 'echarts';
	// 按需引入 开始
	import * as echarts from 'echarts/core';
	import { LineChart, BarChart, PieChart } from 'echarts/charts';
	import { TitleComponent, TooltipComponent, GridComponent, DatasetComponent, TransformComponent, LegendComponent } from 'echarts/components';
	// 标签自动布局，全局过渡动画等特性
	import { LabelLayout, UniversalTransition } from 'echarts/features';
	// 引入 Canvas 渲染器，注意引入 CanvasRenderer 是必须的一步
	import { CanvasRenderer } from 'echarts/renderers';

	// 按需引入 注册必须的组件
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
		CanvasRenderer
	]);
	export default {
		components: {
			LEchart
		},
		props: {
			option: {
				type: Object,
				required: true
			}
		},
		watch: {
			option: {
				handler: function() {
					this.render()
				},
				deep: true
			}
		},
		methods: {
			async init() {
				const chart = await this.$refs.chart.init(echarts);
				chart.setOption(this.option)
				chart.resize()
			},
			render() {
				this.$refs.chart.init(echarts, chart => {
					chart.setOption(this.option);
					chart.resize()
				});
				// this.$nextTick(() => {
				// 	if (this.$refs.chart) {
				// 		this.$refs.chart.setOption(this.option)
				// 	}
				// })
			}
		}
	}
</script>

<style scoped>
	.chart-box {
		height: 100%;
		width: 100%;
	}
</style>