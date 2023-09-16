<template>
    <view>
        <nut-collapse v-model="activeNames"  >
            <nut-collapse-item  name="1" icon="rect-down"> 
                <template #title>
                    <view class="bg-title b-none">  <view class="bg-box" /> 作业基本信息</view>
                </template>
                <CommonForm :config="config.base" v-model:formModel="formModel" :bindForm="{ labelWidth: 100 }" class="" />
            </nut-collapse-item>
            <nut-collapse-item name="2" icon="rect-down">
               <template #title>
                <view class="bg-title b-none">  <view class="bg-box" /> 作业人员信息</view>
                </template>
                <CommonForm :config="config.work" v-model:formModel="formModel" :bindForm="{ labelWidth: 100 }" class="">
                    <template #operator>
                        <view v-for="(item,index) in formModel.operatorList" :key="index" class="flex items-center justify-between mb-1 w-full"><text>{{ item.userName }}</text> <button m="!r-0" size="mini" type="primary"  plain="true" @click="showWorkInfo(item)">查看资格证信息</button></view>
                    </template>
                </CommonForm>
            </nut-collapse-item>
            <nut-collapse-item name="3" icon="rect-down" v-if="type>=3">
                 <template #title>
                    <view class="bg-title b-none">  <view class="bg-box" /> 安全措施确认</view>
                </template>
                <view class="b-[#eee] b-1 b-dotted rounded mx-3 mt-3">
                    <nut-checkbox-group v-model="formModel.workSafetyList">
                        <view >
                            <view class="flex px-3 my-2"><view class="flex-1">安全措施项</view> <view class="w-15 text-center">是否完成</view></view>
                            <view v-for="(item, index) in formModel.workSafetyMeasureInformationVOList" :key="index" class="flex px-3 my-2">
                                <view class="flex-1">{{ item.workMeasuresContent }}</view> 
                                <view  class=" w-15 flex justify-center">
                                    <nut-checkbox v-if="item.customFlag==1" :disabled="query.type!=3" :label="(item.id||item.workMeasuresContent)" class="ml-2"/>
                                    <nut-icon name="circle-close" v-if="item.customFlag == 0 && query.type == 3"  @click="delSafeMeasure(index)"></nut-icon>
                                    <nut-checkbox v-else disabled :label="(item.id || item.workMeasuresContent)" class="ml-3"/>
                                </view>
                                  
                            </view>
                        </view>
                    </nut-checkbox-group>
                    <view class="flex w-full justify-center my-2" v-if="query.type=='3'">
                        <view class="w-1/2 h-8 b-[#eee] border-1 b-dotted rounded flex justify-center items-center" @click="inputDialog.open()">
                            <nut-icon name="uploader"  color="#e3e0f6"></nut-icon>
                            <text>自定义安全措施</text>
                        </view>
                    </view>
                     <CommonForm :config="config.measure" v-model:formModel="formModel" :bindForm="{ labelWidth: 80 }" class="!py-0">
                        <template #share>
                            <button type="primary" size="mini" class="!w-22" @click="shareSign">分享签名</button>
                        </template>
                    </CommonForm>
                      
                </view>
            </nut-collapse-item>
            <nut-collapse-item name="4" icon="rect-down" v-if="type >= 3">
                 <template #title>
                    <view class="bg-title b-none">  <view class="bg-box" /> 作业实施</view>
                </template>
                <CommonForm :config="config.implement" v-model:formModel="formModel" :bindForm="{ labelWidth: 100 }" class="">
                </CommonForm>
                <uni-row class="demo-uni-row" v-if="type==3">
                    <uni-col :span="12" style="padding: 20px;">
                        <button class="button w-full" type="default" size="mini" @click="onsubmit('draft')" >暂存</button>
                    </uni-col>
                    <uni-col :span="12" style="padding: 20px;">
                        <button class="button w-full" type="primary" size="mini" @click="onsubmit('save')">提交</button>
                    </uni-col>
                </uni-row>
            </nut-collapse-item>
            <nut-collapse-item name="5" icon="rect-down">
                 <template #title>
                    <view class="bg-title b-none">  <view class="bg-box" /> 作业审批</view>
                </template>
                <nut-steps :current="formModel.approvalIndex" direction="vertical" progress-dot class="px-2 my-3">
                    <nut-step :title="item.title" content="步骤描述" v-for="(item) in formModel.steps">
                         <template #content>
                             <view>
                                {{ item.flowStatus == '0' ? '待审批' : item.flowStatus == '1' ? '审批通过' : '审批驳回' }}
                             </view>
                             <view>
                                {{ item.flowOpinion }}
                             </view>
                            
                        </template>
                    </nut-step>
                </nut-steps>

                <uni-row class="demo-uni-row" v-if="showApproval">
                    <uni-col :span="12" style="padding: 20px;">
                        <button class="button" type="warn" size="mini" @click="openPassPopup('2')" style="width: 100%;">{{type==4?'验收':'审批'}}驳回</button>
                    </uni-col>
                    <uni-col :span="12" style="padding: 20px;">
                        <button class="button" type="primary" size="mini" @click="openPassPopup('1')" style="width: 100%;">{{ type == 4 ? '验收' : '审批' }}通过</button>
                    </uni-col>
                </uni-row>
            </nut-collapse-item>
        </nut-collapse>
        <WorkInfo v-model="workInfo.visible" :workInfo="workInfo.row" />
        <AcceptPopup ref="acceptPopup" @submit="submitFlow" />
        <uni-popup ref="inputDialog" type="dialog">
            <uni-popup-dialog ref="inputClose"  mode="input" title="添加安全措施" value="" :before-close="true"
                placeholder="请输入内容" @confirm="inputConfirm" @close="dialogClose"></uni-popup-dialog>
        </uni-popup>
        <Sign v-if="type=='6'" class="fixed -left-[1000px]" v-model="formModel.shareUrl" :showTriggerBtn="false" :limit="1" :disabled="true" @update:modelValue="signCallback"/>
    </view>
</template>
<route>
{
  "style": {
    "navigationBarTitleText": "",
  }
}
</route>
<script lang="ts" setup>
const route = useRoute()
const router = useRouter()
// const query = route.query
// type 1 业务部门审批  2 安全部门审批 3 作业实施 4 作业验收 5 已完成作业 6 分享二维码

// 作业实施类型   (1 - 安全措施确认照片, 2 - 安全施确认人: 3 - 作业防护装备: 4 - 安全措施交底(培训)5 - 安全施被交底人(作业人员等) : 6 - 作业照片(作业前 / 中 / 后): 7 - 作业监护人: 8 - 作业负责人)
let query = {}
const activeNames = ref([])
const formModel: any = reactive({})
console.log('formModel: ', formModel);
const config = reactive({
    base: [
        { label: '作业类型', key: 'workTypeName', component: 'input', bind: { disabled: true } },
        { label: '作业内容', key: 'workContent', component: 'html', bind: { disabled: true,} },
        { label: '作业地点', key: 'workLocation', component: 'html', bind: { disabled: true } },
        { label: '作业方案', key: 'workProgrammeFile', component: 'fileUpload', required: false, bind: { multiple: false,disabled: true } },
        { label: '风险辨识结果', key: 'riskIdentificationResults', component: 'html', required: false, bind: { multiple: false,disabled: true } },
        { label: '', key: 'riskIdentificationResultsFile', component: 'fileUpload', required: false, bind: {limit:1, multiple: false,disabled: true },hidden:computed(()=>!formModel.riskIdentificationResultsFileUrl) },
        { label: '作业计划时间', key: 'workPlanTime', component: 'html', bind: { disabled: true,class:'!pt-[10px]' } },
        { label: '作业时长', key: 'workDuration', component: 'input', bind: { disabled: true } },
        { label: '是否需要气体检测', key: 'gasDetectionResult', component: 'html', required: false, bind: {disabled: true,class:'!pt-0' } },
        { label: '', key: 'gasDetectionResultFile', component: 'fileUpload', required: false, bind: {limit:1, multiple: false,disabled: true },hidden: computed(() => formModel.gasDetectionFlag == 1) },
        { label: '分析人', key: 'analysisUser', component: 'input', bind: { disabled: true }, hidden: computed(() => formModel.gasDetectionFlag == 1) },
        { label: '是否有作业防护装备', key: 'workProtection', component: 'html', bind: { disabled: true, class: '!pt-0' } },
    ],
    work: [
        { label: '作业负责人', key: 'principal', component: 'html', required: false, bind: { disabled: true } },
        { label: '作业监护人', key: 'guardian', component: 'html', required: false, bind: { disabled: true,type:'textarea', autoHeight: true } },
        { label: '作业人员', key: '11', bind: { disabled: true, slotName:'operator' } },
    ],
    measure: [
        { label: '安全措施确认照片', key: 'fileList1', component: 'fileUpload', required: false, bind: { disabled: computed(()=>route.query?.type!=3) } },
        // { label: '安全措施确认人', key: 'guardian', component: 'input', required: false, bind: { disabled: true} },
        { label: '安全措施确认人', key: 'fileList2', component: 'sign', required: false, bind: { disabled: computed(()=> route.query?.type != 3), limit: 100 } },
        { label: '', key: 'share', component: 'sign', bind: { disabled: true, slotName: 'share' }, hidden: computed(() => route.query?.type != 3)  },
    ],
    implement: [
        { label: '作业防护装备', key: 'fileList3', component: 'fileUpload', required: false, bind: { disabled: computed(() => route.query?.type != 3) } },
        { label: '安全措施交底（培训）', key: 'fileList4', component: 'sign', required: false, bind: { disabled: computed(() => route.query?.type != 3), limit: 100 } },
        { label: '安全措施被交底人（作业人员等）', key: 'fileList5', component: 'sign', required: false, bind: { disabled: computed(() => route.query?.type != 3) , limit: 100 } },
        { label: '作业照片（作业前/中/后）', key: 'fileList6', component: 'fileUpload', required: false, bind: { disabled: computed(() => route.query?.type != 3) } },
        // { label: '作业监护人', key: 'guardian', component: 'input', required: false, bind: { disabled: true } },
        { label: '作业监护人', key: 'fileList7', component: 'sign', required: false, bind: { disabled: computed(() => route.query?.type != 3) , limit: 100 } },
        { label: '实际作业时长(分钟)', key: 'workRealityHours', component: 'input', required: false, bind: { disabled: computed(() => route.query?.type != 3) } },
        // { label: '作业负责人', key: 'guardian', component: 'input', required: false, bind: { disabled: true } },
        { label: '作业负责人', key: 'fileList8', component: 'sign', required: false, bind: { disabled: computed(() => route.query?.type != 3), limit: 100 } },
    ],
})


const getDetail = async (id) => {
    const detail = uni.getStorageSync('riskJob'+query.id)
    if (detail&&query.type==3) {
        Object.assign(formModel, JSON.parse(detail))
        return;
    }
    const res = await getRiskJobListDetailById(query.id)
    if (res.workProgrammeFileName) res.workProgrammeFile={fileName:res.workProgrammeFileName,url:res.workProgramme }
    if(res.riskIdentificationResultsFileName)res.riskIdentificationResultsFile={fileName:res.riskIdentificationResultsFileName,url:res.riskIdentificationResultsFileUrl }
    if(res.gasDetectionResultFileName)res.gasDetectionResultFile ={fileName:res.gasDetectionResultFileName,url:res.gasDetectionResultFileUrl }
    res.workPlanTime = `起: ${res.workPlanBeginTime} <br/> 止: ${res.workPlanEndTime}`
    res.gasDetectionResult=res.gasDetectionFlag==0?'是' + `(${res.gasDetectionResult})` :'否'
    res.workProtection = res.workProtectionFlag == 0 ? '是' + `(${res.workProtection})` : '否'
    res.principalList=[]//负责人
    res.guardianList=[]//监护人
    res.operatorList=[]//作业人
    res.workOperatorInformationVOList?.forEach(operator => { 
        if(operator.workPersonnelType ==0) res.principalList.push(operator.userName)
        if(operator.workPersonnelType ==1) res.guardianList.push(operator.userName)
        if(operator.workPersonnelType ==2) res.operatorList.push(operator)
    })
    res.principal= res.principalList.join('、')
    res.guardian = res.guardianList.join('、')
    res.workImplementInformationVOList?.forEach((file, index) => {
        const key = 'fileList' + file.implementType
        if (!res[key]) res[key] = [file]
        else res[key].push(file)
    })
    res.workSafetyList=[]
    res.workSafetyMeasureInformationVOList?.forEach(certificate => { 
        certificate.id = certificate.id?String(certificate.id):''
        // if (certificate.flag == 0)
            res.workSafetyList.push(certificate.id || certificate.workMeasuresContent)
        
    })
    res.steps=[]
    res.flowNodeVOList?.forEach(node => {
        node.person = node.flowNodePersonnelList.map(p => {
            p.title=node.title+ ('('+p.personnelName +')')
            res.steps.push(p)
        })
    })
    const approvalIndex = (res.steps.findIndex(step => step.flowStatus == 0))
    if (approvalIndex >-1) {
        res.personId= res.steps[approvalIndex].id
        res.approvalIndex = approvalIndex+1
    }
    Object.assign(formModel, res)
    
    // nextTick(() => {
    //     collapse.value.resize()
    // })
    // getRiskJobTypeListDetailById(formModel.)flowIdStr
}

const workInfo = reactive({ visible: false, row: {} })
const showWorkInfo = (row) => {
    const info = row.workSafetyMeasureInformationVOList?.length ? row.workSafetyMeasureInformationVOList[0] : {};
    info.userName = row.userName
    workInfo.row = info
    workInfo.visible = true
}

const inputDialog = ref()
const inputConfirm = (e) => {
    if (!e) return uni.showToast({ title: '请输入自定义措施!' })
    formModel.workSafetyMeasureInformationVOList.push({ customFlag :0, workMeasuresContent:e, flag:0 })
    inputDialog.value.close()
    // nextTick(() => {
    //     collapse.value.resize()
    // })
}

const dialogClose = () => {
    inputDialog.value.close()
}
// 删除措施
const delSafeMeasure = (index:number) => {
    formModel.workSafetyMeasureInformationVOList.splice(index,1)
}

const acceptPopup = ref()
const openPassPopup = (types) => {
    const titlePrefix = type.value==4?'验收':'审批'
    if (types === '2') {
        acceptPopup.value.open({
            type:types,
            title: titlePrefix+'驳回',
            titleColor: '#d9001b',
            placeholder:  `请输入${titlePrefix}意见`
        })
    }

    if (types === '1') {
        acceptPopup.value.open({
            type: types,
            title: titlePrefix + '通过',
            titleColor: '#4384f5',
            placeholder: `请输入${titlePrefix}意见`
        })
    }
}
// 审批通过驳回
const submitFlow = async ({ title, type, flowOpinion }) => {
    const approvalObj=formModel.steps.find(step=>step.flowStatus ==0)||{}
    const {id,nodeId}= approvalObj
    const { code } = await updateFlowInfo({ flowStatus: type, flowOpinion, id, workId: formModel.id, nodeId })
    if (code == 0) {
        uni.showToast({ title: title + '成功' })
        closeApp()
    }
}

const type = ref('1')
const showApproval = computed(() => {
    const showApprovalArr = ['1', '2', '4']
    return showApprovalArr.includes(type.value)
})

const shareSign = () => {
    router.push({path:'/pages/riskJob/shareSignature',query:{id:formModel.id,token:uni.getStorageSync('userInfo')?.token,type:'6'}})
}

// watch(()=>formModel,() => {
//      nextTick(() => {
//         collapse.value.resize()
//     })
// },{deep:true})
const navTitle =new Map([
    ['1', '业务部门审批'],
    ['2', '安全部门审批'],
    ['3', '作业实施'],
    ['4', '作业验收'],
    ['5', '已完成作业'],
    ['6', '分享签名'],
])
const activeNameArr =new Map([
    ['1', ['1','2','5']],
    ['2', ['1', '2', '5']],
    ['3', [ '3','4']],
    ['4', [ '3', '4','5']],
    ['5', ['1', '2', '5']],
    ['6', ['1', '2', '3', '4']],
])

const signTypeArr =['2','4','5','7','8']
const onsubmit =async (type: string) => {
    const workImplementInformationVOList = []
    for (const [key,value] of Object.entries(formModel)) {
        if (key.includes('fileList')) {
            const implementType = key.replace('fileList', '')
            workImplementInformationVOList.push(...value.map((file => {
                file.implementType = implementType
                if (signTypeArr.includes(implementType)) file.signatureUrl = file.url
                else file.fileUrl = file.url
                return file
            })))
        }
    }
    formModel.workImplementInformationVOList = workImplementInformationVOList
    formModel.workSafetyMeasureInformationVOList.forEach(e => {
        if(e.flag===true) e.flag = 0
        if(e.flag===false) e.flag = 1
    })
    if (type == 'draft') {
        uni.setStorageSync('riskJob' + formModel.id, JSON.stringify(formModel))
        uni.showToast({ title: '暂存成功' })
    } else {
        const {id,workImplementInformationVOList: workImplementInformationBOList, workSafetyMeasureInformationVOList: workSafetyMeasureInformationBOList, workRealityHours }=formModel
        const { code } = await updateRiskJob({ id, workImplementInformationBOList, workSafetyMeasureInformationBOList, workRealityHours, workStatus: '4' })
        if (code == 0) {
            uni.showToast({ title: '提交成功' })
            uni.removeStorageSync('riskJob' + formModel.id)
            closeApp()
            // router.replace({ path: '/pages/riskJob/index', query: { ...route.query, type: Number(route.query.type) + 1 } })
        }
    }
}

const signCallback = (e) => {
    
    
}


onMounted(() => {
    query = route.query
    type.value = query.type
    const title = navTitle.get(route.query.type)
    setNavigationBarTitle(title)
    activeNames.value= activeNameArr.get(route.query.type)
    if(query.token)uni.setStorageSync('userInfo', { token: query.token});
    getDetail()
})

</script>