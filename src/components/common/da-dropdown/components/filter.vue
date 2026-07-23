<template>
  <view class="da-dropdown-filter">
    <scroll-view class="max-h-80" scroll-y>
      <view class="da-dropdown-filter-box" v-for="(item, index) in filterList" :key="index">
        <template v-if="!item.hidden">
          <view class="da-dropdown-filter--title">{{ item.title }}</view>
          <view class="da-dropdown-filter-content">
            <!-- 单选类型 -->
            <block v-if="item.type === 'radio'">
              <view v-for="(opt, optIdx) in item.options" class="da-dropdown-filter-item da-dropdown-tag"
                :class="item.value === opt.value ? 'is-actived' : ''" :key="optIdx"
                @click="handleRadioChange(item, opt, optIdx, index)">
                <text class="da-dropdown-tag--text">{{ opt.label }}</text>
              </view>
            </block>
            <!-- 多选类型 -->
            <block v-else-if="item.type === 'checkbox'">
              <view v-for="(opt, optIdx) in item.options" class="da-dropdown-filter-item da-dropdown-tag"
                :class="opt.isActived ? 'is-actived' : ''" :key="optIdx"
                @click="handleCheckboxChange(item, opt, optIdx, index)">
                <text class="da-dropdown-tag--text">{{ opt.label }}</text>
              </view>
            </block>
            <!-- 滑块类型 -->
            <block v-else-if="item.type === 'slider'">
              <slider style="width: 100%" :value="item.value" :min="item.componentProps.min || 0"
                :max="item.componentProps.max || 100" :step="item.componentProps.step || 1"
                :activeColor="item.componentProps.activeColor" :show-value="item.componentProps.showValue"
                @change="(e) => handleSliderChange(e, item, index)" />
            </block>
            <view v-else-if="item.type === 'com-select'" class=" w-full   flex items-center gap-2">
              <view class="flex-1 min-w-0 bg-[#f5f5f5] rounded-2xl px-2 py-1">
                <ComSelect v-model="item.value" :columns="item.options" show-search search v-bind="item.componentProps||{}"
                  @change="(e)=>handleSelectChange(e,item,index)" />
              </view>
                <view class="text-xs text-[#108EE9]" v-if="item.componentProps?.linkText" @click.stop="handleLink(item.componentProps.linkUrl)">{{ item.componentProps?.linkText }}</view>
            </view>
            <view v-else-if="item.type === 'com-tree-picker'" class="bg-[#f5f5f5] rounded-2xl w-full px-2 py-1">
              <com-tree-picker v-model="item.value" :data="item.options" show-search search v-bind="item.componentProps||{}"
                @change="(e)=>handleSelectChange(e,item,index)" />
            </view>
            <view v-else-if="item.type === 'date-picker'" class="w-full rounded-50 overflow-hidden">
              <ComDateTimeRangeSelect v-model="item.value" type="date" :clearable="false" bgColor="#f5f5f5" v-bind="item.componentProps||{}"
                class="!mx-0" />
            </view>
            <view v-else-if="item.type === 'search'" class="w-full">
              <Search v-model="item.value" v-bind="item.componentProps||{}" class="search-boxss rounded-12 !bg-[#f5f5f5] !mx-0" />
            </view>
            <view v-else-if="item.type === 'risk-search'" class="bg-[#f5f5f5] rounded-2xl w-full px-2 py-1 border-box">
              <RiskSearch v-model="item.value" v-bind="item.componentProps||{}" class="search-boxss rounded-12 !bg-[#f5f5f5] !mx-0" />
            </view>
            <view v-else-if="item.type === 'input-range'" class="flex items-center gap-1 vertical level w-full px-2  border-box">
              <wd-input v-model="item.value[0]" type="decimal"  no-border @input="handleInputRangeChange(item,0)"></wd-input>~<wd-input  type="decimal" v-model="item.value[1]"  no-border @input="handleInputRangeChange(item, 1)"></wd-input>
            </view>
          </view>
        </template>
      </view>
    </scroll-view>
    <!-- <PartDropdownFooter :resetText="dropdownItem.resetText" :confirmText="dropdownItem.confirmText"
      @reset="handleReset()" @confirm="handleConfirm()"></PartDropdownFooter> -->
      <view class="footer-box pt-2" >
        <wd-button plain @click="handleReset()">{{ dropdownItem.resetText || '重置' }}</wd-button>
        <wd-button @click="handleConfirm()">{{ dropdownItem.confirmText || '确定' }}</wd-button>
      </view>
  </view>
</template>

<script>
import { defineComponent, ref, watch } from 'vue'
import { deepClone } from '../utils'
import PartDropdownFooter from './part-dropdown-footer.vue'
function formatNumber(val) {
  val = val.replace(/[^\d.]/g, '') // 只保留数字和点

  // 只允许一个小数点
  val = val.replace(/\.{2,}/g, '.')
  val = val.replace('.', '#').replace(/\./g, '').replace('#', '.')

  // 限制小数 4 位
  val = val.replace(/^(\d+)(\.\d{0,4})?.*$/, '$1$2')

  return val
}
export default defineComponent({
  components: { PartDropdownFooter },
  props: {
    dropdownItem: {
      type: Object,
      default: null,
    },
    dropdownIndex: {
      type: Number,
    },
  },
  emits: ['success', 'change'],
  setup(props, { emit }) {
    const filterList = ref(null)

    function initData(dropdownItem, clearValue = false) {
      const { options = [], value = {}, defaultValue = {} } = dropdownItem || {}
      const valueMap = clearValue ? defaultValue : value
      if (options?.length) {
        const list = deepClone(options)
        for (let i = 0; i < list.length; i++) {
          const k = list[i]
          const hasValue = Object.prototype.hasOwnProperty.call(valueMap, k.prop)
          if (clearValue) {
            k.value = k.type === 'checkbox'? [] : null
          } else if (hasValue) {
            k.value = deepClone(valueMap[k.prop])
          } 

          // 多选
          if (k.type === 'checkbox' && k.value?.length) {
            if (k.options?.length) {
              k.options.forEach((x) => {
                x.isActived = k.value?.includes(x.value)
              })
            }
          } else if (k.type === 'checkbox' && k.options?.length) {
            k.options.forEach((x) => {
              x.isActived = false
            })
          }
          if(k.type === 'input-range' && !k.value?.length) {
            k.value = []
          }
        }
        filterList.value = list
      } else {
        filterList.value = []
      }
    }

    function handleRadioChange(item, opt, _optIdx, _index) {
      if (item.value === opt.value) {
        item.value = null;
      } else {
        item.value = opt.value;
      }
    }
    function handleCheckboxChange(item, opt, _optIdx, _index) {
      if (opt.isActived) {
        opt.isActived = false
        if (item.value?.length) {
          const idx = item.value.findIndex((k) => k === opt.value)
          item.value.splice(idx, 1)
        } else {
          item.value = []
        }
      } else {
        if (item.value?.length) {
          item.value.push(opt.value)
        } else {
          item.value = [opt.value]
        }
        opt.isActived = true
      }
    }
    function handleSliderChange(event, item, _index) {
      const v = event.detail.value
      item.value = v
    }
    function handleSelectChange(v, item, _index) {
      // item.value = v?.value
    }

    function handleLink(url) {
      if (url) {
        uni.navigateTo({
          url,
        })
      }
    }
    function handleReset() {
      initData(props.dropdownItem || [], true)
    }
    function handleConfirm() {
      const list = deepClone(filterList.value)

      if (props.dropdownItem?.prop) {
        const obj = {}
        for (let i = 0; i < list.length; i++) {
          const k = list[i]
          if (k.value || k.value === 0 || k.value === '0' ||k.value === '') {
            obj[k.prop] = k.value
            if(k.type === 'input-range') {
              obj[k.prop+'Start'] = k.value[0]??null
              obj[k.prop+'End'] = k.value[1]??null
            }
          }
        }
        const res = { [props.dropdownItem.prop]: obj }
        emit('success', res, obj, props.dropdownIndex)
      } else {
        console.error(`菜单项${props.dropdownItem.title}未定义prop，返回内容失败`)
      }
    }
    const handleInputRangeChange = (item, index) => {
      nextTick(() => {
        item.value[index] = formatNumber(item.value[index] || '')
      })
    }

    watch(
      () => props.dropdownItem,
      (v) => {
        initData(v || null)
      },
      { immediate: true },
    )

    return {
      filterList,
      handleRadioChange,
      handleCheckboxChange,
      handleSliderChange,
      handleSelectChange,
      handleReset,
      handleConfirm,
      handleLink,
      handleInputRangeChange,
    }
  },
})
</script>

<style lang="scss" scoped>
// 多条件筛选
.da-dropdown-filter {
  &-box {
    padding: 0 24rpx;
    line-height: 1;
  }

  &--title {
    flex-shrink: 0;
    padding: 20rpx 0;
    font-size: 26rpx;
    color: var(--dropdown-text-color);
    white-space: nowrap;
  }

  &-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap:10px;
    .search-boxss{
      --wot-search-input-bg: #f5f5f5 !important;
    }
  }
}

.da-dropdown-tag {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  // margin-right: 20rpx;
  // margin-bottom: 20rpx;
  overflow: hidden;
  font-size: 14px;
  color: var(--dropdown-text-color);
  background-color: #f5f5f5;
  border-radius: 16px;

  &--text {
    position: relative;
    z-index: 1;
  }

  &.is-actived {
    color: var(--dropdown-theme-color);
    background-color: #fff;

    &::after {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 0;
      content: '';
      background-color: var(--dropdown-theme-color);
      opacity: 0.05;
    }
  }
}
</style>
