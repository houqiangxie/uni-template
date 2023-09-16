/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-23 10:36:48
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-01 09:27:43
 */
// 根据id获取危险作业列表详情数据
export async function getRiskJobListDetailById(id: string = '') {
  const { data } = await post('/workBasicData/page', { pageNum: 1, pageSize: 20, id, needPage: true })
  return data.records[0]
}

// 根据id获取危险作业类型列表详情数据
export async function getRiskJobTypeListDetailById(id: string = '') {
  const { data } = await post('/workTypeManage/page', { pageNum: 1, pageSize: 20, id, needPage: true })
  return data.records[0]
}

// 作业实施信息列表
export async function getWorkImplementInformationList() {
  const { data } = await post('/workBasicData/page', { pageNum: 1, pageSize: 1000, needPage: true })
  return data.records
}
// 新增编辑作业实施信息
export async function updateRiskJob(params) {
  return await post('/workBasicData/updateById', params)
}
// 跟新流程状态
export async function updateFlowInfo(params) {
    return await post('/flow/updateFlowStatus', params)
}
