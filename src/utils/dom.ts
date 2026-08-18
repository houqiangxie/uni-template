export type RectResultType<T extends boolean> = T extends true ? UniApp.NodeInfo[] : UniApp.NodeInfo

export function getRect<T extends boolean>(selector: string, all: T, scope?: any, useFields?: boolean): Promise<RectResultType<T>> {
  return new Promise<RectResultType<T>>((resolve, reject) => {
    let query: UniNamespace.SelectorQuery | null = null
    if (scope)
      query = uni.createSelectorQuery().in(scope)
    else
      query = uni.createSelectorQuery()

    const method = all ? 'selectAll' : 'select'

    const callback = (rect: UniApp.NodeInfo | UniApp.NodeInfo[]) => {
      if (all && Array.isArray(rect) && rect.length > 0)
        resolve(rect as RectResultType<T>)
      else if (!all && rect)
        resolve(rect as RectResultType<T>)
      else
        reject(new Error('No nodes found'))
    }

    if (useFields)
      query[method](selector).fields({ size: true, node: true }, callback).exec()
    else
      query[method](selector).boundingClientRect(callback).exec()
  })
}
