<!--
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-02-14 09:47:52
-->
<script setup>
const router = useRouter()
const route = useRoute()
const emits = defineEmits(['tabSwitch'])
const activeName = ref(uni.getStorageSync('tab') || 'workbench')
setTimeout(() => {
  uni.removeStorageSync('tab')
}, 2000);
const menuList =inject('menuList')

const tabList = [
  {
    "pagePath": "/pages/workbench/index",
    "iconPath": "tabBar/icon_workbench.png",
    "selectedIconPath": "tabBar/icon_workbench_active.png",
    "text": "工作台",
    'name':'workbench',
    "show":true,
  },
  // {
  //   "pagePath": "/pages/trouble/index",
  //   "iconPath": "tabBar/icon_trouble.png",
  //   "selectedIconPath": "tabBar/icon_trouble_active.png",
  //   "text": "隐患治理",
  //   'name':'trouble',
  // },
  {
    "iconPath": "tabBar/scan.png",
    'name':'scan',
    'top':true,
    "show": true,
    "text":"扫一扫"
  },
  // {
  //   "pagePath": "/pages/riskJob/danger",
  //   "iconPath": "tabBar/icon_danger.png",
  //   "selectedIconPath": "tabBar/icon_danger_active.png",
  //   "text": "危险作业",
  //   'name': 'danger',
  //   'alias':'hazardousOperations',
  // },
  {
    "pagePath": "/pages/user/index",
    "iconPath": "tabBar/icon_mine.png",
    "selectedIconPath": "tabBar/icon_mine_active.png",
    "text": "我的",
    'name':'user',
    "show":true,
  }
]
const filterTabList = computed(()=>{
  const list = tabList
  // .filter(item => {
  //   const menuItem = menuList.value.find(m => m.code == item.name || m.code == item.alias)
  //   item.text = menuItem?.name || item.text
  //   return item.show||menuItem
  // })
  // if (!list.find(e => e.name == 'danger')&&list.length>3) {
  //   const index = list.findIndex(e => e.name == 'scan')
  //   const safetyArchives = menuList.value.find(e => e.code =='safetyArchives')
  //   list.splice ( index+1, 0, {
  //     "pagePath": "/pages-sub1/safetyArchives/index",
  //     "iconPath": "tabBar/icon_danger.png",
  //     "selectedIconPath": "tabBar/icon_danger_active.png",
  //     "text": safetyArchives?.name|| "安全档案",
  //     'name': 'safetyArchives',
  //     'link':true,
  //   })
  // }
  return list;
})

function tabSwitch(item, index) {
  if (item.link) {
    router.push(item.pagePath)
  }else if(!item.top){
    activeName.value = item.name
    uni.setStorageSync('tab', item.name)
    emits('tabSwitch', item)
  }else{
    if(item.name == 'scan'){
      activeName.value = item.name
      uni.scanCode({
        success: function (res) {
          const url = res.result
          if (url && url.includes('pages')) {
            let path = '/pages' + (url.includes('sub') ? '' : '-sub1') + url.split('pages')[1]
            path=path+(path.includes('?')?'&':'?')+'plate=wx'
            uni.navigateTo({
              url: path
            })
          } else {
            uni.showToast({
              title: '请扫描正确的二维码',
              icon: 'none'
            })
          }
        },
        fail: function (res) {
          uni.showToast({
            title: '扫描失败',
            icon: 'none'
          })
        }
      });
    }
  }
  // console.log('activeName.value: ', activeName.value);
  // const url = tabList[index].pagePath
  // url && router.push(url)
}

onMounted(()=>{
  // activeName.value = route.query.tab || 'workbench'
  const item = tabList.find(item=>item.name == activeName.value)
  item && emits('tabSwitch', item)
})
</script>

<template>
  <div class="tab-bar">
    <view v-for="(item, index) in filterTabList" :key="index" class="item"
      :class="{ 'active': item.name == activeName }" @click="tabSwitch(item, index)">
      <template v-if='!item.top'>
        <image v-if='item.name == activeName' :src='getUrl(item.selectedIconPath)' class='w-6 h-6' />
        <image v-else :src='getUrl(item.iconPath)' class='w-6 h-6' />
        <view>{{ item.text }}</view>
      </template>
      <view v-else class='relative w-10 h-10'>
        <view class='w-10 h-10 absolute left-1/2 transform -translate-x-1/2 -top-4 bg-white rounded-1/2'>
          <image :src='getUrl(item.iconPath)' class='w-full h-full' />
        </view>
        <view class='w-6 h-6'></view>
        <view class=" text-center">{{ item.text }}</view>
      </view>
    </view>
  </div>
</template>

<style lang="scss" scoped>
.tab-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: space-between;
  background-color:#fff;

  .item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    font-size: 10px;
    color: #333;
    &.active {
      color:#1575FF;
    }
  }
}
</style>
