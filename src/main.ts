/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-07 20:48:34
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-03-04 14:52:27
 */
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import App from './App.vue'
import 'uno.css'
import router from './router'
export function createApp() {
  const app = createSSRApp(App)
  app.use(Pinia.createPinia())
  app.use(router)
  return {
    app,
    Pinia,
  }
}
