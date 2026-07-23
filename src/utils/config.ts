/*
 * @Descripttion: 环境配置文件
 * @version:
 * @Author: houqiangxie
 * @Date: 2024-05-30 15:58:33
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-01-26 09:01:15
 */

// 从环境变量中获取 API 基础地址
export const baseUrl = import.meta.env.VITE_API_BASE_URL 

// 从环境变量中获取静态资源基础地址
export const staticBaseUrl = import.meta.env.VITE_STATIC_BASE_URL 

// 应用标题
export const appTitle = import.meta.env.VITE_APP_TITLE || 'Uni 模板'

// 当前环境
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD

// 环境信息
export const envInfo = {
  mode: import.meta.env.MODE,
  baseUrl,
  staticBaseUrl,
  isDevelopment,
  isProduction
}