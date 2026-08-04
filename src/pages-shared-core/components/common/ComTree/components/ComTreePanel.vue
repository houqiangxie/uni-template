<script setup lang="ts">
import TreeNode from './TreeNode.vue'
import type { TreeNodeModel } from '../index.vue'

const props = withDefaults(defineProps<{
  nodes: TreeNodeModel[]
  keyword?: string
  showSearch?: boolean
  searchPlaceholder?: string
  multiple?: boolean
  allowCreate?: boolean
  leafOnly?: boolean
  checkStrictly?: boolean
  loading?: boolean
  emptyText?: string
  valueKey?: string
  labelKey?: string
  childrenKey?: string
  flat?: boolean
  panelClass?: string
}>(), {
  nodes: () => [],
  keyword: '',
  showSearch: false,
  searchPlaceholder: '',
  multiple: false,
  allowCreate: false,
  leafOnly: false,
  checkStrictly: false,
  loading: false,
  emptyText: '',
  valueKey: 'id',
  labelKey: 'name',
  childrenKey: 'children',
  flat: false,
  panelClass: '',
})

const emit = defineEmits<{
  'update:keyword': [value: string]
  search: []
  clear: []
  'add-custom': []
}>()

const { t } = useI18n()

const keywordModel = computed({
  get: () => props.keyword,
  set: value => emit('update:keyword', value),
})

function handleSearch() {
  emit('search')
}

function handleClear() {
  emit('clear')
}
</script>

<template>
  <view class="com-tree-panel" :class="panelClass">
    <view v-if="showSearch" class="com-tree-panel__search flex items-center">
      <wd-search
        v-model="keywordModel"
        :placeholder="searchPlaceholder"
        hide-cancel
        custom-class="pop-search flex-1"
        :placeholder-left="true"
        @change="handleSearch"
        @clear="handleClear"
      />
      <view
        v-if="multiple && allowCreate"
        class="com-tree-panel__create-btn mr-2"
        @click="emit('add-custom')"
      >
        {{ t('common.add') }}
      </view>
    </view>
    <view class="com-tree-panel__body overflow-hidden flex-1 min-h-0 px-2">
      <view v-if="loading" class="com-tree-panel__state">
        {{ t('common.loading') }}
      </view>
      <view v-else-if="!nodes.length" class="com-tree-panel__state">
        {{ emptyText || t('comTree.empty') }}
      </view>
      <scroll-view v-else class="h-full" scroll-y>
        <TreeNode
          v-for="item in nodes"
          :key="item[valueKey]"
          :node="item"
          :multiple="multiple"
          :leaf-only="leafOnly"
          :check-strictly="checkStrictly"
          :flat="flat"
          :value-key="valueKey"
          :label-key="labelKey"
          :children-key="childrenKey"
        />
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.com-tree-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;

  &__search {
    flex-shrink: 0;
  }

  &__create-btn {
    color: #108EE9;
    padding: 10rpx;
  }

  &__body {
    flex: 1;
  }

  &__state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200rpx;
    color: #999;
    font-size: 28rpx;
  }
}
</style>
