<script setup>
defineOptions({
   // 微信小程序中 options 选项
    // multipleSlots: true, //  在组件定义时的选项中启动多slot支持，默认启用
    styleIsolation: "shared",  //  启动样式隔离。当使用页面自定义组件，希望父组件影响子组件样式时可能需要配置。具体配置选项参见：微信小程序自定义组件的样式
    // addGlobalClass: true, //  表示页面样式将影响到自定义组件，但自定义组件中指定的样式不会影响页面。这个选项等价于设置 styleIsolation: apply-shared
    // virtualHost: true,  //  将自定义节点设置成虚拟的，更加接近Vue组件的表现。我们不希望自定义组件的这个节点本身可以设置样式、响应 flex 布局等，而是希望自定义组件内部的第一层节点能够响应 flex 布局或者样式由自定义组件本身完全决定
})
const props = defineProps({
  modelValue: {
    type: [Number, String, Array],
    default: []
  },
  data: {
    type: Array,
    default: []
  },
  multiple: {
    type: Boolean,
    default: true
  },
  onlyLastNode: {
    type: Boolean,
    default: false
  },
  onlyCheckSelf: {
    type: Boolean,
    default: false
  },
  showSearch: {
    type: Boolean,
    default: false
  },
  remote: {
    type: Boolean,
    default: false
  },
  // 格式化文本显示全路径
  showAll: {
    type: Boolean,
    default: false
  },
  // 显示选择后得文本
  showTrigger: {
    type: Boolean,
    default: true
  },
  // 是否弹窗
  popUp: {
    type: Boolean,
    default: true
  },
  // 禁用
  disabled: {
    type: Boolean,
    default: false
  },
})
const emit = defineEmits(['update:modelValue'])
const show = ref(false)
// 搜索关键字
const keyWord = ref('')
const filterList = ref([])

const filterFlatList=(list,keyWord)=>{
  let arr = []
  list.filter(item=>!item.children).forEach(item=>{
    if(item.name.includes(keyWord)){
      arr.push(item)
    }
  })
  return arr
}


async function onSearch() {
  if (!props.remote) filterList.value = keyWord.value ? filterFlatList(treeFlat.value||[], keyWord.value):treeList.value||[]
  // if (!props.remote) filterList.value = keyWord?filterTreeData(treeList.value||[], keyWord.value):treeList.value||[]
  // else await getRemoteData()
}
const close = () => {
  show.value = false
  initData()
}
const open = () => {
  show.value = true
}
const cancel = () => {
  show.value = false
  initData()
}
const submit = () => {
  let list = treeFlat.value
  let selectKeys = []
  list.forEach(item => {
    if (item.checkStatus === 2) {
      
      if (props.multiple) {
        if(props.onlyCheckSelf)selectKeys.push(item.id)
        else if (!item.children || item.children.length === 0) {
          selectKeys.push(item.id)
        }
      } else {
        selectKeys.push(item.id)
      }
    }
  })
  let selectNodes = list.filter(item=>selectKeys.includes(item.id))
  emit('update:modelValue', props.multiple ? selectKeys : selectKeys[0] || '')
  emit('change',props.multiple ? selectNodes : selectNodes[0] || {})
  props.popUp && close()
}
const treeList = ref([])
const treeFlat = ref([])
provide('treeList', treeList)
provide('treeFlat', treeFlat)
provide('submit', submit)
provide('popUp', props.popUp)
const nodeList = computed(() => {
  let list = treeFlat.value
  let arr = []
  if (Array.isArray(props.modelValue)) {
    props.modelValue.forEach(id => {
      let obj = list.find(item2 => item2.id === id)
      if (obj) arr.push(obj)
    })
  } else {
    let obj = list.find(item => item.id === props.modelValue)
    if (obj) arr.push(obj)
  }
  return arr
})
const initData = () => {
  treeFlat.value = []
  treeList.value = JSON.parse(JSON.stringify(props.data))
  
  transformData(treeList.value)
  onSearch()
}
const transformData = (list, level = 1, parent = null) => {
  list.forEach(item => {
    item.level = level
    item.parent = parent
    item.isShowChild = false
    item.checkStatus = props.modelValue && (props.modelValue.indexOf(item.id) > -1) ? 2 : 0
    treeFlat.value.push(item)
    if (Array.isArray(item.children) && item.children.length) {
      transformData(item.children, level + 1, item)
    } else {
      if(!props.onlyCheckSelf) setParentCheckStatus(item)
    }
  });
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
watch(() =>props.popUp? [props.modelValue, props.data]:props.data, (newVal) => {
  initData()
}, { immediate: true })

const formatText=computed(()=>{
  return nodeList.value.map(item=>{
    if(props.showAll){
      const  pathData=[]
      treeFindPath(treeList.value,(e)=>e.id==item.id, pathData)
      return pathData.map(e=>e.name).join('-')
    }
  else return  item.name
  }).join(';')
})


function filterTree(node, keyword) {
  // If the node's name contains the keyword, return the node
  if (node.name.includes(keyword)) {
    return node;
  }

  // If the node has children, filter the children recursively
  if (node.children) {
    const filteredChildren = node.children
      .map(child => filterTree(child, keyword)) // Recursively filter each child
      .filter(child => child !== null); // Remove any null children

    // If there are any children that match the keyword, return the node with those children
    if (filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
  }

  // If the node and its children do not match the keyword, return null
  return null;
}

// Wrapper function to handle array of trees
function filterTreeData(treeData, keyword) {
  return treeData
    .map(tree => filterTree(tree, keyword)) // Filter each tree in the array
    .filter(tree => tree !== null); // Remove any null trees
}


</script>
<template>
  <view class="com-tree-picker" :class="{'h-full flex flex-col': !popUp}">
    <view class="tree-content" @click.stop="open" v-if="popUp">
      <view class="select-box w-0" v-if="showTrigger">
        <template v-if="nodeList.length">

          <view class="truncate">{{ formatText }}</view>
          <!-- <view :class="['select-tag', props.multiple ? '' : 'single']">{{ nodeList[0].name }}</view> -->
          <!-- <view v-if="props.multiple" class="select-count">{{ nodeList.length }}</view> -->
        </template>
        <view v-else class="placeholder">请选择</view>
      </view>
      <slot><wd-icon name="arrow-right" color="#999" size="28rpx" v-if="!disabled"></wd-icon></slot>
    </view>
    <wd-popup v-model="show" @close="close" round="10rpx" position="bottom"  v-if="popUp" custom-class="rounded-t-lg overflow-hidden">
      <view>
        <view class="h-10 relative">
          <view class="flex items-center justify-center h-full text-base">请选择</view>
          <wd-icon name="close" size="16" color="#666" custom-class="absolute top-2 right-5" @click="close" />
        </view>
        <wd-search v-if="showSearch" v-model="keyWord" placeholder="请输入关键词搜索" hide-cancel
          :placeholder-left="true" @change='onSearch' @clear='onSearch'></wd-search>
        <view class="tree-view">
          <scroll-view style="height: 100%" scroll-y>
            <view v-show="keyWord">
              <tree-item v-for="item in filterList" :key="item.id" :itemData="item" :multiple="props.multiple"
                :onlyLastNode="props.onlyLastNode" :onlyCheckSelf="props.onlyCheckSelf" flat></tree-item>
            </view>
            <view v-show='!keyWord'>
              <tree-item v-for="item in filterList" :key="item.id" :itemData="item" :multiple="props.multiple"
                :onlyLastNode="props.onlyLastNode" :onlyCheckSelf="props.onlyCheckSelf"></tree-item>
            </view>
          </scroll-view>
        </view>
        <view class="p-2">
          <wd-button type="primary" block @click="submit">确定</wd-button>
        </view>
      </view>
    </wd-popup>
    <view v-else class="flex-1 flex flex-col overflow-hidden">
      <wd-search v-if="showSearch" v-model="keyWord" placeholder="请输入关键词搜索" hide-cancel
          :placeholder-left="true" @change='onSearch' @clear='onSearch'></wd-search>
      <!-- <view class="truncate h-5">{{ formatText }}</view> -->
      <view class="tree-view flex-1 py-0 overflow-hidden">
        <scroll-view style="height: 100%" scroll-y>
          <view v-show="keyWord">
            <tree-item v-for="item in filterList" :key="item.id" :itemData="item" :multiple="props.multiple"
              :onlyLastNode="props.onlyLastNode" :onlyCheckSelf="props.onlyCheckSelf" flat></tree-item>
          </view>
          <view v-show='!keyWord'>
            <tree-item v-for="item in filterList" :key="item.id" :itemData="item" :multiple="props.multiple"
              :onlyLastNode="props.onlyLastNode" :onlyCheckSelf="props.onlyCheckSelf"></tree-item>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>
<style lang="scss" scoped>
.com-tree-picker {
  width: 100%;
  padding: 10rpx 0;

  .tree-content {
    width: 100%;
    display: flex;
    align-items: center;

    .select-box {
      flex: 1;
      display: flex;
      align-items: center;
      font-size: 28rpx;

      .select-tag {
        width: 300rpx;
        padding: 4rpx 10rpx;
        background: #e0e0e0;
        border-radius: 4rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.single {
          background: transparent;
          border-radius: none;
          width: 100%;
          box-sizing: border-box;
        }
      }

      .select-count {
        margin-left: 10rpx;
        padding: 4rpx 10rpx;
        background: #e0e0e0;
        border-radius: 4rpx;
      }

      .placeholder {
        color: #c0c4cc;
      }
    }
  }

  .tree-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    padding: 20rpx;
    border-bottom: 1rpx solid #e0e0e0;

    .tree-bar-cancel {
      color: #666;
      padding: 10rpx;
    }

    .tree-bar-submit {
      color: #1575ff;
      padding: 10rpx;
    }
  }

  .tree-view {
    height: 400rpx;
    padding: 20rpx;
  }
  ::v-deep .uni-input-wrapper, .uni-input-form{
    @apply text-left items-center;
  }
}
</style>