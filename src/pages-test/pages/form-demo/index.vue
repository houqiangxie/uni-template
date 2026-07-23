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

const { t } = useI18n()

const serviceModeOptions = computed(() => [
  { text: t('formDemo.serviceMode.online'), value: 'online' },
  { text: t('formDemo.serviceMode.offline'), value: 'offline' },
])

const genderOptions = computed(() => [
  { text: t('formDemo.gender.male'), value: 'male' },
  { text: t('formDemo.gender.female'), value: 'female' },
])

const hobbyOptions = computed(() => [
  { text: t('formDemo.hobbies.reading'), value: 'reading' },
  { text: t('formDemo.hobbies.sports'), value: 'sports' },
  { text: t('formDemo.hobbies.music'), value: 'music' },
])

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
  { prop: 'name', label: t('formDemo.fields.name'), compType: 'input', required: true },
  { prop: 'phone', label: t('formDemo.fields.phone'), compType: 'input', required: true, validationType: 'phone' },
  { prop: 'email', label: t('formDemo.fields.email'), compType: 'input', validationType: 'email' },
  { prop: 'gender', label: t('formDemo.fields.gender'), compType: 'radio', columns: genderOptions.value },
  { prop: 'hobbies', label: t('formDemo.fields.hobbies'), compType: 'checkbox', columns: hobbyOptions.value },
  { prop: 'remark', label: t('formDemo.fields.remark'), compType: 'textarea' },
])

const securityConfig = computed(() => [
  {
    prop: 'password',
    label: t('formDemo.fields.password'),
    compType: 'input',
    required: true,
    inputType: 'password',
    extendRules: [
      { min: 6, message: t('formDemo.rules.passwordMin') },
      { validator: (v: string) => !v || /[A-Z]/.test(v), message: t('formDemo.rules.passwordUpper') },
    ],
  },
  {
    prop: 'confirmPassword',
    label: t('formDemo.fields.confirmPassword'),
    compType: 'input',
    required: true,
    inputType: 'password',
    customValidators: [
      ({ value, model }: { value: string, model: Record<string, any> }) =>
        value === model.password || t('formDemo.rules.passwordMismatch'),
    ],
  },
  { prop: 'startDate', label: t('formDemo.fields.startDate'), compType: 'input', required: true },
  {
    prop: 'endDate',
    label: t('formDemo.fields.endDate'),
    compType: 'input',
    required: true,
    extendRules: modelRules(
      ({ value, model }: { value: string, model: Record<string, any> }) =>
        !value || !model.startDate || value >= model.startDate || t('formDemo.rules.endDateEarly'),
    ),
  },
  {
    prop: 'serviceMode',
    label: t('formDemo.fields.serviceMode'),
    compType: 'select',
    columns: serviceModeOptions.value,
  },
  { prop: 'address', label: t('formDemo.fields.address'), compType: 'input' },
])

const membersFormConfig = computed(() => [
  loopField({
    arrayPath: 'members',
    itemTitle: ({ index }: { index: number }) => t('formDemo.memberTitle', { index: index + 1 }),
    fields: [
      { prop: 'name', label: t('formDemo.fields.name'), compType: 'input', required: true },
      { prop: 'phone', label: t('formDemo.fields.phone'), compType: 'input', required: true, validationType: 'phone' },
    ],
  }),
])

const schema = computed(() => configToSchema(
  () => basicConfig.value,
  () => securityConfig.value,
  {
    extraRules: (model) => ({
      ...(model.serviceMode === 'offline'
        ? { address: [{ required: true, message: t('formDemo.rules.addressRequired') }] }
        : {}),
    }),
    formValidators: [
      (model) => {
        if (model.members?.length && model.members.some((m: { phone: string }) => m.phone === model.phone))
          return { path: 'phone', message: t('formDemo.rules.phoneDuplicate') }
        return true
      },
    ],
    loops: loopField({
      arrayPath: 'members',
      itemPrefix: ({ index }: { index: number }) => t('formDemo.memberPrefix', { index: index + 1 }),
      fields: [
        { prop: 'name', label: t('formDemo.fields.name'), compType: 'input', required: true },
        { prop: 'phone', label: t('formDemo.fields.phone'), compType: 'input', required: true, validationType: 'phone' },
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
    uni.showToast({ title: t('formDemo.rules.memberMin'), icon: 'none' })
    return
  }
  formModel.members.splice(index, 1)
}

async function handleSubmit() {
  const valid = await validate()
  if (!valid)
    return

  uni.showModal({
    title: t('formDemo.submitSuccess'),
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
      {{ t('formDemo.intro') }}
    </view>
    <view class="flex-1 overflow-hidden">
      <scroll-view class="container h-full" scroll-y :scroll-top="scrollTop" scroll-with-animation>
  
        <wd-form ref="formRef" :model="formModel" :schema="schema" layout="horizontal" title-width="auto">
          <view class="form-demo__section">
            <view class="form-demo__section-title">{{ t('formDemo.sections.basic') }}</view>
            <com-form :config="basicConfig" :form="formModel" embedded />
          </view>
  
          <view class="form-demo__section">
            <view class="form-demo__section-title">{{ t('formDemo.sections.validation') }}</view>
            <com-form :config="securityConfig" :form="formModel" embedded />
          </view>
  
          <view class="form-demo__section">
            <view class="form-demo__section-title">{{ t('formDemo.sections.members') }}</view>
            <com-form :config="membersFormConfig" :form="formModel" embedded>
              <template #loop-head="{ loopIndex, title }">
                <text>{{ title }}</text>
                <wd-button size="small" type="error" plain @click="removeMember(loopIndex)">
                  {{ t('common.delete') }}
                </wd-button>
              </template>
            </com-form>
            <view class="form-demo__add-member">
              <wd-button size="small" plain block @click="addMember">
                {{ t('formDemo.addMember') }}
              </wd-button>
            </view>
          </view>
        </wd-form>
      </scroll-view>
    </view>
    <view class="footer-box">
      <wd-button type="primary"  @click="handleSubmit">
        {{ t('common.submit') }}
      </wd-button>
      <wd-button  custom-class="form-demo__reset-btn" @click="handleReset">
        {{ t('common.reset') }}
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
