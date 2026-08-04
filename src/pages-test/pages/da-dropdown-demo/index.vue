<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "Dropdown 示例"
  }
}
</route>

<script setup lang="ts">
import type { DaDropdownMenuListItem } from '@/pages-shared-core/components/common/da-dropdown/typing'

const statusOptions = [
  { label: '待处理', value: '0' },
  { label: '进行中', value: '1' },
  { label: '已完成', value: '2' },
]

const regionOptions = [
  {
    label: '广东省',
    value: 'gd',
    children: [
      { label: '广州市', value: 'gz',
      children: [
      { label: '广州市增城区', value: 'gzzc' ,
        children: [
          { label: '广州市增城区新塘镇', value: 'gzzcx' },
          { label: '广州市增城区新塘镇', value: 'gzzcx3' },
        ],
      },
      { label: '广州市从化区', value: 'gzch' },
      { label: '广州市花都区', value: 'gzhd' },
      { label: '广州市白云区', value: 'gzby' },
      { label: '广州市黄埔区', value: 'gzhp' },
      { label: '广州市番禺区', value: 'gzpy' },
      { label: '广州市南沙区', value: 'gzns' },
      { label: '广州市海珠区', value: 'gzhz' },
      { label: '广州市荔湾区', value: 'gzlw' },
      { label: '广州市越秀区', value: 'gzyx' },
    ],

       },
      { label: '深圳市', value: 'sz' },
    ],
  },
  {
    label: '浙江省',
    value: 'zj',
    children: [
      { label: '杭州市', value: 'hz' },
      { label: '宁波市', value: 'nb' },
    ],
  },
]

const typeColumns = [
  { text: '类型 A', value: 'a' },
  { text: '类型 B', value: 'b' },
  { text: '类型 C', value: 'c' },
]

const treeData = [
  {
    text: '总公司',
    value: 'root',
    children: [
      {
        text: '研发中心',
        value: 'rd',
        children: [
          { text: '前端组', value: 'fe' },
          { text: '后端组', value: 'be' },
        ],
      },
      { text: '市场部', value: 'mkt' },
    ],
  },
]

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
]

const tagOptions = [
  { label: '紧急', value: 'urgent' },
  { label: '重要', value: 'important' },
  { label: '普通', value: 'normal' },
]

const showRegion = ref(true)

const menuConfig = computed<DaDropdownMenuListItem[]>(() => [
  {
    title: '关键词',
    type: 'search',
    prop: 'keyword',
    placeholder: '请输入标题搜索',
  },
  {
    title: '状态',
    type: 'cell',
    prop: 'status',
    showAll: true,
    showLabel: true,
    showIcon: true,
    options: statusOptions,
  },
  {
    title: '价格',
    type: 'sort',
    prop: 'priceSort',
  },
  {
    title: '促销',
    type: 'click',
    prop: 'promo',
  },
  {
    title: '区域',
    type: 'picker',
    prop: 'region',
    showAll: true,
    options: regionOptions,
    componentProps: { mode: 'drill' },
    hidden: !showRegion.value,
  },
  {
    title: '创建时间',
    type: 'daterange',
    prop: 'dateRange',
    showQuick: true,
    defaultValue: { start: '', end: '' },
  },
  {
    title: '类型',
    type: 'com-select',
    prop: 'typeId',
    showLabel: true,
    options: typeColumns,
    defaultValue: '',
    componentProps: { embedded: true },
  },
  {
    title: '部门',
    type: 'com-tree',
    prop: 'deptId',
    options: treeData,
    defaultValue: '',
    componentProps: { embedded: true, popup: true, labelKey: 'text', valueKey: 'value' },
  },
  {
    title: '日期',
    type: 'date-picker',
    prop: 'singleDate',
    defaultValue: [],
    showLabel: true,
    componentProps: { type: 'daterange', placeholder: '请选择日期范围' },
  },
  {
    title: '优先级',
    type: 'radio',
    prop: 'priority',
    showLabel: true,
    options: priorityOptions,
    defaultValue: '',
  },
  {
    title: '标签',
    type: 'checkbox',
    prop: 'tags',
    options: tagOptions,
    defaultValue: [],
  },
  {
    title: '金额',
    type: 'input-range',
    prop: 'amountRange',
    defaultValue: ['', ''],
  },
  {
    title: '筛选',
    type: 'filter',
    prop: 'filter',
    defaultValue: { source: '', level: null },
    options: [
      {
        title: '来源',
        type: 'radio',
        prop: 'source',
        options: [
          { label: '线上', value: 'online' },
          { label: '线下', value: 'offline' },
        ],
      },
      {
        title: '等级',
        type: 'slider',
        prop: 'level',
        componentProps: { min: 0, max: 100, step: 5, showValue: true },
      },
      {
        title: '子类型',
        type: 'com-select',
        prop: 'subType',
        options: typeColumns,
        componentProps: { embedded: true },
      },
    ],
  },
])

const queryParams = ref<Record<string, unknown>>({
  keyword: '',
  status: null,
  priceSort: undefined,
  promo: false,
  region: null,
  dateRange: null,
  typeId: '',
  deptId: '',
  singleDate: [],
  priority: '',
  tags: [],
  amountRange: ['', ''],
  filter: {},
})

const lastConfirm = ref<Record<string, unknown> | null>(null)

function handleConfirm(partial: Record<string, unknown>) {
  lastConfirm.value = partial
}

function toggleRegion() {
  showRegion.value = !showRegion.value
}

function resetParams() {
  queryParams.value = {
    keyword: '',
    status: null,
    priceSort: undefined,
    promo: false,
    region: null,
    dateRange: null,
    typeId: '',
    deptId: '',
    singleDate: [],
    priority: '',
    tags: [],
    amountRange: ['', ''],
    filter: {},
  }
  lastConfirm.value = null
}
</script>

<template>
  <view class="demo-page">
    <da-dropdown
      v-model="queryParams"
      :dropdown-menu="menuConfig"
      theme-color="#108EE9"
      @confirm="handleConfirm"
    />

    <scroll-view class="demo-body" scroll-y>
      <view class="demo-section">
        <view class="demo-section__title">操作</view>
        <view class="demo-actions">
          <wd-button size="small" plain @click="toggleRegion">
            {{ showRegion ? '隐藏' : '显示' }}区域菜单
          </wd-button>
          <wd-button size="small" plain @click="resetParams">清空 v-model</wd-button>
        </view>
      </view>

      <view class="demo-section">
        <view class="demo-section__title">类型说明</view>
        <view class="demo-tips">
          <view class="demo-tip"><text class="demo-tip__tag">search</text> 顶栏搜索，输入即触发 confirm</view>
          <view class="demo-tip"><text class="demo-tip__tag">cell</text> 下拉单选，点选即确认</view>
          <view class="demo-tip"><text class="demo-tip__tag">sort</text> 排序 asc / desc / 取消</view>
          <view class="demo-tip"><text class="demo-tip__tag">click</text> 开关型菜单项</view>
          <view class="demo-tip"><text class="demo-tip__tag">picker</text> 级联选择（componentProps.mode: drill 单列下钻 / column 多列）</view>
          <view class="demo-tip"><text class="demo-tip__tag">daterange</text> 日期范围 + 快捷标签</view>
          <view class="demo-tip"><text class="demo-tip__tag">com-select</text> 顶层独立，组件内确定即提交</view>
          <view class="demo-tip"><text class="demo-tip__tag">com-tree</text> 树选择，组件内确定即提交</view>
          <view class="demo-tip"><text class="demo-tip__tag">date-picker</text> 日期范围选择</view>
          <view class="demo-tip"><text class="demo-tip__tag">radio</text> 顶层单选，点选即确认</view>
          <view class="demo-tip"><text class="demo-tip__tag">checkbox</text> 顶层多选，需底部确定</view>
          <view class="demo-tip"><text class="demo-tip__tag">input-range</text> 区间输入，需底部确定</view>
          <view class="demo-tip"><text class="demo-tip__tag">filter</text> 多条件组合筛选面板</view>
        </view>
      </view>

      <view class="demo-section">
        <view class="demo-section__title">最近一次 confirm（partial）</view>
        <view class="demo-code">{{ lastConfirm ? JSON.stringify(lastConfirm, null, 2) : '暂无' }}</view>
      </view>

      <view class="demo-section">
        <view class="demo-section__title">v-model 全量值</view>
        <view class="demo-code">{{ JSON.stringify(queryParams, null, 2) }}</view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.demo-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.demo-body {
  flex: 1;
  height: 0;
  padding: 24rpx;
  box-sizing: border-box;
}

.demo-section {
  margin-bottom: 24rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;

  &__title {
    margin-bottom: 16rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #1d2129;
  }
}

.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.demo-tips {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.demo-tip {
  font-size: 24rpx;
  line-height: 1.6;
  color: #4e5969;

  &__tag {
    display: inline-block;
    min-width: 140rpx;
    margin-right: 12rpx;
    padding: 2rpx 12rpx;
    font-family: monospace;
    font-size: 22rpx;
    color: #108ee9;
    background: #e8f3ff;
    border-radius: 8rpx;
  }
}

.demo-code {
  padding: 16rpx;
  font-family: monospace;
  font-size: 22rpx;
  line-height: 1.6;
  color: #1d2129;
  word-break: break-all;
  white-space: pre-wrap;
  background: #f7f8fa;
  border-radius: 12rpx;
}
</style>
