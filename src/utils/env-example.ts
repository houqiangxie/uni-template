/*
 * @Description: 环境配置使用示例
 * @Date: 2025-01-26
 */

import { baseUrl, staticBaseUrl, envInfo } from './config'

// 使用示例
console.log('当前环境信息:', envInfo)

// API 请求示例
export function createApiUrl(path: string): string {
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`
}

// 静态资源 URL 示例
export function createStaticUrl(path: string): string {
  return `${staticBaseUrl}${path.startsWith('/') ? path.slice(1) : path}`
}

// 使用示例
// const apiUrl = createApiUrl('/api/users')
// const imageUrl = createStaticUrl('images/logo.png')
