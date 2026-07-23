import type { App, DirectiveBinding } from 'vue'
import { hasPermission, hasRole } from './usePermission'

/**
 * 权限指令
 * 用法: v-hasPermi="['permission1', 'permission2']" 或 v-hasPermi="'permission'"
 */
export function setupPermissionDirective(app: App) {
  // 权限指令
  app.directive('hasPermi', {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      // 延迟执行，确保数据已加载
      setTimeout(() => {
        const { value } = binding

        // 如果没有传入权限值，则不处理
        if (!value)
          return

        let hasPermi = false

        if (typeof value === 'string') {
          // 单个权限检查
          hasPermi = hasPermission(value)
        }
        else if (Array.isArray(value)) {
          // 数组权限检查（任意一个权限满足即可）
          hasPermi = value.some(permission => hasPermission(permission))
        }

        // 如果没有权限，则移除元素
        if (!hasPermi)
          el.parentNode?.removeChild(el)
      }, 100) // 增加延迟确保数据加载
    },
  })

  // 角色指令
  app.directive('hasRole', {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
      // 延迟执行，确保数据已加载
      setTimeout(() => {
        const { value } = binding

        // 如果没有传入角色值，则不处理
        if (!value)
          return

        let hasRolePermission = false

        if (typeof value === 'string') {
          // 单个角色检查
          hasRolePermission = hasRole(value)
        }
        else if (Array.isArray(value)) {
          // 数组角色检查（任意一个角色满足即可）
          hasRolePermission = value.some(roleKey => hasRole(roleKey))
        }

        // 如果没有角色权限，则移除元素
        if (!hasRolePermission)
          el.parentNode?.removeChild(el)
      }, 100) // 增加延迟确保数据加载
    },
  })
}
