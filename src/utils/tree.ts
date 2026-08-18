/** 根据 key, 返回所有父级数据 */
export function treeFindPath(tree: any, func: Function, path: any[] = []): any {
  if (!tree)
    return []
  for (const data of tree) {
    path.push(data)
    if (func(data))
      return path
    if (data.children) {
      const findChildren = treeFindPath(data.children, func, path)
      if (findChildren.length)
        return findChildren
    }
    path.pop()
  }
  return []
}

/** 根据 id 获取当前递归项数据 */
export function findItemById(list: any[], id: any): any {
  for (const item of list) {
    if (item.id === id)
      return item
    if (item.children) {
      const found = findItemById(item.children, id)
      if (found)
        return found
    }
  }
  return null
}
