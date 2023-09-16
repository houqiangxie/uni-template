<!--
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-11 09:39:21
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-14 11:05:37
-->
<template>
    <div class="h-full" :class="{'b-none': readonly }">
        <nut-input class="uni-input text-sm h-full text-left px-2 w-full border-box" v-model="data.text" readonly  placeholder="" :border="false" @click="showPopUp" v-bind="$attrs"  />
        <nut-popup v-model:visible="data.visible" position="bottom" round>
            <view class="uni-list bg-white rounded-t-lg overflow-hidden" >
                <div class="flex justify-between p-2">
                    <span @click="onCancel">取消</span>
                    <span @click="onConfirm">确认</span>
                </div>
                <nut-searchbar v-model="keyWord" placeholder="" bgColor="#efefef" @search="onSearch" @clear="onSearch" v-if="showSearch"  />
                <scroll-view class="h-60 py-2" scroll-x="false" scroll-y="true" upper-threshold="50" lower-threshold="50" 
                    scroll-top="0" scroll-left="0" scroll-into-view="" scroll-with-animation="false" enable-back-to-top="false" >
                    <nut-radio-group v-model="data.value" v-if="!multiple">
                        <label class="uni-list-cell" v-for="(item, index) in filterList" :key="item[columnsFieldNames.value]">
                            <nut-radio :label="item[columnsFieldNames.value]" >{{ item[columnsFieldNames.text] }}</nut-radio>
                        </label>
                    </nut-radio-group>
                    <nut-checkbox-group v-model="data.value" v-if="multiple">
                        <label class="uni-list-cell" v-for="(item, index) in filterList" :key="item[columnsFieldNames.value]">
                            <nut-checkbox :label="item[columnsFieldNames.value]" >{{ item[columnsFieldNames.text] }}</nut-checkbox>
                        </label>
                    </nut-checkbox-group>
                </scroll-view>
                  
            </view>
        </nut-popup>
    </div>
</template>

<script lang="ts" setup>
const { modelValue = '', columns = [], name = '', label = '', columnsFieldNames = { text: 'text', value: 'value', children: 'children' }, readonly, multiple = false,
    remote = false, remoteUrl = '', showType='default', showSearch=false }
    = defineProps<{
        modelValue: string | number | undefined, columns?: Array<Record<string, string | number>>, name?: string, label?: string, columnsFieldNames?: Record<string, string>,
        readonly?: boolean, multiple?: boolean,remote?: boolean, remoteUrl?: string,showType?:string, showSearch?:boolean,
    }>()
const emit = defineEmits<{ (e: 'update:modelValue', payload: any): void; (e: 'change', payload: any): void; (e: 'blur', payload: any): void }>()
const data: { checkData: any, text: string, value: string | number, visible:boolean } = reactive({
    checkData: {},
    value: "",
    text: "",
    visible: false
})


const onCancel = () => {
    data.visible=false
}
const onConfirm = () => {
    reShow(true)
    emit('update:modelValue', data.value)
    emit('change', data.checkData)
    emit('blur', data.value)
    onCancel()
}
// 回显
const reShow = async(flag=false) => {
    await onSearch()
    if ((multiple && data.value.length > 0) || (!multiple && (data.value||data.value===0||data.value==='0'))) {
        data.checkData = multiple ? filterList.value.filter((item) => (data.value).includes(item[columnsFieldNames.value])) : filterList.value.find((item) => item[columnsFieldNames.value] == data.value);
        data.text = multiple ? data.checkData.map((item) => item[columnsFieldNames.text]).join(',') : data.checkData?.[columnsFieldNames.text];
    }
    else {
        data.text = "";
    }
}

const showPopUp = () => {
    if (readonly) return;
    data.visible=true
    keyWord.value = ''
    onSearch()
}

// 搜索关键字
const keyWord = ref('')
const filterList = ref<Array<Record<string, string | number>>>([])
const onSearch = async() => {
    if (!remote) filterList.value = columns.filter(c => (c[columnsFieldNames.text] as string)?.match(keyWord.value)) as []
    else await getRemoteData()
}



// 获取用户信息
const getRemoteData = async () => {
    if (showType == 'relUnit') filterList.value= await getRelUnitListByKeyWord(keyWord.value)
    else {
        const { data } = await post(remoteUrl, { pageNum: 1, pageSize: 20, enterpriseName: keyWord.value })
        filterList.value = data
    }
}

watch(() => columns, (newVal, oldVal) => {
    //处理异步数据回显
    reShow();
})
watch(() => modelValue, (newVal, oldVal) => {
    data.value = newVal
    if (remote) keyWord.value = newVal
    //处理异步数据回显
    reShow();
}, { immediate: true })

</script>

<style lang="scss" scoped>
.uni-list-cell {
	@apply flex justify-start items-center p-2;
    :deep(.uni-radio-input),:deep(.uni-checkbox-input){
        @apply w-4 h-4
    }
}
// :deep(.uni-popup){
//     uni-view[name=mask]{
//         pointer-events: none;
//     }
// }
</style>
