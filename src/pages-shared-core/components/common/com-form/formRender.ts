/**
 * com-form 渲染专用（分包）：将 config（含 loopField）展开为可渲染行。
 * 页面侧 schema / rules 请用主包 @/utils/formConfig。
 */
import type {
  FormConfigEntry,
  FormConfigItem,
  LoopFieldConfig,
  LoopFieldContext,
  ProcessFormConfigOptions,
} from '@/utils/formConfig'

export interface FormRenderRow {
  key: string
  kind: 'field' | 'loop-header'
  item?: FormConfigItem
  fieldIndex: number
  arrayItem?: Record<string, any>
  loopConfig?: LoopFieldConfig
  loopIndex?: number
  loopContext?: LoopFieldContext
  title?: string
}

function getValueByPath(obj: Record<string, any>, path: string) {
  return path.split('.').reduce<any>((current, key) => {
    if (current == null)
      return undefined
    return current[key]
  }, obj)
}

function isLoopFieldConfig(value: unknown): value is LoopFieldConfig {
  if (!value || typeof value !== 'object')
    return false
  const entry = value as LoopFieldConfig & FormConfigItem
  if (entry.compType && entry.compType !== 'loop')
    return false
  return 'arrayPath' in entry && 'fields' in entry
    && (Array.isArray(entry.fields) || typeof entry.fields === 'function')
}

function normalizeFormConfigEntry(entry: FormConfigEntry): FormConfigItem | LoopFieldConfig {
  if (isLoopFieldConfig(entry) && (entry as FormConfigItem).compType === 'loop') {
    const { compType: _compType, ...loopConfig } = entry as FormConfigItem & LoopFieldConfig
    return loopConfig as LoopFieldConfig
  }
  return entry
}

function createLoopFieldContext(
  model: Record<string, any>,
  arrayPath: string,
  index: number,
): LoopFieldContext | null {
  const list = getValueByPath(model, arrayPath)
  if (!Array.isArray(list) || !list[index])
    return null
  return { item: list[index], index, model }
}

function resolveLoopFields(config: LoopFieldConfig, ctx: LoopFieldContext): FormConfigItem[] {
  const rawFields = typeof config.fields === 'function' ? config.fields(ctx) : config.fields
  if (!rawFields)
    return []
  return rawFields.filter(field => !field.hidden)
}

function defaultPlaceholder(item: FormConfigItem) {
  const selectTypes = new Set(['select', 'radio', 'checkbox', 'date', 'tree', 'picker-date', 'switch', 'upload', 'chunk-upload'])
  const prefix = selectTypes.has(item.compType || '')
    ? (item.compType === 'upload' || item.compType === 'chunk-upload' ? '请上传' : '请选择')
    : '请输入'
  return prefix + ((item.label || item.title) || '').replace(/^\d+\./, '').trim()
}

/** 渲染态处理：prop / key / placeholder / bordered / uuid（不生成 rules） */
function processFormItemForRender(item: FormConfigItem, options: ProcessFormConfigOptions = {}): FormConfigItem {
  const { basePath = '', disabled = false } = options
  const newItem = { ...item }

  if (!newItem.prop && newItem.label)
    newItem.prop = newItem.label

  if (basePath && newItem.prop) {
    const cleanProp = newItem.prop.replace(/^\d+\./, '').replace(/^\d+\.\d+\./, '').replace(/^\d+\.\d+\.\d+\./, '')
    newItem.prop = `${basePath}${cleanProp}`
  }

  if (!newItem.key && newItem.prop)
    newItem.key = newItem.prop.split('.').at(-1) as string

  if (!newItem.uuid)
    newItem.uuid = `${newItem.prop || newItem.label || 'field'}_${Date.now()}_${Math.random()}`

  if (!newItem.placeholder) {
    const resolvedDisabled = item.disabled !== undefined ? item.disabled : disabled
    newItem.placeholder = resolvedDisabled ? '' : defaultPlaceholder(newItem)
  }

  if (newItem.bordered === undefined && ['input', 'textarea'].includes(newItem.compType || ''))
    newItem.bordered = true

  return newItem
}

function processFormConfigForRender(config: FormConfigItem[], options: ProcessFormConfigOptions = {}) {
  return config.map(item => processFormItemForRender(item, options))
}

/** 将 config（含 loopField）展开为 com-form 可渲染的行列表 */
export function buildFormRenderRows(
  config: FormConfigEntry[],
  model: Record<string, any>,
  options: ProcessFormConfigOptions = {},
): FormRenderRow[] {
  const rows: FormRenderRow[] = []
  let fieldIndex = 0

  for (const rawEntry of config) {
    const entry = normalizeFormConfigEntry(rawEntry)

    if (isLoopFieldConfig(entry)) {
      const list = getValueByPath(model, entry.arrayPath)
      if (!Array.isArray(list) || list.length === 0)
        continue

      for (let loopIndex = 0; loopIndex < list.length; loopIndex++) {
        const ctx = createLoopFieldContext(model, entry.arrayPath, loopIndex)
        if (!ctx)
          continue
        if (entry.itemVisible && !entry.itemVisible(ctx))
          continue

        const title = entry.itemTitle?.(ctx)
          ?? entry.itemPrefix?.(ctx)?.replace(/：$/, '')
          ?? `第${loopIndex + 1}项`

        rows.push({
          key: `${entry.arrayPath}_${loopIndex}_header`,
          kind: 'loop-header',
          fieldIndex,
          arrayItem: ctx.item,
          loopConfig: entry,
          loopIndex,
          loopContext: ctx,
          title,
        })

        const basePath = `${entry.arrayPath}.${loopIndex}.`
        const fields = processFormConfigForRender(resolveLoopFields(entry, ctx), {
          ...entry.options,
          ...options,
          basePath,
        })

        for (const item of fields) {
          if (item.hidden)
            continue
          rows.push({
            key: item.uuid || `${basePath}${item.prop}`,
            kind: 'field',
            item,
            fieldIndex,
            arrayItem: ctx.item,
            loopConfig: entry,
            loopIndex,
            loopContext: ctx,
          })
          fieldIndex++
        }
      }
      continue
    }

    const [item] = processFormConfigForRender([entry as FormConfigItem], options)
    if (!item || item.hidden)
      continue
    rows.push({
      key: item.uuid || item.prop || `field_${fieldIndex}`,
      kind: 'field',
      item,
      fieldIndex,
    })
    fieldIndex++
  }

  return rows
}
