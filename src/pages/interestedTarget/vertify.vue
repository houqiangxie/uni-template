<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-16 15:20:52
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-29 16:53:56
-->
<template>
    <view class="flex justify-center items-center h-full">
        <view class="p-10 text-left">
            <view class="warm-tip">温馨提示</view>
            <view class="warm-tip">{{ qrInfo.userEnterpriseName }}邀请您提交相关方信息若不涉及该内容，请忽略！</view>
            <view class="bg-[#eee] mt-10 p-4 rounded-md">
                <view class="leading-6">{{ qrInfo.checkEnterpriseName }}</view>
                <view class="grid flex py-4 px-2">
                    <template v-for="(item, index) in formConfig" :key="index">
                        <input class="input" :maxlength="item.maxlength" v-model="formModel[item.key]"  :id="'input-'+index" :focus="focus_index == index"  @input="funInput" v-if="item.box"/>
                        <view v-else class="flex justify-center items-center mx-1">{{formModel[item.key]  }}</view>
                    </template>
                </view>
            </view>
            <view class="my-5 text-center text-[#999] text-sm">请补充贵公司名称进行校验</view>
            <view class="flex justify-center">
                <button size="mini">关 闭</button>
                <button size="mini" type="primary"  @click="vertify">校 验</button>
            </view>
        </view>
    </view>
      
</template>

<script lang="ts" setup>
const router = useRouter()
const route = useRoute()
const qrInfo = reactive({})
const formModel = reactive({ name1: '', name2: '', name3: '', name4: '' })
const formConfig = reactive([])

const focus_index = ref(0)
// 寻找下一个可聚焦的index
const findNextIndex = (index) => {
    let nextIndex
    for (let i = index + 1; i < formConfig.length; i++) {
        const item = formConfig[i];
        if (item.box) {
            nextIndex=i
            break;
        }
    }
    return nextIndex
}
const setInputValue = (arr,index) => {
    let str = arr[0]
    arr.shift()
    formModel['key' + index] = str
    focus_index.value = index;
    const nextIndex= findNextIndex(index)
    if (nextIndex && arr.length) setInputValue(arr, nextIndex)
}

const funInput=(e)=> {
    var index = Number((e.target.id).replace('input-', ''));
    var value = e.detail.value;
    if (index < formConfig.length && value && value.length == 1) {
        const nextIndex = findNextIndex(index)
        if (nextIndex) {
            focus_index.value = nextIndex;
            formModel['key' + nextIndex] = ''
        }
    }
    if (index === 0&&value.length>1) {
        const valueArr = value.split('')
        setInputValue(valueArr, 0)
        formConfig[0].maxlength=1
        setTimeout(() => {
            formConfig[0].maxlength = 4
        }, 500);
    }
}

const getInfo = async (id: string) => {
    if(!id) return
    const { data } = await getQrInfoById({ id, checkType: 1 })
    for (let index = 0; index < data.desensitizeds.length; index++) {
        const str = data.desensitizeds[index];
        if (str == '*') {
            formConfig.push({ key: 'key' + index, maxlength: 1, box: true })
        }
        else {
            formConfig.push({ key: 'key' + index, maxlength: 1, box: false })
            formModel['key' + index] = str
        }
    }
    formConfig[0].maxlength = 4
    Object.assign(qrInfo, data)
} 
const vertify = async () => {
    let checkName=''
    for (let index = 0; index < formConfig.length; index++) {
        if (!formModel['key' + index]) return uni.showToast({ title: '请输入完整信息' })
        checkName+=formModel['key' + index]
     }
    // const { name1, name2, name3, name4 } = formModel
    
    // if(!name1 || !name2 || !name3 || !name4) return uni.showToast({title: '请输入完整信息'})
    const params = {id: route.query.id, checkName}
    const { data } = await vertifyCompanyName(params)
    if (data.checkStatus===0) {
        const { data } = await getQrInfoById({id:route.query.id, checkType:2})
        Object.assign(qrInfo, data)
        uni.setStorageSync('userInfo', { token: data.token });
        toPage()
    } 
} 

const toPage = () => {
    const { type, enterpriseName, solId, qrStatus,id } = qrInfo
    if (qrStatus == 1) {
        switch (type) {
            case '1': 
            case '2':
                router.replace(`/pages/interestedTarget/relUnitAdd?id=${solId}&qrId=${id}`)
                break;
            case '3': 
            case '4':
                router.replace(`/pages/interestedTarget/relPersonAdd?id=${solId}&affType=1&qrId=${id}`)
                break;
            case '5': 
            case '6':
                router.replace(`/pages/interestedTarget/relPersonAdd?id=${solId}&affType=2&qrId=${id}`)
                break;
            default: break;
         }
    } else {
        switch (type) {
            case '1':
            case '2':
                router.replace(`/pages/interestedTarget/relUnitApproval?type=2&qrId=${id}`)
                break;
            case '3':
            case '4':
            case '5':
            case '6':
                router.replace(`/pages/interestedTarget/relPersonApproval?type=2&qrId=${id}`)
                break;
            default: break;
        }
    }
}

onMounted(() => {
    const id = route.query.id
    getInfo(id)
})
</script>

<style lang="scss" scoped>
.warm-tip{
    @apply text-[#70b603] text-sm text-left;
}
.input{
    border: 1px solid #aaa;
    @apply  rounded-md h-10 w-10 text-center mx-2;
}
</style>
