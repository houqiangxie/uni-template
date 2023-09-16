<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-10 15:40:26
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-08 17:03:48
-->
<script lang="ts" setup>
const commonForm = ref()
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const formModel = ref({ saQuaList: [], busLicenseList: [], proList: [], contractList: [] })
const config = reactive([
  { label: '相关方类型', key: 'rpType', component: 'selectPlus', required: true, bind: { columns: rpTypeList } },
  { label: '单位名称', key: 'partyName', component: 'input', required: true, bind: { disabled: true } },
  // { label: '单位名称', key: 'partyName', component: 'selectPlus', required: true, bind: { remote: true, showType: 'relUnit', disabled: true } },
  { label: '所属行业', key: 'industry', component: 'dataPicker', required: true, bind: { localdata: [] } },
  { label: '统一信用代码', key: 'orgCode', component: 'input', required: true, bind: {} },
  { label: '所属地区', key: 'region', component: 'dataPicker', required: true, bind: { localdata: [] } },
  { label: '详细地址', key: 'detailedAddress', component: 'input', required: false, bind: {} },
  // { label: '经济性质', key: 'econNature', component: 'selectPlus', required: true, bind: { columns: econNatureList } },
  { label: '法定代表人', key: 'legalRep', component: 'input', required: false, bind: { maxlength: 20 } },
  { label: '联系电话', key: 'legalContact', component: 'input', required: false, bind: { patternType: 'phone', message: '请输入11位手机号码', type: 'number' } },
  { label: '主要负责人', key: 'mainPersonCharge', component: 'input', required: true, bind: { maxlength: 20 } },
  { label: '联系电话', key: 'mainPersonContact', component: 'input', required: true, bind: { patternType: 'phone', message: '请输入11位手机号码',type: 'number' } },
  { label: '营业范围', key: 'busScope', component: 'input', required: false, bind: {} },
  { label: '营业执照', key: 'busLicenseList', component: 'fileUpload', required: false, bind: { multiple: true } },
  // { label: '安全生产许可证', key: 'proList', component: 'fileUpload', required: false, bind: { multiple: true } },
  { label: '安全资质证书', key: 'saQuaList', component: 'fileUpload', required: false, bind: { multiple: true } },
  { label: '委托合同/协议', key: 'contractList', component: 'fileUpload', required: false, bind: { multiple: true } },
  { label: '合同服务范围', key: 'conSerScope', component: 'input', required: true, bind: { maxlength: 500, type: 'textarea', autoHeight: true } },
  { label: '甲方职责', key: 'firstPartyScope', component: 'input', required: true, bind: { maxlength: 500, type: 'textarea', autoHeight: true } },
  { label: '乙方职责', key: 'secondPartyScope', component: 'input', required: true, bind: { maxlength: 500, type: 'textarea', autoHeight: true } },
])

async function getDetail(id) {
  if (id) {
    formModel.value = await getRelUnitDetailById(id)
    const data = await getFileListById(id)
    formModel.value.saQuaList = []
    formModel.value.busLicenseList = []
    formModel.value.proList = []
    formModel.value.contractList = []
    data.forEach((file) => {
      switch (file.type) {
        case 1:
          formModel.value.saQuaList?.push(file)
          break
        case 2:
          formModel.value.busLicenseList?.push(file)
          break
        case 3:
          formModel.value.proList?.push(file)
          break
        case 4:
          formModel.value.contractList?.push(file)
          break
      }
    })
  }
}

async function submitForm() {
  formModel.value.auditStatus = 1
  try {
    const valid = await commonForm.value.validate()
    if (valid) {
      const { data: qrData } = await getQrInfoById({ id: route.query.qrId, checkType: 2 })
      if (qrData.qrStatus === 2) {
        return uni.showToast({
          title: '该链接已经录入数据,无需重复提交!',
        })
      }
      loading.value = true
      const { code } = await relUnitAdd(formModel.value)
      loading.value = false
      upDateStatus(route.query.qrId)
      if (code === 0) {
        uni.showToast({
          title: '提交成功,等待审核!',
        })
        router.replace(`/pages/interestedTarget/relUnitApproval?type=2&qrId=${route.query.qrId}`)
      }
    }
  }
  catch (error) {
    loading.value = false
  }
}

async function initData() {
  const { id, qrId } = route.query
  const { data } = await getQrInfoById({ id: qrId, checkType: 2 })
  if (!id) {
    formModel.value.partyName = data.enterpriseName
    const list = await getRelUnitListByKeyWord(data.enterpriseName)
    if (list?.length) {
      formModel.value.orgCode = list[0].enterpriseCode
      formModel.value.detailedAddress = list[0].registerAddress
    }
  }
  getDetail(id)
  getConfigCol('region', config).bind.localdata = await getAreaList()
  getConfigCol('industry', config).bind.localdata = await getRelTypeList()
}

onMounted(() => {
  initData()
})
</script>

<template>
  <div p="b-12">
    <view v-if="route.query?.id" m="3" p="2" text="left sm [#dc1126]" font="sm" bg="[#eee]" rounded>
      <view>修改意见:</view>
      <view>{{ formModel.finalRe || '-' }}</view>
    </view>
    <view class="bg-title">
      <view class="bg-box" /> 作业单位信息
    </view>
    <CommonForm ref="commonForm" v-model:formModel="formModel" :config="config" :bind-form="{ labelWidth: 110 }" />
    <button type="primary" class="bt-btn" :loading="loading" @click="submitForm">
      提交
    </button>
  </div>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "相关方单位申请",
  }
}
</route>
