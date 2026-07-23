<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2024-01-24 17:33:32
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-02-18 11:55:39
-->
<template>
	<view v-if='isData' class="chart-box"><l-echart ref="chart" @finished="init"></l-echart></view>
	<Empty v-else :width="width" :height="height"/>
</template>

<script>
	import LEchart from '@/pages-echarts/uni_modules/lime-echart/components/l-echart/l-echart.vue';
	// #ifdef MP-WEIXIN
	// import * as echarts from '@/pages-echarts/uni_modules/lime-echart/static/echarts.min';
	const echarts = require('../../uni_modules/lime-echart/static/echarts.min');
	// #endif
	// #ifndef MP-WEIXIN
	// 按需引入 开始
	import * as echarts from 'echarts/core';
	import {
		LineChart,
		BarChart,
		PieChart
	} from 'echarts/charts';
	import {
		TitleComponent,
		TooltipComponent,
		GridComponent,
		DatasetComponent,
		TransformComponent,
		LegendComponent
	} from 'echarts/components';
	// 标签自动布局，全局过渡动画等特性
	import {
		LabelLayout,
		UniversalTransition
	} from 'echarts/features';
	// 引入 Canvas 渲染器，注意引入 CanvasRenderer 是必须的一步
	import {
		CanvasRenderer
	} from 'echarts/renderers';

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
	// #endif
	export default {
		components: {
			LEchart
		},
		props: {
			option: {
				type: Object,
				required: true
			},
			isData: {
				type: Boolean,
				required: false,
				default: true
			},
			imgStyle: {
				type: String,
				required: false,
				default: "width: 320rpx; height: 320rpx"
			},
			textStyle: {
				type: String,
				required: false,
				default: "fontSize: 22rpx"
			},
			width: {
				type: [String, Number],
				default: 160
			},
			height: {
				type: [String, Number],
				default: 160
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
				this.$refs.chart?.init(echarts, chart => {
					chart.setOption(this.option);
					chart.resize()
				});
				// this.$nextTick(() => {
				// 	if (this.$refs.chart) {
				// 		this.$refs.chart.setOption(this.option)
				// 	}
				// })
			}
		},
	}
</script>

<style scoped>
	.chart-box {
		height: 100%;
		width: 100%;
	}

	.aText {
		color: rgb(204, 217, 237);
		text-align: center;
	}

	.emptyBox {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>