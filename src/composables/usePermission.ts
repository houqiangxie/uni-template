interface UserInfo {
  permissions?: string[]
  roles?: Array<{ roleKey: string }>
  [key: string]: any
}

/**
 * 检查用户是否拥有指定权限
 * @param permission 权限标识
 * @returns boolean
 */
export function hasPermission(permission: string): boolean {
  const userStore = useUserStore()
  const userInfo = userStore.userInfo as UserInfo
  const permissions = userInfo?.permissions || []

  // 如果没有权限数组或为空，则默认无权限（更安全的默认值）
  if (!permissions || permissions.length === 0)
    return false

  // 检查是否包含指定权限
  return permissions.includes(permission)
}

/**
 * 检查用户是否拥有指定角色
 * @param roleKey 角色标识
 * @returns boolean
 */
export function hasRole(roleKey: string): boolean {
  const userStore = useUserStore()
  const userInfo = userStore.userInfo as UserInfo
  const roles = userInfo?.roles || []

  // 如果没有角色数组或为空，则默认无角色
  if (!roles || roles.length === 0)
    return false

  // 检查是否包含指定角色
  return roles.some(role => role.roleKey === roleKey)
}

/**
 * 检查用户是否拥有指定权限列表中的任意一个权限
 * @param permissions 权限标识数组
 * @returns boolean
 */
export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(permission))
}

/**
 * 检查用户是否拥有指定角色列表中的任意一个角色
 * @param roleKeys 角色标识数组
 * @returns boolean
 */
export function hasAnyRole(roleKeys: string[]): boolean {
  return roleKeys.some(roleKey => hasRole(roleKey))
}

/**
 * 检查用户是否拥有指定权限列表中的所有权限
 * @param permissions 权限标识数组
 * @returns boolean
 */
export function hasAllPermission(permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(permission))
}

/**
 * 检查用户是否拥有指定角色列表中的所有角色
 * @param roleKeys 角色标识数组
 * @returns boolean
 */
export function hasAllRole(roleKeys: string[]): boolean {
  return roleKeys.every(roleKey => hasRole(roleKey))
}
