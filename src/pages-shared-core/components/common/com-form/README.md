# 动态表单组件使用说明

基于 `wot-ui` 封装的动态表单组件，负责按 config 渲染 `wd-form-item` 字段；校验规则通过 `configToSchema` 生成后挂在 `wd-form :schema` 上。

**推荐链路：** `config` → `configToSchema` → `wd-form :schema` + `com-form :config`

校验 API 与配置说明见：`src/utils/formConfig.ts`（含 `configToSchema`、`rulesToSchema`、`modelRules` 等）

## 快速对照

| 场景 | 写法 |
|------|------|
| 必填 / 手机号等 | `required: true` / `validationType: 'phone'` |
| 单字段多条规则 | `extendRules: [{ validator, message }, ...]` |
| 跨字段（推荐） | `customValidators: [({ value, model }) => ...]` |
| 跨字段简写 | `extendRules: modelRules(...)` |
| slot / 条件 rules | `configToSchema(config, { extraRules: (model) => ({...}) })` |
| 表单级多字段 | `configToSchema(config, { formValidators: [...] })` |
| v-for 循环 | `loopField({ arrayPath, fields: (ctx) => [...] })` |
| 多个 com-form | `configToSchema(blockA, blockB, ...)` |

## 基本用法

外层 `wd-form` 承载 model 与 schema，`com-form` 只负责渲染字段：

```vue
<script setup>
import { configToSchema } from '@/utils/formConfig'
import { useForm } from '@/composables/useForm'

const formModel = reactive({
  name: '',
  phone: '',
  email: '',
})

const formConfig = [
  { prop: 'name', label: '姓名', compType: 'input', required: true },
  { prop: 'phone', label: '手机号', compType: 'input', required: true, validationType: 'phone' },
  { prop: 'email', label: '邮箱', compType: 'input', validationType: 'email' },
]

const schema = computed(() => configToSchema(formConfig))

const { scrollTop, formRef, validate } = useForm()

async function handleSubmit() {
  const valid = await validate()
  if (valid) {
    // 提交逻辑
  }
}
</script>

<template>
  <scroll-view class="container" scroll-y :scroll-top="scrollTop" scroll-with-animation>
    <wd-form ref="formRef" :model="formModel" :schema="schema" layout="horizontal" title-width="auto">
      <com-form :config="formConfig" :form="formModel" embedded />
    </wd-form>
    <wd-button type="primary" block @click="handleSubmit">
      提交
    </wd-button>
  </scroll-view>
</template>
```

> `scroll-view` 需绑定 `:scroll-top="scrollTop"`，且 `class="container"` 写在 scroll-view 上，校验失败时才会自动滚动到首个错误字段。

## 校验用法示例

### 1. required + validationType

```javascript
const formConfig = [
  { prop: 'name', label: '姓名', compType: 'input', required: true },
  { prop: 'phone', label: '手机号', compType: 'input', required: true, validationType: 'phone' },
]
const schema = computed(() => configToSchema(formConfig))
```

### 2. extendRules（单字段多条规则）

```javascript
{
  prop: 'password',
  label: '密码',
  compType: 'input',
  required: true,
  extendRules: [
    { min: 6, message: '密码至少6位' },
    { validator: v => !v || /[A-Z]/.test(v), message: '须包含大写字母' },
  ],
}
```

### 3. customValidators（跨字段，推荐）

```javascript
{
  prop: 'confirmPassword',
  label: '确认密码',
  compType: 'input',
  required: true,
  customValidators: [
    ({ value, model }) => value === model.password || '两次密码不一致',
  ],
}
```

### 4. modelRules（跨字段简写）

```javascript
{
  prop: 'endDate',
  label: '结束日期',
  compType: 'input',
  required: true,
  extendRules: modelRules(
    ({ value, model }) => !value || !model.startDate || value >= model.startDate || '不能早于开始日期',
  ),
}
```

### 5. extraRules（slot 字段 / 条件校验）

slot 字段不在 config 自动 rules 里，需手动补；也可按 model 动态追加：

```javascript
const schema = computed(() => configToSchema(formConfig, {
  extraRules: (model) => ({
    categoryName: [{
      modelValidator: ({ model: m }) => !!m.categoryId || '请选择分类',
    }],
    ...(model.serviceMode === 'offline'
      ? { address: [{ required: true, message: '线下服务请输入地址' }] }
      : {}),
  }),
}))
```

模板中 slot 字段需手写 `wd-form-item`：

```vue
<wd-form-item title="分类" prop="categoryName">
  <wd-input v-model="formModel.categoryName" bordered readonly placeholder="选择后自动填充" />
</wd-form-item>
```

### 6. formValidators（表单级校验）

```javascript
const schema = computed(() => configToSchema(formConfig, {
  formValidators: [
    (model) => {
      if (model.startTime && model.endTime && model.endTime < model.startTime)
        return { path: 'endTime', message: '结束时间不能早于开始时间' }
      return true
    },
  ],
}))
```

### 7. loopField（循环列表）

config 与 schema 共用 `loopField`：

```javascript
import { configToSchema, loopField } from '@/utils/formConfig'

const membersFormConfig = computed(() => [
  loopField({
    arrayPath: 'members',
    itemTitle: ({ index }) => `成员 ${index + 1}`,
    fields: [
      { prop: 'name', label: '姓名', compType: 'input', required: true },
      { prop: 'phone', label: '电话', compType: 'input', required: true, validationType: 'phone' },
    ],
  }),
])

const schema = computed(() => configToSchema(baseConfig, {
  loops: loopField({ arrayPath: 'members', fields: [...] }),
}))
```

模板：

```vue
<com-form :config="membersFormConfig" :form="formModel" embedded>
  <template #loop-head="{ loopIndex, title }">
    <text>{{ title }}</text>
    <wd-button size="small" type="danger" variant="plain" @click="removeMember(loopIndex)">删除</wd-button>
  </template>
</com-form>
```

### 8. 多个 com-form 块

```javascript
const schema = computed(() => configToSchema(blockAConfig, blockBConfig))
```

## 完整示例

综合以上用法的完整页面示例：

```vue
<script setup>
import { configToSchema, loopField, modelRules } from '@/utils/formConfig'
import { useForm } from '@/composables/useForm'

const formModel = reactive({
  name: '',
  phone: '',
  password: '',
  confirmPassword: '',
  startDate: '',
  endDate: '',
  serviceMode: 'online',
  address: '',
  categoryId: '',
  categoryName: '',
  members: [{ name: '', phone: '' }],
})

const blockAConfig = [
  { prop: 'name', label: '姓名', compType: 'input', required: true },
  { prop: 'phone', label: '手机号', compType: 'input', required: true, validationType: 'phone' },
]

const blockBConfig = computed(() => [
  {
    prop: 'password',
    label: '密码',
    compType: 'input',
    required: true,
    extendRules: [
      { min: 6, message: '密码至少6位' },
      { validator: v => !v || /[A-Z]/.test(v), message: '须包含大写字母' },
    ],
  },
  {
    prop: 'confirmPassword',
    label: '确认密码',
    compType: 'input',
    required: true,
    customValidators: [
      ({ value, model }) => value === model.password || '两次密码不一致',
    ],
  },
  { prop: 'startDate', label: '开始日期', compType: 'input', required: true },
  {
    prop: 'endDate',
    label: '结束日期',
    compType: 'input',
    required: true,
    extendRules: modelRules(
      ({ value, model }) => !value || !model.startDate || value >= model.startDate || '不能早于开始日期',
    ),
  },
  { prop: 'serviceMode', label: '服务方式', compType: 'input', placeholder: 'online / offline' },
  { prop: 'address', label: '地址', compType: 'input' },
])

const membersFormConfig = computed(() => [
  loopField({
    arrayPath: 'members',
    itemTitle: ({ index }) => `成员 ${index + 1}`,
    fields: [
      { prop: 'name', label: '姓名', compType: 'input', required: true },
      { prop: 'phone', label: '电话', compType: 'input', required: true, validationType: 'phone' },
    ],
  }),
])

const schema = computed(() => configToSchema(
  blockAConfig,
  () => blockBConfig.value,
  {
    extraRules: model => ({
      categoryName: [{
        modelValidator: ({ model: m }) => !!m.categoryId || '请选择分类',
      }],
      ...(model.serviceMode === 'offline'
        ? { address: [{ required: true, message: '线下服务请输入地址' }] }
        : {}),
    }),
    formValidators: [
      (model) => {
        if (model.members?.length && model.members.some(m => m.phone === model.phone))
          return { path: 'phone', message: '负责人电话不能与成员电话重复' }
        return true
      },
    ],
    loops: loopField({
      arrayPath: 'members',
      itemPrefix: ({ index }) => `第${index + 1}位成员`,
      fields: [
        { prop: 'name', label: '姓名', compType: 'input', required: true },
        { prop: 'phone', label: '电话', compType: 'input', required: true, validationType: 'phone' },
      ],
    }),
  },
))

const { scrollTop, formRef, validate } = useForm()

async function handleSubmit() {
  const valid = await validate()
  if (valid)
    console.log('表单数据：', formModel)

}
</script>

<template>
  <scroll-view class="container" scroll-y :scroll-top="scrollTop" scroll-with-animation>
    <wd-form ref="formRef" :model="formModel" :schema="schema" layout="horizontal" title-width="auto">
      <com-form :config="blockAConfig" :form="formModel" embedded />
      <com-form :config="blockBConfig" :form="formModel" embedded />
      <com-form :config="membersFormConfig" :form="formModel" embedded />
    </wd-form>
    <wd-button type="primary" block @click="handleSubmit">
      提交
    </wd-button>
  </scroll-view>
</template>
```

## 配置项说明

### 基础配置

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prop | String | 是 | 字段名，对应 form 中的属性 |
| label | String | 是 | 字段标签 |
| compType | String | 是 | 组件类型 |
| required | Boolean | 否 | 是否必填，默认 false |
| placeholder | String | 否 | 提示文字，不传则自动生成 |

### 组件类型 (compType)

- `input` - 输入框
- `textarea` - 文本域
- `select` - 选择器
- `radio` - 单选框
- `checkbox` - 复选框
- `date` - 日期选择器
- `upload` - 文件上传
- `tree` - 树形选择器
- `slot1` ~ `slot5` - 自定义插槽

### 快捷校验 (validationType)

- `phone` - 手机号
- `idCard` - 身份证号
- `email` - 邮箱
- `tel` - 固定电话
- `number` - 数字
- `positiveInteger` - 正整数
- `nonNegative` - 非负数
- `creditCode` - 统一社会信用代码
- `bankCard` - 银行卡号

### 扩展校验 (extendRules)

```javascript
{
  prop: 'password',
  label: '密码',
  compType: 'input',
  required: true,
  extendRules: [
    { validator: (value) => value.length >= 6, message: '密码长度不能少于6位' },
    { validator: (value) => /[A-Z]/.test(value), message: '密码必须包含大写字母' },
  ],
}
```

### 自定义校验消息 (validationMessage)

```javascript
{
  prop: 'phone',
  label: '联系电话',
  compType: 'input',
  required: true,
  validationType: 'phone',
  validationMessage: '请输入正确的联系电话',
}
```

## com-form Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| config | Array | `[]` | 字段配置 |
| form | Object | `{}` | 表单 model（响应式对象） |
| disabled | Boolean | `false` | 全局禁用 |
| vertical | Boolean | `false` | 垂直布局 |
| embedded | Boolean | `false` | 嵌入 wd-form 内时使用，去掉外边距 |
| border | Boolean | `true` | 是否显示边框 |
| basePath | String | `''` | 嵌套路径前缀 |

## 注意事项

1. 校验挂在 `wd-form :schema`，`com-form` 不处理 rules
2. `useForm` 校验失败后会滚动到首个 `wd-form-item` 错误，需配合 `scroll-view` + `:scroll-top`
3. slot 字段的 rules 通过 `extraRules` 手动补充
4. 多个 `com-form` 块合并 schema：`configToSchema(blockA, blockB, ...)`
5. 校验优先级：必填 > 快捷校验 > 扩展校验
