<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2022-05-25 11:37:54
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-15 09:57:18
-->


<template>
  <div class="common-form w-full bg-white" :class="{ disabled: formDisabled }">
    <div :class="`form_box w-full grid grid-cols-${cols} gap-x-5`">
      <nut-form  ref="form" :model-value="formModel" :label-width="80" label-align="right"  v-bind="bindForm">
        <nut-form-item
          v-for="(item, index) in config" v-show="!item.hidden" :key="index"
          :class="`col-span-1 `" :label="item.label" :prop="item.key" :required="item.required" :rules="setRule(item)" v-bind="item.bindItem"
        >
          <slot v-if="item.bind?.slotName" :name="item.bind.slotName" :row="item" />
          <RenderComponent v-else-if="item.renderComponent"
              :data="() => item.renderComponent?.(item, formModel, formModel[item.key])">
          </RenderComponent>
          <component
            :is="componentList[item.component || 'input']" v-else v-model="formModel[item.key]"
            class="w-full"
            :clearable="false"
            :border="false"
            @blur="validateItem(item.key)"
            v-bind="item.bind" 
            v-on="{ ...item.on }"
          >
            <template #[si] v-for="(sl, si) in item?.slot" :key="si">
                <RenderComponent :data="() => sl(item, formModel, formModel[item.key])">
                </RenderComponent>
            </template>
          </component>
        </nut-form-item>
        <slot />
      </nut-form>
    </div>
  </div>
</template>
<script lang="tsx" setup>
import input from 'nutui-uniapp/components/input/input.vue'
import textarea from 'nutui-uniapp/components/textarea/textarea.vue'
// import filePicker from '@/components/common/FilePicker.vue'
import selectPlus from '@/components/common/SelectPlus.vue'
import fileUpload from '@/components/common/FileUpload.vue'
// import sign from '@/components/common/Sign.vue'
// import html from '@/components/common/Html.vue'

// 组件使用方法
// const configItem:ConfigItem = {
//     title: '文字',
//     key: 'key',
//     required: false,
//     notValidate: false,
//     hidden: false,
//     component: 'NInput',
//     options: [{label:'33',value:'33'}], //select,tree等下拉list
//     type: 'input', //日期组件或textarea等组件type
//     on: {'updateValue':()=>{}},//bind到动态组件的事件，需要什么属性参考组件文档
//     bind: {disabled:true,pattern:/^.+$/,},//bind到动态组件的属性，需要什么属性参考组件文档  pattern表单校验正则，patternType默认校验的正则（validateReg）fileType自定义文件校验类型
//     slot: {default:(item: any, formModel: any, curData: any)=>(<div>3333</div>)},//动态组件slot插槽  插槽内容可以为string,html tsx
//     bindItem: {class:'col-span-2'} //bind到formItem的属性（class等）
//     renderComponent: ((item: any, formModel: any, curData: any) => any) //自定義render函數渲染組件 内容可以为string,html tsx
// }
const { config = [], cols = 2, formModel = {}, basePath = '', formDisabled = false, bindForm = {} } = defineProps<{
  config: Array<ConfigItem>
  cols?: number // grid布局列
  formModel: any // 双向bind值
  basePath?: string// 表单校验基础路径
  formDisabled?: boolean // 表单禁用隐藏
  bindForm?: Record<string, any> // bind到form的属性
}>()
const form = ref()
const RenderComponent = (props: any) => {
    return h(<>{props.data()}</>)
}
// 备注：当同一个label需要渲染多个组件，key,component,required，options,bind，bindItem等属性需要数组形式 bindItem:{showSlot:true,slotName:'name'}会优先渲染动态插槽
interface ConfigItem {
  label?: string // 搜索标签
  title?: string// 搜索标签
  key: string // 绑定model的key
  name?: string | string[] // 绑定校验类型
  required?: boolean // 必填属性
  notValidate?: boolean // 是否校验
  hidden?: boolean // 是否渲染该字段
  component?: string // 组件名称 'NInput'
  options?: Array<any> // select,tree等下拉list
  validateRule?: any // 校验扩展
  type?: string // 日期组件或textarea等组件type
  on?: Record<string, any>// bind到动态组件的事件，需要什么属性参考组件文档
  bind?: Record<string, any>// bind到动态组件的属性，需要什么属性参考组件文档
  slot?: Record<string, any>// 动态组件slot插槽
  bindItem?: Record<string, any> // bind到formItem的属性（class等）
  renderComponent?: ((item: any, formData: any, curData: any) => any) // 自定義render函數渲染組件
}
const componentList: Record<string, any> = {
  input,
  textarea,
  // checkbox,
  // combox,
  // dataPicker,
  // dateTimePicker,
  // filePicker,
  selectPlus,
  fileUpload,
  // sign,
  // html,
  // select:defineAsyncComponent(()=>import('@dcloudio/uni-ui/lib/uni-data-select/uni-data-select.vue')),
  // checkbox:defineAsyncComponent(()=>import('@dcloudio/uni-ui/lib/uni-data-checkbox/uni-data-checkbox.vue')),
  // combox:defineAsyncComponent(()=>import('@dcloudio/uni-ui/lib/uni-combox/uni-combox.vue')),
  // dataPicker:defineAsyncComponent(()=>import('@dcloudio/uni-ui/lib/uni-data-picker/uni-data-picker.vue')),
  // datetimePicker:defineAsyncComponent(()=>import('@dcloudio/uni-ui/lib/uni-datetime-picker/uni-datetime-picker.vue')),
  // filePicker: defineAsyncComponent(() => import('@/components/common/FilePicker.vue')),
  // selectPlus: defineAsyncComponent(() => import('@/components/common/SelectPlus.vue')),
  // UploadFile: defineAsyncComponent(() => import('@/components/common/UploadFile.vue')),
  // UserSelect: defineAsyncComponent(() => import('@/components/common/UserSelect.vue')),
  // CommonDatePicker: defineAsyncComponent(() => import('@/components/common/CommonDatePicker.vue')),
  // ESign: defineAsyncComponent(() => import('@/components/common/ESign.vue')),
}

// 默认校验正则
const validateReg: Record<string, RegExp> = {
  default: /^.+$/, // 非空正则
  phone: /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/, // 手机号
  phone_prefix: /\d{3,4}/, // 固话前缀
  phone_suffix: /\d{7,8}/, // 固话后缀
  phone_number: /^((0\d{2,3}-\d{7,8})|(1[3456789]\d{9}))$/, // 手机号和固话
}

// 列校验
function setRule(item: any): Record<string, any> {
  const rule: Record<string, any> = {}

  const value: any = formModel[item.key]
  const bind = item.bind || {}
  let fileType: string = 'string'
  switch (item.component) {
    case 'fileUpload':
    case 'filePicker': fileType = item.bind?.limit == 1 ? 'object' : 'array'; break
    case 'dateTimePicker':
      switch (item.bind?.type) {
        case 'date':
        case 'datetime':
          fileType = 'string'
          break
        case 'daterange':
        case 'datetimerange':
          fileType = 'array'
          break

        default:
          break
      }
      break
    default: fileType = typeof value == 'undefined' ? 'string' : typeof value; break
  }
  if (item.bind?.multiple) fileType = 'array'
  rule.fileType = bind?.fileType ?? fileType

  rule.required = item.required
  rule.message = bind.message || (`${bind.label || bind.title || item.title || item.label}不能为空`)
  if(bind.patternType) rule.regex= validateReg[bind.patternType]|| validateReg.default
  if(bind.pattern) rule.regex= bind.pattern
  if ((rule.fileType=='array'|| rule.fileType=='object')&&rule.required) {
    rule.validator = (data:any) => {
      return data?Object.values(data)?.length?true:false:false
    }
  }
  return [rule, ...(bind.extendRules || [])]
}

function validate(key:string) {
  return new Promise((resolve, reject) => {
    form.value.validate(key).then(({valid,errors}:any) => {
      if (valid) resolve(true)
      else resolve(false)
    })
  })
}

const validateItem = (key:string='') => {
  validate(key)
}

provide('validateItem', validateItem)

defineExpose({ validate })
</script>
<style lang="scss" scoped>
.common-form{
    box-sizing: border-box;
    :deep(.is-disabled){
        background-color: #fff !important;
        color: #303133;
        .uni-easyinput__content-input{
            padding: 0 !important;
        }
    }
    // :deep(.uni-forms-item__content){
    //     overflow: hidden;
    // }
    // &.disabled {
    //     :deep(.)
    // }
    // :deep(.uni-input-input){
    //     text-align: left;
    //     padding-left: 10px;
    // }
}
</style>
