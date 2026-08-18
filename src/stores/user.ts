export interface UserInfoState {
  permissions: string[]
  token?: string
  info?: {
    username?: string
    nickName?: string
    [key: string]: any
  }
  [key: string]: any
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfoState>({
    permissions: [],
  })

  function setUserInfo(data: UserInfoState) {
    userInfo.value = data
  }

  async function logout() {
    await doUserLogout()
    userInfo.value = {
      permissions: [],
    }
    uni.removeStorageSync('userInfo')
  }

  return {
    userInfo,
    setUserInfo,
    logout,
  }
}, {
  unistorage: true,
})
