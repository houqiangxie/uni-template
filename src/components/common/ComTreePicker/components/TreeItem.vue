<!--
 * @Author: wuxiangqu
 * @Date: 2024-02-29 17:51:38
 * @LastEditors: houqiangxie
 * @LastEditTime: 2024-05-17 15:42:27
 * @Description: 
-->
<script>
export default {
  name: 'treeItem' //给组件命名
}
</script>
<script setup>
const props = defineProps({
  itemData: {
    type: Object,
    required: true
  },
  multiple: {
    type: Boolean,
    default: true
  },
  onlyLastNode: {
    type: Boolean,
    default: false
  },
})
const treeList = inject('treeList')
const treeFlat = inject('treeFlat')
const handelSwitch = (item) => {
  item.isShowChild = !item.isShowChild
}
const handelSelect = (item) => {
  if (item.disabled) return
  if (props.multiple) {
    item.checkStatus = item.checkStatus === 0 ? 2 : item.checkStatus === 1 ? 2 : 0
    setChildCheckStatus(item, item.checkStatus)
    setParentCheckStatus(item)
  } else {
    if(item.checkStatus === 0) {
      item.checkStatus = 2
      treeFlat.value.map(node => {
        if(node.id !== item.id) { node.checkStatus = 0 }
      })
    }
  }
}
const setChildCheckStatus = (parent, status) => {
  let list = parent.children
  if (list && list.length) {
    list.forEach(item => {
      item.checkStatus = status
      setChildCheckStatus(item, status)
    })
  }
}
const setParentCheckStatus = (child) => {
  let parent = child.parent
  if (parent) {
    let list = [...new Set(parent.children.map(item => item.checkStatus))]
    if (list.length === 1) {
      parent.checkStatus = list[0]
    } else {
      parent.checkStatus = 1
    }
    if (parent.parent) {
      setParentCheckStatus(parent)
    }
  }
}
// watch(() => props.itemData, (newVal) => {
//   // setChildCheckStatus(newVal, newVal.checkStatus)
//   // setParentCheckStatus(newVal)
// },{ immediate: true })
</script>
<template>
  <view v-if="itemData.children && itemData.children.length > 0" class="tree-item">
    <view class="item-title" @click="isOpend = !isOpend" :style="{ paddingLeft: 30 * (itemData.level - 1) + 'rpx' }">
      <view :class="['item-icon', { expanded: itemData.isShowChild === true }]" @click.stop="handelSwitch(itemData)">
        <u-icon name="arrow-down-fill" size="28rpx"></u-icon>
      </view>
      <text class="item-name">{{ itemData.name }}</text>
      <view class="item-check" @click.stop="handelSelect(itemData)" v-if="!props.onlyLastNode"
        :class="[props.multiple ? '' : 'circle', itemData.checkStatus ? 'checked' : '', itemData.disabled ? 'disabled' : '']">
        <u-icon v-if="itemData.checkStatus === 1" name="minus" size="20rpx" color="#fff"></u-icon>
        <u-icon v-else-if="itemData.checkStatus === 2" name="checkbox-mark" size="28rpx" color="#fff"></u-icon>
      </view>
    </view>
    <view class="item-sub" :class="{ 'expanded': itemData.isShowChild }">
      <tree-item v-for="item2 in itemData.children" :key="item2.id" :itemData="item2" :onlyLastNode="props.onlyLastNode"
        :multiple="props.multiple"></tree-item>
    </view>
  </view>
  <view v-else class="tree-item">
    <view class="item-title" :style="{ paddingLeft: 30 * (itemData.level - 1) + 'rpx' }">
      <text class="item-name">{{ itemData.name }}</text>
      <view class="item-check" @click.stop="handelSelect(itemData)"
        :class="[props.multiple ? '' : 'circle', itemData.checkStatus ? 'checked' : '']">
        <u-icon v-if="itemData.checkStatus === 1" name="minus" size="20rpx" color="#fff"></u-icon>
        <u-icon v-else-if="itemData.checkStatus === 2" name="checkbox-mark" size="28rpx" color="#fff"></u-icon>
      </view>
    </view>
  </view>
</template>
<style lang="scss" scoped>
.tree-item {
  .item-title {
    display: flex;
    align-items: center;
    padding: 10rpx 0;

    .item-icon {
      padding-right: 10rpx;

      .u-icon {
        transform: rotate(-90deg);
      }

      &.expanded {
        .u-icon {
          transform: rotate(0deg);
        }

        ;
      }
    }

    .item-name {
      flex: 1;
      overflow: hidden;
    }

    .item-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30rpx;
      height: 30rpx;
      border: 1rpx solid #e0e0e0;
      border-radius: 4rpx;

      &.circle {
        border-radius: 50%;
      }

      &.checked {
        background-color: #1575ff;
        border-color: #1575ff;
      }

      &.disabled {
        background-color: #ebedf0 !important;
        border-color: #e0e0e0;
      }
    }
  }

  .item-sub {
    display: none;

    &.expanded {
      display: block;
    }
  }
}</style>