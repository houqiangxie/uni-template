/*
 * @Author: houqiangxie
 * @Date: 2021-10-13 11:15:00
 * @LastEditTime: 2024-07-11 15:18:16
 * @LastEditors: houqiangxie
 * @Description:
 * @FilePath: \uniapp-vue3-fant-ts\src\router\index.ts
 * 记得注释
 */
const router = createRouter({
  routes: ROUTES
})
// router.beforeEach((to, from, next) => {
//   const token = uni.getStorageSync("TOKEN")
//   if (!token && to && to.name !== 'login') {
//     // 如果没有登录信息且目标路由不是登录页面则跳转到登录页面
//     next({ name: 'login', navType: 'replaceAll' })
//   } else if (token && to && to.name === 'login') {
//     // 如果已经登录且目标页面是登录页面则跳转至首页
//     next({ name: 'home', navType: 'replaceAll' })
//   } else {
//     next()
//   }
// })
// router.afterEach((to, from) => {
//   const token = uni.getStorageSync("TOKEN")
//   if (!token && to.name !== 'login') {
//     // 如果没有登录信息且目标路由不是登录页面则跳转到登录页面
//     router.replaceAll({ name: 'login' })
//   } else if (token && to.name === 'login') {
//     // 如果已经登录且目标页面是登录页面则跳转至首页
//     router.replaceAll({ name: 'home' })
//   }
// })

export default router
