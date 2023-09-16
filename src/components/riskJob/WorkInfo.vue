<template>
    <uni-popup ref="popup" type="bottom" background-color="#fff" @maskClick="closeModal">
        <view h="8">
            <nut-icon name="circle-close" color="#666" size="20" class="float-right mt-1 mr-1" @click="closeModal"></nut-icon>
        </view>
          
        <CommonForm :config="config"  v-model:formModel="formModel" :bindForm="{labelWidth:'90'}" class="!pt-0"/>
          
    </uni-popup>
</template>

<script lang="ts" setup>
const { workInfo = {}, modelValue = false } = defineProps<{ modelValue: boolean, workInfo: any }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
const popup = ref<uni.UniPopup>()

const formModel = computed(()=>workInfo)

const config = [
    { label: '作业人员', key: 'userName', component: 'input',  bind: { disabled: true } },
    { label: '特种作业操作证', key: 'certificateName', component: 'input',  bind: { disabled: true } },
    { label: '证书编号', key: 'certificateCode', component: 'input',  bind: { disabled: true } },
    { label: '发证时间', key: 'certificateTime', component: 'input',  bind: { disabled: true } },
    { label: '证书有效期', key: 'certificateDeadlineTime', component: 'input',  bind: { disabled: true } },
    { label: '发证机关', key: 'certificateOffice', component: 'input',  bind: { disabled: true } },
    { label: '证书附件', key: 'file', component: 'fileUpload',bind: {limit:1, multiple: false, disabled: true } },
]

watch(() => modelValue, (newVal,oldVal) => {
    if (newVal === true) {
        if (workInfo.url)  workInfo.file={url:workInfo.url,fileName:workInfo.fileName||workInfo.name}
        popup.value.open()
    }
})

const closeModal = () => {
    popup.value.close()
    emit('update:modelValue', false)
}
</script>