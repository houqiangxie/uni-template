<route>
{
  "layout": "default",
  "style": {
    "navigationBarTitleText": "表单示例"
  }
}
</route>

<script setup lang="ts">
import { configToSchema, loopField, modelRules } from '@/utils/formConfig'
import { useForm } from '@/composables/useForm'

const serviceModeOptions = [
  { text: '线上', value: 'online' },
  { text: '线下', value: 'offline' },
]

const genderOptions = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' },
]

const hobbyOptions = [
  { text: '阅读', value: 'reading' },
  { text: '运动', value: 'sports' },
  { text: '音乐', value: 'music' },
]

const formModel = reactive({
  name: '',
  phone: '',
  email: '',
  gender: 'male',
  hobbies: [] as string[],
  remark: '',
  password: '',
  confirmPassword: '',
  startDate: '',
  endDate: '',
  serviceMode: 'online',
  address: '',
  members: [{ name: '', phone: '' }],
})

const basicConfig = computed(() => [
  { prop: 'name', label: '姓名', compType: 'input', required: true },
  { prop: 'phone', label: '手机号', compType: 'input', required: true, validationType: 'phone' },
  { prop: 'email', label: '邮箱', compType: 'input', validationType: 'email' },
  { prop: 'gender', label: '性别', compType: 'radio', columns: genderOptions },
  { prop: 'hobbies', label: '爱好', compType: 'checkbox', columns: hobbyOptions },
  { prop: 'remark', label: '备注', compType: 'textarea' },
])

const securityConfig = computed(() => [
  {
    prop: 'password',
    label: '密码',
    compType: 'input',
    required: true,
    inputType: 'password',
    extendRules: [
      { min: 6, message: '密码至少6位' },
      { validator: (v: string) => !v || /[A-Z]/.test(v), message: '须包含大写字母' },
    ],
  },
  {
    prop: 'confirmPassword',
    label: '确认密码',
    compType: 'input',
    required: true,
    inputType: 'password',
    customValidators: [
      ({ value, model }: { value: string, model: Record<string, any> }) =>
        value === model.password || '两次密码不一致',
    ],
  },
  { prop: 'startDate', label: '开始日期', compType: 'input', required: true },
  {
    prop: 'endDate',
    label: '结束日期',
    compType: 'input',
    required: true,
    extendRules: modelRules(
      ({ value, model }: { value: string, model: Record<string, any> }) =>
        !value || !model.startDate || value >= model.startDate || '不能早于开始日期',
    ),
  },
  {
    prop: 'serviceMode',
    label: '服务方式',
    compType: 'select',
    columns: serviceModeOptions,
  },
  { prop: 'address', label: '地址', compType: 'input' },
])

const membersFormConfig = computed(() => [
  loopField({
    arrayPath: 'members',
    itemTitle: ({ index }: { index: number }) => `成员 ${index + 1}`,
    fields: [
      { prop: 'name', label: '姓名', compType: 'input', required: true },
      { prop: 'phone', label: '手机号', compType: 'input', required: true, validationType: 'phone' },
    ],
  }),
])

const schema = computed(() => configToSchema(
  () => basicConfig.value,
  () => securityConfig.value,
  {
    extraRules: (model) => ({
      ...(model.serviceMode === 'offline'
        ? { address: [{ required: true, message: '线下服务请输入地址' }] }
        : {}),
    }),
    formValidators: [
      (model) => {
        if (model.members?.length && model.members.some((m: { phone: string }) => m.phone === model.phone))
          return { path: 'phone', message: '负责人电话不能与成员电话重复' }
        return true
      },
    ],
    loops: loopField({
      arrayPath: 'members',
      itemPrefix: ({ index }: { index: number }) => `第${index + 1}位成员`,
      fields: [
        { prop: 'name', label: '姓名', compType: 'input', required: true },
        { prop: 'phone', label: '手机号', compType: 'input', required: true, validationType: 'phone' },
      ],
    }),
  },
))

const { scrollTop, formRef, validate } = useForm()

function addMember() {
  formModel.members.push({ name: '', phone: '' })
}

function removeMember(index: number) {
  if (formModel.members.length <= 1) {
    uni.showToast({ title: '至少保留一位成员', icon: 'none' })
    return
  }
  formModel.members.splice(index, 1)
}

async function handleSubmit() {
  const valid = await validate()
  if (!valid)
    return

  uni.showModal({
    title: '校验通过',
    content: JSON.stringify(formModel, null, 2),
    showCancel: false,
  })
}

function handleReset() {
  Object.assign(formModel, {
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    hobbies: [],
    remark: '',
    password: '',
    confirmPassword: '',
    startDate: '',
    endDate: '',
    serviceMode: 'online',
    address: '',
    members: [{ name: '', phone: '' }],
  })
}
</script>

<template>
  <view class="h-full flex flex-col form-demo card-form">
    <view class="form-demo__intro">
      本页演示 com-form + configToSchema 的常用写法，包含基础字段、校验规则、条件校验与循环列表。
    </view>
    <view class="flex-1 overflow-hidden">
      <scroll-view class="container h-full" scroll-y :scroll-top="scrollTop" scroll-with-animation>

        <wd-form ref="formRef" :model="formModel" :schema="schema" layout="horizontal" title-width="auto">
          <view class="form-demo__section">
            <view class="form-demo__section-title">基础信息</view>
            <com-form :config="basicConfig" :form="formModel" embedded />
          </view>

          <view class="form-demo__section">
            <view class="form-demo__section-title">校验示例</view>
            <com-form :config="securityConfig" :form="formModel" embedded />
          </view>

          <view class="form-demo__section">
            <view class="form-demo__section-title">成员列表</view>
            <com-form :config="membersFormConfig" :form="formModel" embedded>
              <template #loop-head="{ loopIndex, title }">
                <text>{{ title }}</text>
                <wd-button size="small" type="error" plain @click="removeMember(loopIndex)">
                  删除
                </wd-button>
              </template>
            </com-form>
            <view class="form-demo__add-member">
              <wd-button size="small" plain block @click="addMember">
                添加成员
              </wd-button>
            </view>
          </view>
        </wd-form>
      </scroll-view>
    </view>
    <view class="footer-box">
      <wd-button type="primary" @click="handleSubmit">
        提交
      </wd-button>
      <wd-button custom-class="form-demo__reset-btn" @click="handleReset">
        重置
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.form-demo {
  padding: 24rpx 24rpx 48rpx;
  background: #f5f7fa;
  box-sizing: border-box;

  &__intro {
    margin-bottom: 24rpx;
    padding: 24rpx;
    font-size: 26rpx;
    line-height: 1.6;
    color: #4e5969;
    background: #fff;
    border-radius: 16rpx;
  }

  &__section {
    margin-bottom: 24rpx;
    overflow: hidden;
    background: #fff;
    border-radius: 16rpx;
  }

  &__section-title {
    padding: 24rpx 24rpx 8rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: #1d2129;
  }

  &__add-member {
    padding: 0 24rpx 24rpx;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    margin-top: 8rpx;
  }

  :deep(.form-demo__reset-btn) {
    margin-top: 0 !important;
  }
}
</style>
