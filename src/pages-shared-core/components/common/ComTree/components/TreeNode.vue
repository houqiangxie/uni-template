<script setup lang="ts">
import type { TreeNodeModel } from '../index.vue'
import {
  TreeCheckStatus,
  isTreeNodeExpandable,
  isTreeNodeLeaf,
  setChildCheckStatus,
  setParentCheckStatus,
  useComTreeContext,
} from '../index.vue'

defineOptions({ name: 'TreeNode' })

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

const { treeFlat, submit, popup, clearCustomNodes, lazy, isLeafKey, childrenKey, loadNode } = useComTreeContext()

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
  if (!props.node.isShowChild && lazy.value && !props.node.loaded && !children.value?.length) {
    await loadNode(props.node)
  }
  props.node.isShowChild = !props.node.isShowChild
}

function handleSelect(node: TreeNodeModel) {
  if (node.disabled)
    return

  if (props.leafOnly && isExpandable.value && !isLeaf.value) {
    toggleExpand()
    return
  }

  if (props.multiple) {
    node.checkStatus = node.checkStatus === TreeCheckStatus.Unchecked
      ? TreeCheckStatus.Checked
      : node.checkStatus === TreeCheckStatus.Indeterminate
        ? TreeCheckStatus.Checked
        : TreeCheckStatus.Unchecked

    if (props.checkStrictly)
      return

    setChildCheckStatus(node, node.checkStatus, resolvedChildrenKey.value)
    setParentCheckStatus(node, resolvedChildrenKey.value)
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
  <view v-if="isExpandable" class="com-tree-node text-sm">
    <view
      class="com-tree-node__row"
      :style="{ paddingLeft: `${34 * ((node.level ?? 1) - 1)}rpx` }"
    >
      <view
        class="com-tree-node__expand"
        :class="node.isShowChild ? '' : 'is-collapsed'"
        @click.stop="toggleExpand"
      >
        <view v-if="node.loading" class="com-tree-node__loading" />
        <view v-else class="com-tree-node__arrow" />
      </view>
      <view
        v-if="!leafOnly"
        class="com-tree-node__check"
        :class="[
          multiple ? '' : 'is-radio',
          node.checkStatus ? 'is-checked' : '',
          node.disabled ? 'is-disabled' : '',
        ]"
        @click.stop="handleSelect(node)"
      >
        <wd-icon v-if="node.checkStatus === TreeCheckStatus.Indeterminate" name="decrease" size="20rpx" color="#ffffff" />
        <wd-icon v-else-if="node.checkStatus === TreeCheckStatus.Checked" name="check" size="20rpx" color="#ffffff" />
      </view>
      <text class="com-tree-node__label" @click.stop="toggleExpand">
        {{ node[labelKey] }}
      </text>
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
        :children-key="childrenKey"
      />
    </view>
  </view>
  <view v-else class="com-tree-node text-sm">
    <view
      class="com-tree-node__row"
      :class="flat ? '!pl-0' : ''"
      :style="{ paddingLeft: `${34 * ((node.level ?? 1) - 1)}rpx` }"
    >
      <view
        class="com-tree-node__check"
        :class="[
          multiple ? '' : 'is-radio',
          node.checkStatus ? 'is-checked' : '',
          node.disabled ? 'is-disabled' : '',
        ]"
        @click.stop="handleSelect(node)"
      >
        <wd-icon v-if="node.checkStatus === TreeCheckStatus.Indeterminate" name="decrease" size="20rpx" color="#ffffff" />
        <wd-icon v-else-if="node.checkStatus === TreeCheckStatus.Checked" name="check" size="20rpx" color="#ffffff" />
      </view>
      <text class="com-tree-node__label" @click.stop="handleSelect(node)">
        {{ node[labelKey] }}
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.com-tree-node {
  &__row {
    display: flex;
    align-items: center;
    padding: 10rpx 0;
  }

  &__expand {
    .com-tree-node__arrow {
      margin: 0 6rpx;
      border-top: 10rpx solid #C2CCDA;
      border-right: 8rpx solid transparent;
      border-bottom: 0 solid transparent;
      border-left: 8rpx solid transparent;
      transition: transform 0.15s ease-in-out;
    }

    &.is-collapsed .com-tree-node__arrow {
      transform: rotate(-90deg);
    }
  }

  &__loading {
    width: 20rpx;
    height: 20rpx;
    margin: 0 6rpx;
    border: 2rpx solid #C2CCDA;
    border-top-color: #108EE9;
    border-radius: 50%;
    animation: com-tree-spin 0.8s linear infinite;
  }

  &__label {
    flex: 1;
    overflow: hidden;
    text-align: left;
  }

  &__check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24rpx;
    height: 24rpx;
    border: 1rpx solid #e0e0e0;
    border-radius: 4rpx;
    margin-right: 8rpx;

    &.is-radio {
      border-radius: 50%;
    }

    &.is-checked {
      background-color: #108EE9;
      border-color: #108EE9;
    }

    &.is-disabled {
      background-color: #ebedf0 !important;
      border-color: #e0e0e0;
    }
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
