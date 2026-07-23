import { defineStore } from 'pinia'
export const useUserStore = defineStore('stationUser', () => {
  const userInfo = ref({
    permissions: [] // 添加权限字段
  })
  const userType = ref(1) // 用户类型 1 企业用户   2 监管用户
  function setUserInfo(data: any) {
    userInfo.value = data
  }

  async function logout() {
    console.log('先发送logout请求',userInfo.value)
    await doUserLogout();
    console.log('再清除数据',userInfo.value)
    userInfo.value = {
      permissions: [] // 退出时重置权限
    }
    uni.removeStorageSync('userInfo')
  }

  return {
    userInfo,
    setUserInfo,
    userType,
    logout
  }
}, {
  // persist: {
  //   storage: {
  //     getItem: uni.getStorageSync,
  //     setItem: uni.setStorageSync
  //   }
  // }
  unistorage: true, // 开启后对 state 的数据读写都将持久化
})
