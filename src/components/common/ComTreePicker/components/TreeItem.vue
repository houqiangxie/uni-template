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
  valueKey: {
    type: String,
    default: 'id'
  },
  labelKey: {
    type: String,
    default: 'name'
  },
  childrenKey: {
    type: String,
    default: 'children'
  },
})

const treeList = inject('treeList')
const treeFlat = inject('treeFlat')
const submit = inject('submit')
const popUp = inject('popUp')
const clearCustomList = inject('clearCustomList')
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
        if (node[props.valueKey] !== item[props.valueKey])
          node.checkStatus = 0
      })
      clearCustomList()
    }
    !popUp&&submit()
  }
}
function setChildCheckStatus(parent, status) {
  const list = parent[props.childrenKey]
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
    const list = [...new Set(parent[props.childrenKey].map(item => item.checkStatus))]
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
  <view v-if="itemData[props.childrenKey] && itemData[props.childrenKey].length > 0" class="tree-item text-sm">
    <view class="item-title" :style="{ paddingLeft: `${34 * (itemData.level - 1)}rpx` }" @click="isOpend = !isOpend">
      <view class="item-icon" :class="itemData?.isShowChild ? '' : 'expanded'" @click.stop="handelSwitch(itemData)">
        <view class="arrow" />
      </view>
      <view v-if="!props.onlyLastNode" class="item-check"
        :class="[props.multiple ? '' : 'circle', itemData.checkStatus ? 'checked' : '', itemData.disabled ? 'disabled' : '']"
        @click.stop="handelSelect(itemData)">
        <wd-icon v-if="itemData.checkStatus === 1" name="decrease" size="20rpx" color="#ffffff" />
        <wd-icon v-else-if="itemData.checkStatus === 2" name="check" size="20rpx" color="#ffffff" />
      </view>
      <text class="item-name" @click.stop="handelSwitch(itemData)">
        {{ itemData[props.labelKey] }}
      </text>
    </view>
    <view class="item-sub" :class="itemData?.isShowChild ? 'expanded' : ''" v-if="itemData?.isShowChild">
      <tree-item v-for="item2 in itemData[props.childrenKey]" :key="item2[props.valueKey]" :item-data="item2" :children-key="props.childrenKey" :value-key="props.valueKey" :label-key="props.labelKey"
        :only-last-node="props.onlyLastNode" :only-check-self="props.onlyCheckSelf" :multiple="props.multiple" />
    </view>
  </view>
  <view v-else class="tree-item text-sm">
    <view :class="['item-title', props.flat ? '!pl-0' : '']"
      :style="{ paddingLeft: `${34 * (itemData.level - 1)}rpx` }">
      <view class="item-check" :class="[props.multiple ? '' : 'circle', itemData.checkStatus ? 'checked' : '']"
        @click.stop="handelSelect(itemData)">
        <wd-icon v-if="itemData.checkStatus === 1" name="decrease" size="20rpx" color="#ffffff" />
        <wd-icon v-else-if="itemData.checkStatus === 2" name="check" size="20rpx" color="#ffffff" />
      </view>
      <text class="item-name" @click.stop="handelSelect(itemData)">
        {{ itemData[props.labelKey] }}
      </text>
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
        margin: 0 6rpx;
        // width: 12rpx;
        // height: 12rpx;
        // border-top: 2rpx solid #606266;
        // border-right: 2rpx solid #606266;
        // transform: rotate(45deg);
        border-top: 10rpx solid #C2CCDA;
        border-right: 8rpx solid transparent;
        border-bottom: 0 solid transparent;
        border-left: 8rpx solid transparent;
        transition: transform 0.15s ease-in-out;
      }

      .wd-icon {
        // position: absolute;
        // transform-origin: 50% 50%;
        // transform: rotate(-90deg);
        transform: rotate(45deg);
        transition: transform 0.3s ease-in-out;
      }

      &.expanded {

        .wd-icon {
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
        width: 24rpx;
        height: 24rpx;
        border: 1rpx solid #e0e0e0; 
        border-radius: 4rpx;
        margin-right: 8rpx;
    
        &.circle {
            border-radius: 50%;
        }

      &.checked {
        background-color: #108EE9;
        border-color: #108EE9;
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

  ::v-deep .wd-icon__icon{
    color:#fff !important;
  }
}
::v-deep .wd-icon__icon {
  color: #fff !important;
}
</style>
