<script setup lang="ts">
import type { TreeNodeModel } from '../common'
import {
  TreeCheckStatus,
  isTreeNodeExpandable,
  isTreeNodeLeaf,
  setChildCheckStatus,
  setParentCheckStatus,
  useComTreeContext,
} from '../common'
// 小程序递归组件需显式自引用
import TreeNode from './TreeNode.vue'

defineOptions({
  name: 'TreeNode',
  options: {
    styleIsolation: 'shared',
    virtualHost: true,
  },
})

const props = withDefaults(defineProps<{
  node: TreeNodeModel
  multiple?: boolean
  leafOnly?: boolean
  checkStrictly?: boolean
  flat?: boolean
  valueKey?: string
  labelKey?: string
  childrenKey?: string
}>(), {
  multiple: false,
  leafOnly: false,
  checkStrictly: false,
  flat: false,
  valueKey: 'id',
  labelKey: 'name',
  childrenKey: 'children',
})

const {
  treeFlat,
  submit,
  popup,
  clearCustomNodes,
  lazy,
  isLeafKey,
  childrenKey,
  loadNode,
  getParentNode,
} = useComTreeContext()

const resolvedChildrenKey = computed(() => props.childrenKey || childrenKey.value)
const resolvedIsLeafKey = computed(() => isLeafKey.value)

const children = computed(() => props.node[resolvedChildrenKey.value] as TreeNodeModel[] | undefined)
const isExpandable = computed(() => isTreeNodeExpandable(
  props.node,
  resolvedChildrenKey.value,
  resolvedIsLeafKey.value,
  lazy.value,
))
const isLeaf = computed(() => isTreeNodeLeaf(
  props.node,
  resolvedChildrenKey.value,
  resolvedIsLeafKey.value,
  lazy.value,
))

async function toggleExpand() {
  if (!props.node.isShowChild && lazy.value && !props.node.loaded && !children.value?.length)
    await loadNode(props.node)

  props.node.isShowChild = !props.node.isShowChild
}

function isCheckedStyle(node: TreeNodeModel) {
  if (node.checkStatus === TreeCheckStatus.Checked)
    return true
  return !props.checkStrictly && node.checkStatus === TreeCheckStatus.Indeterminate
}

function handleSelect(node: TreeNodeModel) {
  if (node.disabled)
    return

  if (props.leafOnly && isExpandable.value && !isLeaf.value) {
    toggleExpand()
    return
  }

  if (props.multiple) {
    if (props.checkStrictly) {
      node.checkStatus = node.checkStatus === TreeCheckStatus.Checked
        ? TreeCheckStatus.Unchecked
        : TreeCheckStatus.Checked
      return
    }

    node.checkStatus = node.checkStatus === TreeCheckStatus.Unchecked
      ? TreeCheckStatus.Checked
      : node.checkStatus === TreeCheckStatus.Indeterminate
        ? TreeCheckStatus.Checked
        : TreeCheckStatus.Unchecked

    setChildCheckStatus(node, node.checkStatus, resolvedChildrenKey.value)
    setParentCheckStatus(node, resolvedChildrenKey.value, getParentNode)
    return
  }

  if (node.checkStatus === TreeCheckStatus.Unchecked) {
    node.checkStatus = TreeCheckStatus.Checked
    treeFlat.value.forEach((item) => {
      if (item[props.valueKey] !== node[props.valueKey])
        item.checkStatus = TreeCheckStatus.Unchecked
    })
    clearCustomNodes()
  }

  if (!popup.value)
    submit()
}
</script>

<template>
  <view v-if="isExpandable" class="text-sm com-tree-node">
    <view
      class="com-tree-node__row"
      :style="{ paddingLeft: `${36 * ((node.level ?? 1) - 1)}rpx` }"
    >
      <view
        class="com-tree-node__expand"
        :class="node.isShowChild ? '' : 'is-collapsed'"
        @click.stop="toggleExpand"
      >
        <view v-if="node.loading" class="com-tree-node__loading" />
        <view v-else class="com-tree-node__arrow" />
      </view>
      <view class="com-tree-node__label" @click.stop="toggleExpand">
        {{ node[labelKey] }}
      </view>
      <view
        v-if="!leafOnly"
        class="com-tree-node__check"
        :class="[
          multiple ? '' : 'is-radio',
          isCheckedStyle(node) ? 'is-checked' : '',
          node.disabled ? 'is-disabled' : '',
        ]"
        @click.stop="handleSelect(node)"
      >
        <view
          v-if="!checkStrictly && node.checkStatus === TreeCheckStatus.Indeterminate"
          class="com-tree-node__minus"
        />
        <wd-icon
          v-else-if="node.checkStatus === TreeCheckStatus.Checked"
          name="check"
          size="22rpx"
          color="#ffffff"
        />
      </view>
    </view>
    <view v-if="node.isShowChild" class="com-tree-node__children">
      <TreeNode
        v-for="child in children"
        :key="child[valueKey]"
        :node="child"
        :multiple="multiple"
        :leaf-only="leafOnly"
        :check-strictly="checkStrictly"
        :flat="flat"
        :value-key="valueKey"
        :label-key="labelKey"
        :children-key="resolvedChildrenKey"
      />
    </view>
  </view>
  <view v-else class="com-tree-node text-sm">
    <view
      class="com-tree-node__row"
      :class="flat ? '!pl-0' : ''"
      :style="{ paddingLeft: `${36 * ((node.level ?? 1) - 1)}rpx` }"
    >
      <view v-if="!flat" class="com-tree-node__expand is-placeholder" />
      <view class="com-tree-node__label" @click.stop="handleSelect(node)">
        {{ node[labelKey] }}
      </view>
      <view
        class="com-tree-node__check"
        :class="[
          multiple ? '' : 'is-radio',
          isCheckedStyle(node) ? 'is-checked' : '',
          node.disabled ? 'is-disabled' : '',
        ]"
        @click.stop="handleSelect(node)"
      >
        <view
          v-if="!checkStrictly && node.checkStatus === TreeCheckStatus.Indeterminate"
          class="com-tree-node__minus"
        />
        <wd-icon
          v-else-if="node.checkStatus === TreeCheckStatus.Checked"
          name="check"
          size="22rpx"
          color="#ffffff"
        />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.com-tree-node {
  &__row {
    display: flex;
    align-items: center;
    min-height: 72rpx;
    padding: 12rpx 8rpx 12rpx 0;
    box-sizing: border-box;
  }

  &__expand {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40rpx;
    height: 40rpx;
    margin-right: 4rpx;
    flex-shrink: 0;

    .com-tree-node__arrow {
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 10rpx 8rpx 0;
      border-color: #c2ccda transparent transparent transparent;
      transition: transform 0.15s ease;
    }

    &.is-collapsed .com-tree-node__arrow {
      transform: rotate(-90deg);
    }
  }

  &__loading {
    width: 20rpx;
    height: 20rpx;
    border: 2rpx solid #c0c4cc;
    border-top-color: #108ee9;
    border-radius: 50%;
    animation: com-tree-spin 0.8s linear infinite;
  }

  &__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-align: left;
    color: #333;
    line-height: 1.4;
    padding-right: 16rpx;
  }

  &__check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36rpx;
    height: 36rpx;
    border: 2rpx solid #c8c9cc;
    border-radius: 6rpx;
    margin-left: auto;
    flex-shrink: 0;
    box-sizing: border-box;

    &.is-radio {
      border-radius: 50%;
    }

    &.is-checked {
      background-color: #108ee9;
      border-color: #108ee9;
    }

    &.is-disabled {
      background-color: #ebedf0 !important;
      border-color: #e0e0e0;
    }
  }

  &__minus {
    width: 16rpx;
    height: 3rpx;
    background-color: #fff;
    border-radius: 2rpx;
  }
}

@keyframes com-tree-spin {
  to {
    transform: rotate(360deg);
  }
}

:deep(.wd-icon__icon) {
  color: #fff !important;
}
</style>
