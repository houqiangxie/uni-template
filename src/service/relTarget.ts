/*
 * @Descripttion: 
 * @version:   相关方页面相关接口
 * @Author: houqiangxie
 * @Date: 2023-08-14 16:00:03
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-29 11:32:29
 */

// 根据模糊关键词获取相关方单位列表
export const getRelUnitListByKeyWord = async (keyWord:string='') => {
    if (!keyWord) return []
    const { data } = await post('/par/enterList', { pageNum: 1, pageSize: 20, enterpriseName: keyWord })
    return data.records.map(ele => {
        ele.text = ele.enterpriseName
        ele.value = ele.enterpriseName
        return ele
    });
}
// 根据id获取相关方单位详情数据
export const getRelUnitDetailById = async (id:string='') => {
    const { data } = await post('/par/page', { pageNum: 1, pageSize: 20, id, needPage :true})
    return data.records[0]
}

// 根据id获取相关方附件数据
export const getFileListById = async (rpId:string='') => {
    const { data } = await post('/file/list', { pageNum: 1, pageSize: 20, rpId })
    return data
}
//获取相关放审批单位下拉列表
export const getRelUnitApprovalSelectList = async () => {
    const { data } = await post('/par/list')
    return data.map((d: any) => ({ text: d.partyName, value: d.id, ...d }))
};
// 根据id获取相关方单位详情数据
export const getRelPersonDetailById = async (id: string = '') => {
    const { data } = await post('/per/page', { pageNum: 1, pageSize: 20, id, needPage: true })
    return data.records[0]
}
// 新增编辑相关方单位
export const relUnitAdd = async (data:any) => {
    return await post(data.id ? '/par/update' : '/par/save',data)
}
// 新增编辑相关方作业人员
export const relPersonAdd = async (data:any) => {
    return await post(data.id ? '/per/update' : '/per/save',data)
}
// 新增编辑相关方作业人员
export const getQrInfoById = async (data) => {
    return await post('/qr/qrById',data)
}
// 新增编辑相关方作业人员
export const vertifyCompanyName = async (data) => {
    return await post('/qr/check',data)
}
// 作业单位作业人员修改状态
export const upDateStatus = async (id) => {
    return await post('/qr/updateQrStatus',{id})
}

