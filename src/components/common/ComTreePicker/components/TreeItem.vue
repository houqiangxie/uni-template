<script setup>
import treeItem from './TreeItem.vue'

const props = defineProps({
  itemData: {
    type: Object,
    required: true,
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  onlyLastNode: {
    type: Boolean,
    default: false,
  },
  onlyCheckSelf: {
    type: Boolean,
    default: false,
  },
  flat: {
    type: Boolean,
    default: false,
  },
})

const treeList = inject('treeList')
const treeFlat = inject('treeFlat')
const submit = inject('submit')
const popUp = inject('popUp')
function handelSwitch(item) {
  item.isShowChild = !item.isShowChild
}
function handelSelect(item) {
  if (item.disabled)
    return
  if (props.multiple) {
    item.checkStatus = item.checkStatus === 0 ? 2 : item.checkStatus === 1 ? 2 : 0
    if (props.onlyCheckSelf)
      return
    setChildCheckStatus(item, item.checkStatus)
    setParentCheckStatus(item)
  }
  else {
    if (item.checkStatus === 0) {
      item.checkStatus = 2
      treeFlat.value.map((node) => {
        if (node.id !== item.id)
          node.checkStatus = 0
      })
    }
    !popUp&&submit()
  }
}
function setChildCheckStatus(parent, status) {
  const list = parent.children
  if (list && list.length) {
    list.forEach((item) => {
      item.checkStatus = status
      setChildCheckStatus(item, status)
    })
  }
}
function setParentCheckStatus(child) {
  const parent = child.parent
  if (parent) {
    const list = [...new Set(parent.children.map(item => item.checkStatus))]
    if (list.length === 1)
      parent.checkStatus = list[0]
    else
      parent.checkStatus = 1

    if (parent.parent)
      setParentCheckStatus(parent)
  }
}
// watch(() => props.itemData, (newVal) => {
//   // setChildCheckStatus(newVal, newVal.checkStatus)
//   // setParentCheckStatus(newVal)
// },{ immediate: true })
</script>
<script >
export default {
  options: {
    styleIsolation: "shared",  //  启动样式隔离。当使用页面自定义组件，希望父组件影响子组件样式时可能需要配置。具体配置选项参见：微信小程序自定义组件的样式
  },
}

</script>
<template>
  <view v-if="itemData.children && itemData.children.length > 0" class="tree-item text-sm">
    <view class="item-title" :style="{ paddingLeft: `${30 * (itemData.level - 1)}rpx` }" @click="isOpend = !isOpend">
      <view class="item-icon" :class="itemData?.isShowChild ? '' : 'expanded'" @click.stop="handelSwitch(itemData)">
        <!-- <u-icon name="arrow-down-fill" size="28rpx" /> -->
        <view class="arrow" />
      </view>
      <text class="item-name" @click.stop="handelSwitch(itemData)">
        {{ itemData.name }}
      </text>
      <view v-if="!props.onlyLastNode" class="item-check"
        :class="[props.multiple ? '' : 'circle', itemData.checkStatus ? 'checked' : '', itemData.disabled ? 'disabled' : '']"
        @click.stop="handelSelect(itemData)">
        <wd-icon v-if="itemData.checkStatus === 1" name="decrease" size="20rpx" color="#ffffff" />
        <wd-icon v-else-if="itemData.checkStatus === 2" name="check" size="28rpx" color="#ffffff" />
      </view>
    </view>
    <view class="item-sub" :class="itemData?.isShowChild ? 'expanded' : ''">
      <tree-item v-for="item2 in itemData.children" :key="item2.id" :item-data="item2"
        :only-last-node="props.onlyLastNode" :only-check-self="props.onlyCheckSelf" :multiple="props.multiple" />
    </view>
  </view>
  <view v-else class="tree-item text-sm">
    <view :class="['item-title', props.flat ? '!pl-0' : '']"
      :style="{ paddingLeft: `${30 * (itemData.level - 1)}rpx` }">
      <text class="item-name" @click.stop="handelSelect(itemData)">
        {{ itemData.name }}
      </text>
      <view class="item-check" :class="[props.multiple ? '' : 'circle', itemData.checkStatus ? 'checked' : '']"
        @click.stop="handelSelect(itemData)">
        <wd-icon v-if="itemData.checkStatus === 1" name="decrease" size="20rpx" color="#ffffff" />
        <wd-icon v-else-if="itemData.checkStatus === 2" name="check" size="28rpx" color="#ffffff" />
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
      // padding-right: 10rpx;

      .arrow {
        margin: 0 8rpx;
        // width: 12rpx;
        // height: 12rpx;
        // border-top: 2rpx solid #606266;
        // border-right: 2rpx solid #606266;
        // transform: rotate(45deg);
        border-top: 16rpx solid #C2CCDA;
        border-right: 12rpx solid transparent;
        border-bottom: 0 solid transparent;
        border-left: 12rpx solid transparent;
        transition: transform 0.15s ease-in-out;
      }

      .u-icon {
        // position: absolute;
        // transform-origin: 50% 50%;
        // transform: rotate(-90deg);
        transform: rotate(45deg);
        transition: transform 0.3s ease-in-out;
      }

      &.expanded {

        .u-icon {
          transform: rotate(45deg);
        }

        .arrow {
          transform: rotate(-90deg);
        }
      }
    }

    .item-name {
      flex: 1;
      overflow: hidden;
      text-align: left;
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

  ::v-deep .u-icon__icon{
    color:#fff !important;
  }
}
::v-deep .u-icon__icon {
  color: #fff !important;
}
</style>
