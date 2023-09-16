/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-09-08 10:30:37
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-08 10:31:46
 */
// 新增编辑作业实施信息
export async function getCheckPointInfoById(id:string) {
    return await get(`/rm/risk/getById/${id}`)
}