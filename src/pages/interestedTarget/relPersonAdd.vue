<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-10 15:40:26
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-10 10:35:24
-->
<template>
    <view p="b-12">
      <view m="3" p="2" text="left sm [#666]" font="sm" bg="[#dc1126]" rounded v-if="route.query?.id">
        <view>修改意见:</view>
        <view>{{ formModel?.finalRe || '-' }}</view>
      </view>
      <view class="bg-title" ><view class="bg-box"></view> 作业人员信息</view>
        <CommonForm :config="config" v-model:formModel="formModel" :ref="((el) => setCommonFormRef('main', el))" :bindForm="{labelWidth:90}">
          <view class="b-[#eee] b-1 b-dotted rounded">
            <view class="bg-title b-none" ><view class="bg-box"></view> 证书信息</view>
            <view v-for="(item, index) in formModel.fileList">
              <view class="bg-title mx-3 flex justify-between" >证书{{ index + 1 }} <nut-icon class="fr" name="circle-close"  color="#e3e0f6" @click="removeFormRef(index)"></nut-icon></view>
              <CommonForm :config="fileConfig(item,index)" :key="index" v-model:formModel="formModel.fileList[index]" :ref="(el)=>setCommonFormRef(index,el)" :bindForm="{labelWidth:75}" class=""/>
            </view>
          </view>
          <view class="w-full h-8 b-[#eee] b-1 b-dotted rounded mt-2 flex justify-center items-center" @click="formModel.fileList.push({name:null})">
            <nut-icon name="uploader"  color="#e3e0f6"></nut-icon>
            <text>新增</text>
          </view>
        </CommonForm>
        <button type="primary" class="bt-btn" :loading="loading" @click="submitForm">提交</button>
    </view>
</template>
<route>
{
  "style": {
    "navigationBarTitleText": "作业人员申请",
  }
}
</route>
<script lang="ts" setup>
const nestCommonForm = new Map([])
const router = useRouter()
const route = useRoute()
const loading = ref(false)
const formModel = ref({ affType:'',fileList: [], contractList:[] })
const config = reactive([
  { label: '人员类别', key: 'affType', component: 'selectPlus', required: true, bind: { disabled:true,columns: affTypeList } },
  { label: '相关方单位', key: 'partyId', component: 'selectPlus', required: computed(() => formModel.value.affType == 1), bind: { columns: [] ,disabled:true},hidden:computed(()=> formModel.value.affType == 2) },
  { label: '是否作业岗', key: 'workPosition', component: 'selectPlus', required: true, bind: { columns: whetherList, fileType:'number' } },
  { label: '姓名', key: 'name', component: 'input', required: true, bind: {} },
  { label: '性别', key: 'sex', component: 'selectPlus', required: true, bind: { columns: sexList, fileType:'number' } },
  { label: '岗位', key: 'positionName', component: 'input', required: true, bind: {} },
  { label: '联系电话', key: 'phone', component: 'input', required: true, bind: { type: 'number', patternType: 'phone', message:'请输入11位手机号码' } },
  { label: '年龄', key: 'age', component: 'input', required: true, bind: { type: 'number',  pattern: /^([1-9][0-9]{0,1}|99)$/, message: '年龄需在100以内' } },
  { label: '从业年限', key: 'yeaWor', component: 'input', required: true, bind: { type: 'number',  pattern: /^([1-9][0-9]{0,1}|99)$/, message: '从业年限需在100以内' } },
  { label: '合同/协议', key: 'contractList', component: 'fileUpload', required: false, bind: {}, hidden: computed(()=> formModel.value.affType == 1) },
  { label: '合同服务范围', key: 'conSerScope', component: 'input', required: false, bind: {}, hidden: computed(()=> formModel.value.affType == 1) },
])
const fileConfig = (item: any,index:number) => {
  const checkFileLdList = ['name', 'code', 'fileDate', 'url', 'indate', 'inst']
  let fileCount = 0
  checkFileLdList.forEach(field => {
    if (item[field]) fileCount++
  })
  if (item['urlObj']?.url) fileCount++
  const required = fileCount > 0 ? true : false;
  // const required =  true;
 return  [
    { label: '特种作业操作证', key: 'name', component: 'input', required, bind: { fileType: 'string' , } },
    { label: '证书编号', key: 'code', component: 'input', required, bind: {} },
   {
     label: '发证时间', key: 'fileDate', component: 'dateTimePicker', required, bind: { type: 'date' }, on: {
       'update:modelValue': (value:string) => {
        if (value) {
            const year = new Date(value).getFullYear();
            formModel.value.fileList[index].indate = formModel.value.fileList[index].fileDate.replace(year.toString(), year + 3)
          } else formModel.value.fileList[index].indate = null
      
    }} },
    { label: '有效期至', key: 'indate', component: 'dateTimePicker', required, bind: {type:'date',start: formModel.value.fileList[index].fileDate } },
    // { label: '证书有效期', key: 'indate', component: 'dateTimePicker', required, bind: {type:'daterange', rangeSeparator:"至" } },
    { label: '发证机关', key: 'inst', component: 'input', required, bind: {} },
    { label: '证书上传', key: 'urlObj', component: 'fileUpload', required, bind: { limit: 1 } },
  ]
}

const setCommonFormRef = (index,el) => {
  nestCommonForm.set(index, el)
}
const removeFormRef = (index) => {
  
  nestCommonForm.delete(index)
  
  formModel.value.fileList.splice(index,1)
}

const getDetail = async (id) => {
formModel.value.affType = +route.query.affType
  if (id) {
    formModel.value = await getRelPersonDetailById(id)
    const data = await getFileListById(id)
    formModel.value.fileList = []
    formModel.value.contractList = []
    data.forEach(file => {
      switch (file.type) {
        case 5:
          formModel.value.fileList.push(file)
          break
        case 4:
          formModel.value.contractList.push(file)
          break
      }
    })
    formModel.value.fileList.forEach(file => {
      if (file.url) file.urlObj = { name: file.fileName, fileName: file.fileName, url: file.url }
      // if (file.indate) file.indate = file.indate.split('至')
    })
  }
}
const checkFileLdList = ['name', 'code', 'fileDate', 'url', 'indate', 'inst']
const submitForm = async () => {
  formModel.value.auditStatus = 1
  try {
    const nestCommonFormValidateArr = []
    for (const [key, value] of nestCommonForm) {
      value&&nestCommonFormValidateArr.push(await value.validate())
    }
    const valid = nestCommonFormValidateArr.every(item => item===true)
    
    const checkEmptyRowList = []
    const emptyRowList = []
    const params = deepClone(formModel.value)
    params.fileList.forEach((file, index) => {
      file.url = file.urlObj?.url
      file.fileName = file.urlObj?.fileName
      // if (file.indate) file.indate = file.indate.join('至')
      if (file.fileDate) file.fileDate = file.fileDate + ' 00:00:00'
      let fileCount = 0
      checkFileLdList.forEach(field => {
        if (file[field]) fileCount++
      })
      if (fileCount > 0 && fileCount < checkFileLdList.length) checkEmptyRowList.push(index + 1)
      if (fileCount == 0) emptyRowList.unshift(index)
    })
    if (checkEmptyRowList.length > 0) return uni.showToast({ title: `证书信息第[${checkEmptyRowList.join(',')}]行数据存在未填写字段` })
    if (emptyRowList) emptyRowList.forEach((e) => { formModel.value.fileList.splice(e, 1); params.fileList.splice(e, 1); });
    if(!params.fileList.length&&params.workPosition===0) return uni.showToast({ title: `请填写证书信息` })
    if (valid) {
      const { data: qrData } = await getQrInfoById({ id: route.query.qrId, checkType: 2 })
      if (qrData.qrStatus == 2) {
        return uni.showToast({
          title: '该链接已经录入数据,无需重复提交!',
        });
      }
      loading.value = true
      const { code } = await relPersonAdd(params);
      loading.value = false
      if (code == 0) {
        if(route.query.id)upDateStatus(route.query.qrId)
        uni.showToast({
          title: '提交成功,等待审核!',
        });
        const {id, affType }=route.query
        router.replace(`/pages/interestedTarget/relPersonApproval?id=${id}&affType=${affType}&type=${route.query.id?2:1}&qrId=${route.query.qrId}`)
      }
    }
  } catch (error) {
    
    loading.value = false
  }
    
};

const initData = async () => {
  const { id,qrId } = route.query
  const partyList=await getRelUnitApprovalSelectList()
  getConfigCol('partyId', config).bind.columns = partyList
   const { data } = await getQrInfoById({ id: qrId, checkType: 2 })
  if(!id) formModel.value.partyId= partyList.find(v=>v.text==data.enterpriseName)?.value
  getDetail(id)
}

onMounted(() => {
  initData()
})
</script>

<style lang="scss" scoped>

</style>
