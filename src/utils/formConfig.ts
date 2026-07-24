/**
 * 表单 config 处理、rules 构建与 schema 转换。
 * 组件用法见：src/components/common/com-form/README.md
 *
 * 推荐链路：config → configToSchema → wd-form :schema
 */
import type { FormSchema } from '@wot-ui/ui'
import type { MaybeRef } from 'vue'
import { unref } from 'vue'

// -----------------------------------------------------------------------------
// rulesToSchema：V1 规则 → wot-ui FormSchema
// -----------------------------------------------------------------------------

export interface FormValidateContext {
  /** 当前字段值 */
  value: any
  /** 完整表单 model */
  model: Record<string, any>
  /** 字段路径，如 confirmPassword / partyMemberInfo.0.name */
  path: string
}

export interface V1FormRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  /** 单字段校验，仅接收当前值 */
  validator?: (value: any) => boolean | string
  /** 跨字段 / 动态校验，可访问 model 与其他字段 */
  modelValidator?: (ctx: FormValidateContext) => boolean | string
}

export type V1FormRules = Record<string, V1FormRule[]>

export type FormSchemaIssue = { path: string, message: string }

export type FormFormValidatorResult =
  | boolean
  | string
  | FormSchemaIssue
  | FormSchemaIssue[]
  | null
  | undefined

/** 表单级自定义校验，可校验多个字段、跨字段逻辑 */
export type FormFormValidator = (model: Record<string, any>) => FormFormValidatorResult

export function getValueByPath(obj: Record<string, any>, path: string) {
  return path.split('.').reduce<any>((current, key) => {
    if (current == null)
      return undefined
    return current[key]
  }, obj)
}

function isEmpty(value: any) {
  return value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)
}

function runRuleValidator(rule: V1FormRule, ctx: FormValidateContext) {
  if (rule.modelValidator) {
    const result = rule.modelValidator(ctx)
    if (result !== true)
      return typeof result === 'string' ? result : (rule.message || '校验失败')
    return null
  }

  if (rule.validator) {
    const result = rule.validator(ctx.value)
    if (result !== true)
      return typeof result === 'string' ? result : (rule.message || '校验失败')
  }

  return null
}

function validateFieldValue(value: any, fieldRules: V1FormRule[], path: string, model: Record<string, any>) {
  const ctx: FormValidateContext = { value, model, path }
  for (const rule of fieldRules) {
    if (rule.required && isEmpty(value))
      return rule.message || '必填'

    if (rule.pattern && !isEmpty(value) && !rule.pattern.test(String(value)))
      return rule.message || '格式错误'

    if (rule.min !== undefined && !isEmpty(value) && String(value).length < rule.min)
      return rule.message || `最少${rule.min}个字符`

    if (rule.max !== undefined && !isEmpty(value) && String(value).length > rule.max)
      return rule.message || `最多${rule.max}个字符`

    const validatorMessage = runRuleValidator(rule, ctx)
    if (validatorMessage)
      return validatorMessage
  }
  return null
}

export function normalizeFormValidatorResult(result: FormFormValidatorResult): FormSchemaIssue[] {
  if (result === true || result === false || result === null || result === undefined)
    return []
  if (typeof result === 'string')
    return [{ path: '', message: result }]
  if (Array.isArray(result))
    return result
  return [result]
}

/** 生成跨字段 modelValidator 规则，可传多个校验函数 */
export function modelRules(
  ...validators: Array<(ctx: FormValidateContext) => boolean | string>
): V1FormRule[] {
  return validators.map(modelValidator => ({ modelValidator }))
}

export function rulesToSchema(rules: MaybeRef<V1FormRules>): FormSchema {
  const getRules = () => unref(rules)

  return {
    validate(model) {
      const issues: { path: Array<string | number>, message: string }[] = []
      for (const [path, fieldRules] of Object.entries(getRules())) {
        const value = getValueByPath(model, path)
        const message = validateFieldValue(value, fieldRules, path, model)
        if (message)
          issues.push({ path: path.split('.'), message })
      }
      return issues
    },
    isRequired(path: string) {
      return getRules()[path]?.some(rule => rule.required) ?? false
    },
  }
}

// -----------------------------------------------------------------------------
// formConfig：config 处理与 schema 构建
// -----------------------------------------------------------------------------

export interface FormConfigItem {
  prop?: string
  label?: string
  title?: string
  compType?: string
  required?: boolean
  hidden?: boolean
  hiddenLabel?: boolean
  /** 未传则继承 com-form 的 disabled */
  disabled?: boolean
  /** 未传则继承 com-form 的 vertical */
  vertical?: boolean
  /** 未传则继承 com-form 的 border；传 boolean 时覆盖该项分隔线 */
  border?: boolean
  bordered?: boolean
  placeholder?: string
  rules?: V1FormRule[]
  extendRules?: V1FormRule[]
  /** 跨字段 / 动态校验，可传多个，按顺序执行 */
  customValidators?: Array<(ctx: FormValidateContext) => boolean | string>
  validationType?: string
  columns?: Array<{ text: string, value: any }>
  multiple?: boolean
  limit?: number
  type?: string
  inputType?: string
  maxlength?: number
  accept?: string
  showArrow?: boolean
  isLink?: boolean
  labelKey?: string
  valueKey?: string
  change?: (...args: any[]) => void
  onFocus?: () => void
  readonly?: boolean
  suffixIcon?: string
  // processed fields
  key?: string
  uuid?: string
  [key: string]: any
}

export interface ProcessFormConfigOptions {
  basePath?: string
  disabled?: boolean
}

const arrayRequired = (v: any) => {
  return Array.isArray(v)
    && v.length > 0
    && v.every(item =>
      item !== null
      && item !== undefined
      && String(item).trim() !== '',
    )
}

export function generateDefaultPlaceholder(item: FormConfigItem) {
  const prefixMap: Record<string, string> = {
    input: '请输入',
    textarea: '请输入',
    upload: '请上传',
    'chunk-upload': '请上传',
    select: '请选择',
    radio: '请选择',
    checkbox: '请选择',
    date: '请选择',
    tree: '请选择',
    'picker-date': '请选择',
  }

  const prefix = prefixMap[item.compType || ''] || '请输入'
  return prefix + ((item.label || item.title) || '').replace(/^\d+\./, '').trim()
}

export function getDefaultValidator(item: FormConfigItem) {
  if (item.multiple)
    return (v: any) => arrayRequired(v)
  switch (item.compType) {
    case 'multi-input':
    case 'matrix-input':
    case 'sign':
      return (v: any) => arrayRequired(v)
    case 'upload':
    case 'chunk-upload':
      if (!item.limit)
        item.limit = 9
      return item.limit > 1 ? (v: any) => arrayRequired(v) : (v: any) => v?.filePath
    case 'select':
    case 'tree':
      if (item.multiple)
        return (v: any) => arrayRequired(v)
      break
    case 'checkbox':
      return (v: any) => arrayRequired(v)
    case 'date':
      if (item.type === 'daterange' || item.type === 'datetimerange')
        return (v: any) => arrayRequired(v)
      break
  }
  return null
}

function hasRequiredRule(rules: V1FormRule[]) {
  return rules.some(rule => rule.required === true)
}

function phoneValidator(value: any) {
  if (!value)
    return true
  return /^1[3-9]\d{9}$/.test(value)
}

function idCardValidator(value: any) {
  if (!value)
    return true
  const idCardReg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
  if (!idCardReg.test(value))
    return false
  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++)
    sum += Number.parseInt(value[i]) * factors[i]
  return value[17].toUpperCase() === checkCodes[sum % 11]
}

function emailValidator(value: any) {
  if (!value)
    return true
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
}

function telValidator(value: any) {
  if (!value)
    return true
  return /^(\d{3,4}-?)?\d{7,8}$/.test(value)
}

function numberValidator(value: any) {
  if (!value && value !== 0)
    return true
  return !Number.isNaN(Number(value))
}

function positiveIntegerValidator(value: any) {
  if (!value && value !== 0)
    return true
  const num = Number(value)
  return Number.isInteger(num) && num > 0
}

function nonNegativeValidator(value: any) {
  if (!value && value !== 0)
    return true
  const num = Number(value)
  return !Number.isNaN(num) && num >= 0
}

function creditCodeValidator(value: any) {
  if (!value)
    return true
  return /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(value)
}

function bankCardValidator(value: any) {
  if (!value)
    return true
  if (!/^\d{13,19}$/.test(value))
    return false
  let sum = 0
  let isEven = false
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(value[i])
    if (isEven) {
      digit *= 2
      if (digit > 9)
        digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

function getDefaultMessage(type: string, action: string) {
  const typeMap: Record<string, string> = {
    phone: '手机号',
    idCard: '身份证号',
    email: '邮箱',
    tel: '固定电话',
    number: '数字',
    positiveInteger: '正整数',
    nonNegative: '非负数',
    creditCode: '统一社会信用代码',
    bankCard: '银行卡号',
  }
  const actionMap: Record<string, string> = {
    required: '请输入',
    select: '请选择',
  }
  return `${actionMap[action] || '请输入'}${typeMap[type] || ''}`
}

function createValidationRules(type: string, required = false, customMessage?: string): V1FormRule[] {
  const rules: V1FormRule[] = []
  if (required) {
    rules.push({
      required: true,
      message: customMessage || getDefaultMessage(type, 'required'),
    })
  }
  const validatorMap: Record<string, (v: any) => boolean> = {
    phone: phoneValidator,
    idCard: idCardValidator,
    email: emailValidator,
    tel: telValidator,
    number: numberValidator,
    positiveInteger: positiveIntegerValidator,
    nonNegative: nonNegativeValidator,
    creditCode: creditCodeValidator,
    bankCard: bankCardValidator,
  }
  const messageMap: Record<string, string> = {
    phone: '请输入正确的手机号码',
    idCard: '请输入正确的身份证号码',
    email: '请输入正确的邮箱地址',
    tel: '请输入正确的固定电话',
    number: '请输入正确的数字',
    positiveInteger: '请输入正整数',
    nonNegative: '请输入非负数',
    creditCode: '请输入正确的统一社会信用代码',
    bankCard: '请输入正确的银行卡号',
  }
  if (validatorMap[type]) {
    rules.push({
      validator: validatorMap[type],
      message: customMessage || messageMap[type],
    })
  }
  return rules
}

const commonRules: Record<string, V1FormRule[]> = {
  phone: createValidationRules('phone'),
  phoneRequired: createValidationRules('phone', true),
  idCard: createValidationRules('idCard'),
  idCardRequired: createValidationRules('idCard', true),
  email: createValidationRules('email'),
  emailRequired: createValidationRules('email', true),
  tel: createValidationRules('tel'),
  telRequired: createValidationRules('tel', true),
  number: createValidationRules('number'),
  numberRequired: createValidationRules('number', true),
  positiveInteger: createValidationRules('positiveInteger'),
  positiveIntegerRequired: createValidationRules('positiveInteger', true),
  nonNegative: createValidationRules('nonNegative'),
  nonNegativeRequired: createValidationRules('nonNegative', true),
  creditCode: createValidationRules('creditCode'),
  creditCodeRequired: createValidationRules('creditCode', true),
  bankCard: createValidationRules('bankCard'),
  bankCardRequired: createValidationRules('bankCard', true),
}

export function generateValidationRules(item: FormConfigItem): V1FormRule[] {
  const rules: V1FormRule[] = []
  if (item.required) {
    rules.push({
      required: true,
      message: item.placeholder || generateDefaultPlaceholder(item),
      validator: getDefaultValidator(item) || undefined,
    })
  }
  return rules
}

export function processFormItem(
  item: FormConfigItem,
  options: ProcessFormConfigOptions = {},
): FormConfigItem {
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
    newItem.placeholder = resolvedDisabled ? '' : generateDefaultPlaceholder(newItem)
  }

  if (newItem.bordered === undefined && ['input', 'textarea'].includes(newItem.compType || ''))
    newItem.bordered = true

  if (!newItem.rules || newItem.rules.length === 0) {
    newItem.rules = generateValidationRules(newItem)
  }
  else if (newItem.required && !hasRequiredRule(newItem.rules)) {
    newItem.rules.unshift({
      required: true,
      message: newItem.placeholder || generateDefaultPlaceholder(newItem),
    })
  }

  if (newItem.extendRules?.length) {
    newItem.rules = [...(newItem.rules || []), ...newItem.extendRules]
  }

  if (newItem.customValidators?.length) {
    newItem.rules = [...(newItem.rules || []), ...modelRules(...newItem.customValidators)]
  }

  if (newItem.validationType) {
    const validationRules = commonRules[newItem.validationType]
    if (validationRules) {
      const filteredRules = validationRules.filter((rule) => {
        if (rule.required && hasRequiredRule(newItem.rules || []))
          return false
        return true
      })
      newItem.rules = [...(newItem.rules || []), ...filteredRules]
    }
  }

  return newItem
}

export function processFormConfig(
  config: FormConfigItem[],
  options: ProcessFormConfigOptions = {},
): FormConfigItem[] {
  return config.map(item => processFormItem(item, options))
}

export type FormConfigEntry = FormConfigItem | LoopFieldConfig

/** com-form 渲染行：普通字段 / 循环块标题 / 循环块内字段 */
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

export function isLoopFieldConfig(value: unknown): value is LoopFieldConfig {
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
        const fields = processFormConfig(resolveLoopFields(entry, ctx), {
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

    const [item] = processFormConfig([entry as FormConfigItem], options)
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

export function configToRules(
  config: FormConfigItem[] | FormConfigItem,
  options: ProcessFormConfigOptions = {},
): V1FormRules {
  const list = Array.isArray(config) ? config : [config]
  const processed = processFormConfig(list, options)
  const rules: V1FormRules = {}
  for (const item of processed) {
    if (!item.prop || item.hidden || item.compType?.startsWith('slot'))
      continue
    if (item.rules?.length)
      rules[item.prop] = item.rules
  }
  return rules
}

export type FormConfigSource =
  | FormConfigItem[] | FormConfigItem
  | MaybeRef<FormConfigItem[] | FormConfigItem>
  | (() => FormConfigItem[] | FormConfigItem)

/** v-for 等动态列表字段的校验上下文 */
export interface LoopFieldContext {
  /** 当前数组项数据 */
  item: Record<string, any>
  /** 当前索引 */
  index: number
  /** 完整表单 model */
  model: Record<string, any>
}

export type LoopFieldResolver =
  | FormConfigItem[]
  | ((ctx: LoopFieldContext) => FormConfigItem[] | false | null | undefined)

/** v-for 等动态列表字段的校验配置 */
export interface LoopFieldConfig {
  /** 数组字段路径，如 partyMemberInfo */
  arrayPath: string
  /**
   * 数组每一项内的字段配置（prop 为相对路径，会自动拼成 arrayPath.index.prop）
   * 支持函数形式，按 item / index / model 动态返回；hidden 字段会自动跳过校验
   */
  fields: LoopFieldResolver
  /** 错误消息前缀，如 ({ index }) => `第${index + 1}个党员干部` */
  itemPrefix?: (ctx: LoopFieldContext) => string
  /** 循环项标题（com-form 渲染用），如 ({ index }) => `成员 ${index + 1}` */
  itemTitle?: (ctx: LoopFieldContext) => string
  /** 整项是否参与校验，返回 false 则跳过该项全部字段 */
  itemVisible?: (ctx: LoopFieldContext) => boolean
  options?: ProcessFormConfigOptions
}

export interface FormRulesBuildOptions {
  extraRules?: V1FormRules | MaybeRef<V1FormRules> | ((model: Record<string, any>) => V1FormRules)
  loops?: LoopFieldConfig | LoopFieldConfig[]
  /** 表单级自定义校验，可校验多个字段、复杂业务逻辑 */
  formValidators?: FormFormValidator | FormFormValidator[]
  options?: ProcessFormConfigOptions
}

export type ConfigSchemaPart =
  | FormConfigSource
  | V1FormRules
  | LoopFieldConfig
  | FormRulesBuildOptions

function resolveFormConfigList(source: FormConfigSource, options?: ProcessFormConfigOptions): FormConfigItem[] {
  const raw = typeof source === 'function' ? source() : unref(source)
  const list = Array.isArray(raw) ? raw : [raw]
  return processFormConfig(list, options)
}

function isFormConfigItem(value: unknown): value is FormConfigItem {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && ('prop' in value || 'compType' in value || 'label' in value || 'title' in value)
}

function isFormConfigSource(value: unknown): value is FormConfigSource {
  if (typeof value === 'function')
    return true
  if (isFormConfigItem(value))
    return true
  if (Array.isArray(value))
    return value.length === 0 || isFormConfigItem(value[0])
  if (value && typeof value === 'object' && 'value' in value)
    return true
  return false
}

function isV1FormRules(value: unknown): value is V1FormRules {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return false
  if (isLoopFieldConfig(value) || isFormConfigItem(value))
    return false
  if ('extraRules' in value || 'loops' in value || 'options' in value || 'formValidators' in value)
    return false
  return Object.values(value).every(item => Array.isArray(item))
}

function isFormRulesBuildOptions(value: unknown): value is FormRulesBuildOptions {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && ('extraRules' in value || 'loops' in value || 'options' in value || 'formValidators' in value)
    && !isFormConfigItem(value)
}

function applyLoopItemPrefix(
  message: string | undefined,
  ctx: LoopFieldContext,
  itemPrefix?: (ctx: LoopFieldContext) => string,
) {
  if (!message || !itemPrefix)
    return message
  return `${itemPrefix(ctx)}：${message}`
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
  const rawFields = typeof config.fields === 'function'
    ? config.fields(ctx)
    : config.fields
  if (!rawFields)
    return []
  return rawFields.filter(field => !field.hidden)
}

function parseSchemaParts(parts: ConfigSchemaPart[]) {
  const configs: FormConfigSource[] = []
  let extraRules: FormRulesBuildOptions['extraRules']
  const loops: LoopFieldConfig[] = []
  const formValidators: FormFormValidator[] = []
  let options: ProcessFormConfigOptions | undefined

  for (const part of parts) {
    if (isFormRulesBuildOptions(part)) {
      if (part.extraRules)
        extraRules = part.extraRules
      if (part.loops)
        loops.push(...(Array.isArray(part.loops) ? part.loops : [part.loops]))
      if (part.formValidators)
        formValidators.push(...(Array.isArray(part.formValidators) ? part.formValidators : [part.formValidators]))
      if (part.options)
        options = { ...options, ...part.options }
      continue
    }
    if (isLoopFieldConfig(part)) {
      loops.push(part)
      continue
    }
    if (isV1FormRules(part)) {
      extraRules = {
        ...(typeof extraRules === 'object' && extraRules && !Array.isArray(extraRules) && typeof extraRules !== 'function'
          ? unref(extraRules)
          : {}),
        ...part,
      }
      continue
    }
    configs.push(part)
  }

  return { configs, extraRules, loops, formValidators, options }
}

function runFormValidators(model: Record<string, any>, validators: FormFormValidator[]) {
  const issues: { path: Array<string | number>, message: string }[] = []
  for (const validator of validators) {
    for (const issue of normalizeFormValidatorResult(validator(model))) {
      if (!issue.path)
        continue
      issues.push({ path: issue.path.split('.'), message: issue.message })
    }
  }
  return issues
}
function resolveExtraRules(
  extraRules: FormRulesBuildOptions['extraRules'],
  model: Record<string, any>,
): V1FormRules {
  if (!extraRules)
    return {}
  if (typeof extraRules === 'function')
    return extraRules(model) || {}
  return { ...unref(extraRules) }
}

function isLoopFieldRequired(loop: LoopFieldConfig, path: string, model: Record<string, any>) {
  const prefix = `${loop.arrayPath}.`
  if (!path.startsWith(prefix))
    return false
  const segments = path.slice(prefix.length).split('.')
  const index = Number.parseInt(segments[0], 10)
  if (Number.isNaN(index))
    return false
  const fieldProp = segments.slice(1).join('.')
  if (!fieldProp)
    return false

  const ctx = createLoopFieldContext(model, loop.arrayPath, index)
  if (!ctx)
    return false
  if (loop.itemVisible && !loop.itemVisible(ctx))
    return false

  const field = resolveLoopFields(loop, ctx).find(item => item.prop === fieldProp)
  return !!field?.required
}

/** 合并多个表单 config / ref / 工厂函数，生成静态 rules */
export function configsToRules(...sources: FormConfigSource[]): V1FormRules
export function configsToRules(options: ProcessFormConfigOptions, ...sources: FormConfigSource[]): V1FormRules
export function configsToRules(...args: [ProcessFormConfigOptions | FormConfigSource, ...(FormConfigSource[])]): V1FormRules {
  let options: ProcessFormConfigOptions = {}
  let sources: FormConfigSource[] = args as FormConfigSource[]

  if (args.length > 0 && !isFormConfigSource(args[0]) && typeof args[0] === 'object' && !Array.isArray(args[0]) && typeof args[0] !== 'function') {
    options = args[0] as ProcessFormConfigOptions
    sources = args.slice(1) as FormConfigSource[]
  }

  return sources.reduce<V1FormRules>((merged, source) => {
    const list = resolveFormConfigList(source, options)
    return { ...merged, ...configToRules(list, options) }
  }, {})
}

/** 根据 model 生成完整 rules，包含循环字段 */
export function buildFormRules(
  model: Record<string, any>,
  ...parts: ConfigSchemaPart[]
): V1FormRules {
  const { configs, extraRules, loops, options } = parseSchemaParts(parts)
  let rules = configs.length ? configsToRules(options || {}, ...configs) : {}

  rules = { ...rules, ...resolveExtraRules(extraRules, model) }

  for (const loop of loops)
    rules = { ...rules, ...loopFieldToRules(loop, model) }

  return rules
}

/** 循环列表字段 rules，需传入当前 model 以确定数组长度与动态配置 */
export function loopFieldToRules(config: LoopFieldConfig, model: Record<string, any>): V1FormRules {
  const rules: V1FormRules = {}
  const list = getValueByPath(model, config.arrayPath)
  if (!Array.isArray(list) || list.length === 0)
    return rules

  for (let index = 0; index < list.length; index++) {
    const ctx = createLoopFieldContext(model, config.arrayPath, index)
    if (!ctx)
      continue
    if (config.itemVisible && !config.itemVisible(ctx))
      continue

    const basePath = `${config.arrayPath}.${index}.`
    const itemRules = configToRules(resolveLoopFields(config, ctx), { ...config.options, basePath })
    for (const [prop, fieldRules] of Object.entries(itemRules)) {
      rules[prop] = fieldRules.map(rule => ({
        ...rule,
        message: applyLoopItemPrefix(rule.message, ctx, config.itemPrefix),
      }))
    }
  }
  return rules
}

/** 循环字段配置工厂，便于在 configToSchema 中传入 */
export function loopField(config: LoopFieldConfig): LoopFieldConfig {
  return config
}

/**
 * 将表单 config 转为 wot-ui v2 的 FormSchema。
 * 支持多个 config、ref/computed、工厂函数、额外 rules、循环列表字段。
 *
 * @example 基础
 * configToSchema(formConfig)
 *
 * @example 多块 com-form
 * configToSchema(blockA, blockB)
 *
 * @example extraRules（slot 字段 / 条件校验）
 * configToSchema(formConfig, {
 *   extraRules: (model) => ({
 *     stationName: [{ modelValidator: ({ model: m }) => !!m.stationInfoId || '请选择站点' }],
 *     ...(model.serviceMode === 'offline' ? { address: [{ required: true, message: '线下服务请输入地址' }] } : {}),
 *   }),
 * })
 *
 * @example formValidators（表单级校验）
 * configToSchema(formConfig, {
 *   formValidators: [
 *     (model) => model.endTime >= model.startTime || { path: 'endTime', message: '结束时间不能早于开始时间' },
 *   ],
 * })
 *
 * @example loopField（循环列表）
 * configToSchema(baseConfig, { loops: loopField({ arrayPath: 'members', fields: [...] }) })
 */
export function configToSchema(...parts: ConfigSchemaPart[]): FormSchema {
  const parsed = parseSchemaParts(parts)

  return {
    validate(model) {
      const baseResult = rulesToSchema(buildFormRules(model, ...parts)).validate(model)
      const appendIssues = () => runFormValidators(model, parsed.formValidators)

      if (!parsed.formValidators.length)
        return baseResult

      if (baseResult instanceof Promise)
        return baseResult.then(issues => [...issues, ...appendIssues()])

      return [...baseResult, ...appendIssues()]
    },
    isRequired(path) {
      const staticRules = parsed.configs.length
        ? configsToRules(parsed.options || {}, ...parsed.configs)
        : {}
      if (staticRules[path]?.some(rule => rule.required))
        return true
      if (resolveExtraRules(parsed.extraRules, {})[path]?.some(rule => rule.required))
        return true
      return parsed.loops.some(loop => isLoopFieldRequired(loop, path, {}))
    },
  }
}
