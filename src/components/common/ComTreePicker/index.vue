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
    default: null
  },
  data: {
    type: Array,
    default: []
  },
  multiple: {
    type: Boolean,
    default: false
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
  // 格式化文本显示全路径-->中间分隔符
  separator: {
    type: String,
    default: '-'
  },
  // 显示选择后得文本
  showTrigger: {
    type: Boolean,
    default: true
  },
  showArrow: {
    type: Boolean,
    default: true
  },
  // 是否弹窗
  popUp: {
    type: Boolean,
    default: true
  },
  // 是否显示选中状态
  showCheckStatus: {
    type: Boolean,
    default: true
  },
  // 是否带出搜索关键词 没有匹配项时候
  selectWord: {
    type: Boolean,
    default: false
  },
  // 禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 标签显示
  tags: {
    type: Boolean,
    default: false
  },
  // 是否用于搜索
  search: {
    type: Boolean,
    default: false
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
const emit = defineEmits(['update:modelValue', 'change'])
const show = ref(false)
// 搜索关键字
const keyWord = ref('')
const filterList = ref([])
const filterFlatList = (list, keyWord) => {
  let arr = []
  list.filter(item => !item[props.childrenKey]?.length).forEach(item => {
    if (item[props.labelKey].includes(keyWord)) {
      arr.push(item)
    }
  })
  return arr
}

function filterTreeWithShowChild(tree, keyword) {
  const result = [];

  for (const node of tree) {
    const hasMatch = node[props.labelKey].includes(keyword);

    let children = [];
    if (node[props.childrenKey] && node[props.childrenKey].length > 0) {
      children = filterTreeWithShowChild(node[props.childrenKey], keyword);
    }

    if (hasMatch || children.length > 0) {
      result.push({
        ...node,
        isShowChild: children.length > 0, // 展开有匹配子节点的项
        children
      });
    }
  }

  return result;
} const handleSearch = debounce(onSearch, 300)
async function onSearch() {
  if (!props.remote) {
    filterList.value = keyWord.value ? filterFlatList(treeFlat.value || [], keyWord.value) : treeList.value || []
    // filterList.value = keyWord.value ? filterTreeWithShowChild(treeFlat.value || [], keyWord.value) : treeList.value || []
    if (keyWord.value && props.selectWord && !props.multiple) {
      addList.value = []
      nodeList.value.map(item => {
        item.checkStatus = 0
      })
    }
  }
  // if (!props.remote) filterList.value = keyWord?filterTreeData(treeList.value||[], keyWord.value):treeList.value||[]
  else await getRemoteData()
  if (props.selectWord && props.multiple) {
    filterList.value = [...filterList.value, ...addList.value]
  }
}

const formatText = ref('')
const formatList = ref([])
const getFormatText = () => {
  const text = nodeList.value.map(item => {
    if (props.showAll) {
      const pathData = []
      treeFindPath(treeList.value, (e) => e[props.valueKey] == item[props.valueKey], pathData)
      return pathData.length ? pathData.map(e => e[props.labelKey]).join(props.separator) : item[props.labelKey]
    } else return item[props.labelKey]
  }).join(';')
  formatList.value = nodeList.value
  return text
  // || (props.selectWord && props.modelValue == keyWord.value ? keyWord.value : '')?.toString()
}

const close = () => {
  show.value = false
  // initData()
}
const open = () => {
  if (props.disabled) return
  show.value = true
}
const cancel = () => {
  show.value = false
  initData()
}
const submit = () => {
  let list = treeFlat.value.concat(JSON.parse(JSON.stringify(addList.value)))
  let selectKeys = []
  list.forEach(item => {
    if (item.checkStatus === 2) {

      if (props.multiple) {
        if (props.onlyCheckSelf|| (!item[props.childrenKey] || item[props.childrenKey].length === 0)) selectKeys.push(item[props.valueKey])
      } else {
        selectKeys.push(item[props.valueKey])
      }
    }
  })
  let selectNodes = list.filter(item => selectKeys.includes(item[props.valueKey]))
  if (!selectNodes?.length && props.selectWord && !props.multiple && keyWord.value) {
    selectNodes = [{ name: keyWord.value, id: keyWord.value }]
    selectKeys = [keyWord.value]
    addList.value.push({ name: keyWord.value, id: keyWord.value, checkStatus: 2 })
  }
  selectKeys = [...new Set(selectKeys)]
  const val = props.multiple ? selectKeys : selectKeys[selectKeys.length - 1]
  props.popUp && show.value && close()
  if (val === props.modelValue) return
  let name = props.multiple ? getAllNodeName(selectNodes) : getNodeName(selectNodes[selectNodes.length - 1])
  emit('update:modelValue', val || '')
  emit('change', props.multiple ? selectNodes : selectNodes[selectNodes.length - 1] || {}, name)
}
const getNodeName = (node, name = '') => {
  if (!node) return name
  if (node.parent) {
    return getNodeName(node.parent, `${node[props.labelKey]}${name ? '/' + name : ''}`)
  }
  return `${node[props.labelKey]}${name ? '/' + name : ''}`
}
const getAllNodeName = (nodes) => {
  return nodes.map(item => item[props.labelKey]).join(',')
}
const addItems = () => {
  if (keyWord.value && !addList.value?.map(item => item[props.valueKey]).includes(keyWord.value)) {
    addList.value.push({ name: keyWord.value, id: keyWord.value, checkStatus: 2 })
    keyWord.value = ''
    onSearch()
  }
}
const clearCustomList = () => {
  addList.value = []
}
const treeList = ref([])
const treeFlat = ref([])
const addList = ref([])
provide('treeList', treeList)
provide('treeFlat', treeFlat)
provide('submit', submit)
provide('popUp', props.popUp)
provide('clearCustomList', clearCustomList)

const nodeList = computed(() => {
  let list = treeFlat.value
  let arr = []
  if (Array.isArray(props.modelValue)) {
    props.modelValue.forEach(id => {
      let obj = list.find(item2 => item2[props.valueKey] === id)
      if (obj) arr.push(obj)
    })
  } else {
    let obj = list.find(item => item[props.valueKey] === props.modelValue)
    if (obj) arr.push(obj)
  }
  return [...arr, ...addList.value.reduce((acc, curr) => {
    const existing = acc.find(item => item[props.valueKey] === curr[props.valueKey]);
    if (!existing) {
      acc.push(curr);
    }
    return acc;
  }, [])];
})
const normalize = val => val === undefined || val === null ? (props.multiple ? [] : '') : val
const initData = () => {
  treeFlat.value = []
  treeList.value = JSON.parse(JSON.stringify(props.data))
  transformData(treeList.value)
  onSearch()
  const value = normalize(props.modelValue)

  addList.value = []
  nextTick(() => {
    if (value) {
      if (props.multiple) {
        const notMatchValueList = value.filter(item => !treeFlat.value.map(e => e[props.valueKey]).includes(item))
        addList.value = notMatchValueList.map(item => {
          return { name: item, id: item, checkStatus: 2 }
        })
      } else {
        const notMatchValue = treeFlat.value.find(item => item[props.valueKey] === value)
        if (!notMatchValue) {
          addList.value.push({ name: value, id: value, checkStatus: 2 })
        }
      }
    }
    formatText.value = getFormatText()
  })
}
const transformData = (list, level = 1, parent = null) => {
  list.forEach(item => {
    item.level = level
    item.parent = parent
    item.isShowChild = false
    if (props.multiple) {
      item.checkStatus = props.modelValue && Array.isArray(props.modelValue) && props.modelValue.includes(item[props.valueKey]) ? 2 : 0
    } else {
      item.checkStatus = props.modelValue && (props.modelValue === item[props.valueKey]) ? 2 : 0
    }
    // item.checkStatus = props.modelValue && (props.modelValue?.indexOf(item[props.valueKey]) > -1) ? 2 : 0
    treeFlat.value.push(item)
    if (Array.isArray(item[props.childrenKey]) && item[props.childrenKey].length) {
      transformData(item[props.childrenKey], level + 1, item)
    } else {
      if (!props.onlyCheckSelf && props.multiple) setParentCheckStatus(item)
    }
  });
}
const setParentCheckStatus = (child) => {
  let parent = child.parent
  if (parent) {
    let list = [...new Set(parent[props.childrenKey].map(item => item.checkStatus))]
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
watch(() => props.popUp ? [props.modelValue, props.data] : props.data, (newVal, oldVal) => {

  initData()
}, { immediate: true })



function filterTree(node, keyword) {
  // If the node's name contains the keyword, return the node
  if (node[props.labelKey].includes(keyword)) {
    return node;
  }

  // If the node has children, filter the children recursively
  if (node[props.childrenKey]) {
    const filteredChildren = node[props.childrenKey]
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

const closeTag = (item) => {
  item.checkStatus = 0
  addList.value = addList.value.filter(v => v[props.valueKey] !== item[props.valueKey])
  submit()
}


</script>
<template>
  <view class="com-tree-picker" :class="{ 'h-full flex flex-col': !popUp }">
    <view class="tree-content" @click.stop="open" v-if="popUp">
      <view class="select-box relative min-w-0" v-if="showTrigger">
        <wd-input type="none" readonly v-model="formatText"
          :custom-class="`w-full ${tags && formatText ? 'opacity-0' : ''} ${search ?'!bg-transparent':''}`" no-border
          :disabled="disabled" placeholder="请选择" />
        <view v-if="multiple && tags && formatText"
          class=" flex items-center gap-1 overflow-x-scroll absolute right-0 w-full">
          <wd-tag v-for="(item, index) in formatList" :key="index" round size="mini" closable
            @close.stop="closeTag(item)">{{ item[props.labelKey] }}</wd-tag>
        </view>
      </view>
      <slot v-if="showArrow"><wd-icon :name="search ? 'caret-down-small' :'arrow-right'" color="#999" :size="search?'20':'14'"
          v-if="!disabled"></wd-icon></slot>
    </view>
    <wd-popup v-model="show" @close="close" round="10rpx" position="bottom" v-if="popUp" root-portal
      custom-class="rounded-t-lg overflow-hidden h-100 flex flex-col">
      <view class="h-10 relative">
        <view class="flex items-center justify-center h-full text-base">请选择</view>
        <wd-icon name="close" size="16" color="#666" custom-class="absolute top-3 right-5" @click="close" />
      </view>
      <view v-if="showSearch" class="flex items-center ">
        <wd-search v-model="keyWord" placeholder="请输入关键词搜索" hide-cancel custom-class="pop-search flex-1"
          :placeholder-left="true" @change="handleSearch" @clear='onSearch'></wd-search>
        <view class="tree-bar-submit mr-2" v-if="multiple && selectWord" @click="addItems">新增</view>
      </view>
      <view class="overflow-hidden flex-1 min-h-0 px-2">
        <scroll-view class="h-full" scroll-y>
          <tree-item v-for="item in filterList" :key="item[props.valueKey]" :itemData="item" :multiple="props.multiple"
            :children-key="props.childrenKey" :value-key="props.valueKey" :label-key="props.labelKey"
            :onlyLastNode="props.onlyLastNode" :onlyCheckSelf="props.onlyCheckSelf" :flat="keyWord"></tree-item>
        </scroll-view>
      </view>
      <view class="p-2">
        <wd-button type="primary" block @click="submit">确定</wd-button>
      </view>
    </wd-popup>
    <view v-else class="flex-1 flex flex-col overflow-hidden">
      <wd-search v-if="showSearch" v-model="keyWord" placeholder="请输入关键词搜索" hide-cancel :placeholder-left="true"
        @change='handleSearch' @clear='onSearch'></wd-search>
      <view class="tree-view flex-1 py-0 overflow-hidden">
        <scroll-view style="height: 100%" scroll-y>
          <tree-item v-for="item in filterList" :key="item[props.valueKey]" :itemData="item" :multiple="props.multiple"
            :children-key="props.childrenKey" :value-key="props.valueKey" :label-key="props.labelKey"
            :onlyLastNode="props.onlyLastNode" :onlyCheckSelf="props.onlyCheckSelf"></tree-item>
        </scroll-view>
      </view>
    </view>
  </view>
</template>
<style lang="scss" scoped>
.com-tree-picker {
  width: 100%;
  // padding: 10rpx 0;

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

  }

  .tree-bar-submit {
    color: #108EE9;
    padding: 10rpx;
  }

  .tree-view {
    height: 400rpx;
    padding: 20rpx;
  }

  ::v-deep .wd-tag {
    white-space: nowrap;
    display: flex;
    align-items: center;
  }

  ::v-deep .wd-tag__close {
    margin-left: 0;
  }
}
</style>