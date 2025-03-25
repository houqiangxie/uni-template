import { defineStore } from 'pinia'
export const useUserStore = defineStore('user', () => {
  const userInfo = ref({})

  function setUserInfo(data) {
    userInfo.value = data
  }

  return {
    userInfo,
    setUserInfo,
  }
}, {
  persist: {
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync
    }
  }
})
