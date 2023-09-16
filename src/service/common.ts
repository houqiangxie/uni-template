/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-14 16:08:11
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-08-29 11:36:36
 */
// 获取所属区域
export const getAreaList = async () => {
    const { data } = await post('/par/areaTree')
    const transformData = (list) => {
        return list.map(ele => {
            ele.text = ele.name
            ele.value = ele.id
            if (ele.children)  transformData(ele.children)
           return ele
        });
    }
    return transformData(data)
}

// 相关方国民经济分类
export const getRelTypeList = async () => {
    const { data } = await post('/enterprise/tree')
    const transformData = (list) => {
        return list.map(ele => {
            ele.text = ele.name
            ele.value = ele.id
            if (ele.children) transformData(ele.children)
            return ele
        });
    }
    return transformData(data)
}