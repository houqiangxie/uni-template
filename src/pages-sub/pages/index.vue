<template>
  <view>
    <WorkBench v-if='active == "workbench"' />
    <Mine v-if='active == "user"' />
    <TableBar @tabSwitch='tabSwitch' />
  </view>
</template>

<route>
{
  "style": {
    "navigationBarTitleText": "首页",
  },
}
</route>

<script setup >
const active = ref('workbench')
const navbarStore = useNavbarStore()
const tabSwitch = (item) => {
  active.value = item.name
  navbarStore.setTitle(item.text=='我的'?'':item.text)
}

function buildTree(list, parentId = '') {
  return list
    .filter(item => item.parentId == parentId)
    .map(item => ({
      ...item,
      children: buildTree(list, item.id)
    }));
}

const userStore = useUserStore()
const menuList = ref([])
provide('menuList', menuList)
const userInfo = userStore.userInfo
const getMenus = async () => {
  // const { data } = await getLoginInfo({ enterpriseName: userInfo.enterpriseName, userId: userInfo.userId, userName: userInfo.userName })
  // menuList.value = buildTree(data.menuList)
  // uni.setStorageSync('menuList', toRaw(menuList.value))
  // const permissionList = data.menuList.filter(v => v.type == 3).map(v => v.code)
  // uni.setStorageSync('permissionList', permissionList)
}
getMenus()
onShow(() => {
  // #ifdef MP-WEIXIN
  uni.hideHomeButton()
  // #endif
})
</script>