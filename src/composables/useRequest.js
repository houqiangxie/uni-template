/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-09 18:04:04
 * @LastEditors: houqiangxie
 * @LastEditTime: 2023-09-08 10:58:53
 */
// import logout from "@/utils/logout.js"


const defaultConfig = {
    method: "POST",
    loading: true,
    proxy:true
}

// 全局请求封装
const useRequest = (method,path, data = {}, config = {}) => {
    const token = uni.getStorageSync("userInfo")?.token;
    const Authorization = token;
    const configTemp ={...defaultConfig,method,...config}
    if (configTemp.loading) {
        uni.showLoading({
            title: "加载中",
            mask: true
        });
    };
    return new Promise((resolve, reject) => {
        uni.request({
            method,
            header: {
                Authorization
            },
            url: (configTemp.proxy?'/gateway':'') + path,
            data,
            ...configTemp,
            success({data:{data,code,message}}) {
                if (code !== 0) {
                    uni.showToast({
                        icon: "none",
                        duration: 4000,
                        title: message
                    });
                }
                resolve({data,code,message});
            },
            fail(err) {
                uni.showToast({
                    icon: "none",
                    title: '服务响应失败'
                });
                console.error(err);
                reject(err);
            },
            complete() {
                uni.hideLoading();
            }
        });
    });
};

export const get = (path, data = {}, config={}) => useRequest('GET', path, data, config)
export const post = (path, data = {}, config = {}) => useRequest('POST', path, data, config)
export const del = (path, data = {}, config = {}) => useRequest('DELETE', path, data, config)
export const put = (path, data = {}, config = {}) => useRequest('PUT', path, data, config)
