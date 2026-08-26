/**
 * 页面侧表单 API（主包）：configToSchema / loopField / modelRules。
 * com-form 渲染展开在分包：com-form/formRender.ts。
 * 推荐链路：config → configToSchema → wd-form :schema
 */
import type { FormSchema } from '@wot-ui/ui'

// -----------------------------------------------------------------------------
// types
// -----------------------------------------------------------------------------

export interface FormValidateContext {
  value: any
  model: Record<string, any>
  path: string
}

export interface V1FormRule {
  required?: boolean
  message?: string
  pattern?: RegExp
  min?: number
  max?: number
  validator?: (value: any) => boolean | string
  modelValidator?: (ctx: FormValidateContext) => boolean | string
}

export type V1FormRules = Record<string, V1FormRule[]>

export interface FormSchemaIssue { path: string; message: string }

export type FormFormValidatorResult =
  | boolean
  | string
  | FormSchemaIssue
  | FormSchemaIssue[]
  | null
  | undefined

export type FormFormValidator = (model: Record<string, any>) => FormFormValidatorResult

export interface FormConfigItem {
  prop?: string
  label?: string
  title?: string
  compType?: string
  required?: boolean
  hidden?: boolean
  hiddenLabel?: boolean
  disabled?: boolean
  vertical?: boolean
  border?: boolean
  bordered?: boolean
  placeholder?: string
  rules?: V1FormRule[]
  extendRules?: V1FormRule[]
  customValidators?: Array<(ctx: FormValidateContext) => boolean | string>
  validationType?: string
  columns?: Array<{ text: string; value: any }>
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
  key?: string
  uuid?: string
  [key: string]: any
}

export interface ProcessFormConfigOptions {
  basePath?: string
  disabled?: boolean
}

export interface LoopFieldContext {
  item: Record<string, any>
  index: number
  model: Record<string, any>
}

export type LoopFieldResolver =
  | FormConfigItem[]
  | ((ctx: LoopFieldContext) => FormConfigItem[] | false | null | undefined)

export interface LoopFieldConfig {
  arrayPath: string
  fields: LoopFieldResolver
  itemPrefix?: (ctx: LoopFieldContext) => string
  /** 循环项标题（com-form 渲染用） */
  itemTitle?: (ctx: LoopFieldContext) => string
  itemVisible?: (ctx: LoopFieldContext) => boolean
  options?: ProcessFormConfigOptions
}

export type FormConfigEntry = FormConfigItem | LoopFieldConfig

export type FormConfigSource =
  | FormConfigItem[] | FormConfigItem
  | MaybeRef<FormConfigItem[] | FormConfigItem>
  | (() => FormConfigItem[] | FormConfigItem)

export interface FormRulesBuildOptions {
  extraRules?: V1FormRules | MaybeRef<V1FormRules> | ((model: Record<string, any>) => V1FormRules)
  loops?: LoopFieldConfig | LoopFieldConfig[]
  formValidators?: FormFormValidator | FormFormValidator[]
  options?: ProcessFormConfigOptions
}

export type ConfigSchemaPart =
  | FormConfigSource
  | V1FormRules
  | LoopFieldConfig
  | FormRulesBuildOptions

// -----------------------------------------------------------------------------
// public helpers
// -----------------------------------------------------------------------------

/** 跨字段 modelValidator 简写 */
export function modelRules(
  ...validators: Array<(ctx: FormValidateContext) => boolean | string>
): V1FormRule[] {
  return validators.map(modelValidator => ({ modelValidator }))
}

/** 循环字段配置工厂 */
export function loopField(config: LoopFieldConfig): LoopFieldConfig {
  return config
}

/** config → wot-ui FormSchema */
export function configToSchema(...parts: ConfigSchemaPart[]): FormSchema {
  const parsed = parseSchemaParts(parts)
  const buildRules = (model: Record<string, any>) => buildFormRulesFromParsed(parsed, model)

  return {
    validate(model) {
      const baseResult = rulesToSchema(buildRules(model)).validate(model)
      const appendIssues = () => runFormValidators(model, parsed.formValidators)

      if (!parsed.formValidators.length) return baseResult

      if (baseResult instanceof Promise) return baseResult.then(issues => [...issues, ...appendIssues()])

      return [...baseResult, ...appendIssues()]
    },
    isRequired(path) {
      const staticRules = parsed.configs.length
        ? configsToRules(parsed.options || {}, ...parsed.configs)
        : {}
      if (staticRules[path]?.some(rule => rule.required)) return true
      if (resolveExtraRules(parsed.extraRules, {})[path]?.some(rule => rule.required)) return true
      return parsed.loops.some(loop => isLoopFieldRequired(loop, path, {}))
    },
  }
}

// -----------------------------------------------------------------------------
// path / rule runtime
// -----------------------------------------------------------------------------

function getValueByPath(obj: Record<string, any>, path: string) {
  return path.split('.').reduce<any>((current, key) => {
    if (current == null) return undefined
    return current[key]
  }, obj)
}

function isEmpty(value: any) {
  return value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)
}

function resolveValidatorResult(result: boolean | string, fallbackMessage?: string) {
  if (result === true) return null
  return typeof result === 'string' ? result : (fallbackMessage || '校验失败')
}

function runRuleValidator(rule: V1FormRule, ctx: FormValidateContext) {
  if (rule.modelValidator) return resolveValidatorResult(rule.modelValidator(ctx), rule.message)
  if (rule.validator) return resolveValidatorResult(rule.validator(ctx.value), rule.message)
  return null
}

function validateFieldValue(value: any, fieldRules: V1FormRule[], path: string, model: Record<string, any>) {
  const ctx: FormValidateContext = { value, model, path }
  for (const rule of fieldRules) {
    if (rule.required && isEmpty(value)) return rule.message || '必填'
    if (rule.pattern && !isEmpty(value) && !rule.pattern.test(String(value))) return rule.message || '格式错误'
    if (rule.min !== undefined && !isEmpty(value) && String(value).length < rule.min) return rule.message || `最少${rule.min}个字符`
    if (rule.max !== undefined && !isEmpty(value) && String(value).length > rule.max) return rule.message || `最多${rule.max}个字符`
    const validatorMessage = runRuleValidator(rule, ctx)
    if (validatorMessage) return validatorMessage
  }
  return null
}

function normalizeFormValidatorResult(result: FormFormValidatorResult): FormSchemaIssue[] {
  if (result === true || result === false || result === null || result === undefined) return []
  if (typeof result === 'string') return [{ path: '', message: result }]
  if (Array.isArray(result)) return result
  return [result]
}

function rulesToSchema(rules: MaybeRef<V1FormRules>): FormSchema {
  const getRules = () => unref(rules)
  return {
    validate(model) {
      const issues: { path: Array<string | number>; message: string }[] = []
      for (const [path, fieldRules] of Object.entries(getRules())) {
        const message = validateFieldValue(getValueByPath(model, path), fieldRules, path, model)
        if (message) issues.push({ path: path.split('.'), message })
      }
      return issues
    },
    isRequired(path: string) {
      return getRules()[path]?.some(rule => rule.required) ?? false
    },
  }
}

// -----------------------------------------------------------------------------
// validationType presets（数据驱动，避免成对 Required 样板）
// -----------------------------------------------------------------------------

function arrayRequired(v: any) {
  return Array.isArray(v)
    && v.length > 0
    && v.every(item => item != null && String(item).trim() !== '')
}

function idCardValidator(value: any) {
  if (!value) return true
  if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(value)) return false
  const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) sum += Number.parseInt(value[i]) * factors[i]
  return value[17].toUpperCase() === checkCodes[sum % 11]
}

function bankCardValidator(value: any) {
  if (!value) return true
  if (!/^\d{13,19}$/.test(value)) return false
  let sum = 0
  let isEven = false
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(value[i])
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

function numericOptional(v: any, test: (num: number) => boolean) {
  if (!v && v !== 0) return true
  return test(Number(v))
}

const VALIDATION_PRESETS: Record<string, { label: string; message: string; test: (v: any) => boolean }> = {
  phone: { label: '手机号', message: '请输入正确的手机号码', test: v => !v || /^1[3-9]\d{9}$/.test(v) },
  idCard: { label: '身份证号', message: '请输入正确的身份证号码', test: idCardValidator },
  email: { label: '邮箱', message: '请输入正确的邮箱地址', test: v => !v || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) },
  tel: { label: '固定电话', message: '请输入正确的固定电话', test: v => !v || /^(\d{3,4}-?)?\d{7,8}$/.test(v) },
  number: { label: '数字', message: '请输入正确的数字', test: v => (v || v === 0) ? !Number.isNaN(Number(v)) : true },
  positiveInteger: { label: '正整数', message: '请输入正整数', test: v => numericOptional(v, num => Number.isInteger(num) && num > 0) },
  nonNegative: { label: '非负数', message: '请输入非负数', test: v => numericOptional(v, num => !Number.isNaN(num) && num >= 0) },
  creditCode: { label: '统一社会信用代码', message: '请输入正确的统一社会信用代码', test: v => !v || /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(v) },
  bankCard: { label: '银行卡号', message: '请输入正确的银行卡号', test: bankCardValidator },
}

function resolveValidationType(type: string): V1FormRule[] {
  const required = type.endsWith('Required')
  const key = required ? type.slice(0, -8) : type
  const preset = VALIDATION_PRESETS[key]
  if (!preset) return []
  const rules: V1FormRule[] = []
  if (required) rules.push({ required: true, message: `请输入${preset.label}` })
  rules.push({ validator: preset.test, message: preset.message })
  return rules
}

function defaultPlaceholder(item: FormConfigItem) {
  const selectTypes = new Set(['select', 'radio', 'checkbox', 'date', 'tree', 'picker-date', 'switch', 'upload', 'chunk-upload'])
  const prefix = selectTypes.has(item.compType || '')
    ? (item.compType === 'upload' || item.compType === 'chunk-upload' ? '请上传' : '请选择')
    : '请输入'
  return prefix + ((item.label || item.title) || '').replace(/^\d+\./, '').trim()
}

const ARRAY_COMP_TYPES = new Set(['multi-input', 'matrix-input', 'checkbox'])

function defaultRequiredValidator(item: FormConfigItem) {
  if (item.multiple || ARRAY_COMP_TYPES.has(item.compType || '')) return (v: any) => arrayRequired(v)
  switch (item.compType) {
    case 'sign': {
      const limit = item.limit ?? 1
      item.limit = limit
      // Sign 默认存数组；limit===1 时也可能是单对象
      return limit > 1
        ? (v: any) => arrayRequired(v)
        : (v: any) => (Array.isArray(v) ? arrayRequired(v) : !!v?.filePath)
    }
    case 'upload':
    case 'chunk-upload': {
      const limit = item.limit || 9
      item.limit = limit
      return limit > 1 ? (v: any) => arrayRequired(v) : (v: any) => v?.filePath
    }
    case 'select':
    case 'tree':
      return item.multiple ? (v: any) => arrayRequired(v) : null
    case 'date':
      return (item.type === 'daterange' || item.type === 'datetimerange')
        ? (v: any) => arrayRequired(v)
        : null
    default:
      return null
  }
}

function hasRequiredRule(rules: V1FormRule[]) {
  return rules.some(rule => rule.required)
}

/** 仅处理 schema/rules 所需字段（placeholder 用于必填文案；渲染态由 formRender 处理） */
function processFormItem(item: FormConfigItem, options: ProcessFormConfigOptions = {}): FormConfigItem {
  const { basePath = '', disabled = false } = options
  const newItem = { ...item }

  if (!newItem.prop && newItem.label) newItem.prop = newItem.label

  if (basePath && newItem.prop) {
    const cleanProp = newItem.prop.replace(/^(\d+\.)+/, '')
    newItem.prop = `${basePath}${cleanProp}`
  }

  if (!newItem.placeholder) {
    const resolvedDisabled = item.disabled !== undefined ? item.disabled : disabled
    newItem.placeholder = resolvedDisabled ? '' : defaultPlaceholder(newItem)
  }

  if (!newItem.rules?.length) {
    newItem.rules = newItem.required
      ? [{
          required: true,
          message: newItem.placeholder || defaultPlaceholder(newItem),
          validator: defaultRequiredValidator(newItem) || undefined,
        }]
      : []
  }
  else if (newItem.required && !hasRequiredRule(newItem.rules)) {
    newItem.rules.unshift({
      required: true,
      message: newItem.placeholder || defaultPlaceholder(newItem),
    })
  }

  if (newItem.extendRules?.length) newItem.rules = [...(newItem.rules || []), ...newItem.extendRules]

  if (newItem.customValidators?.length) newItem.rules = [...(newItem.rules || []), ...modelRules(...newItem.customValidators)]

  if (newItem.validationType) {
    const validationRules = resolveValidationType(newItem.validationType).filter(
      rule => !(rule.required && hasRequiredRule(newItem.rules || [])),
    )
    newItem.rules = [...(newItem.rules || []), ...validationRules]
  }

  return newItem
}

function processFormConfig(config: FormConfigItem[], options: ProcessFormConfigOptions = {}) {
  return config.map(item => processFormItem(item, options))
}

function isLoopFieldConfig(value: unknown): value is LoopFieldConfig {
  if (!value || typeof value !== 'object') return false
  const entry = value as LoopFieldConfig & FormConfigItem
  if (entry.compType && entry.compType !== 'loop') return false
  return 'arrayPath' in entry && 'fields' in entry
    && (Array.isArray(entry.fields) || typeof entry.fields === 'function')
}

function configToRules(
  config: FormConfigItem[] | FormConfigItem,
  options: ProcessFormConfigOptions = {},
): V1FormRules {
  const list = Array.isArray(config) ? config : [config]
  const rules: V1FormRules = {}
  for (const item of processFormConfig(list, options)) {
    if (!item.prop || item.hidden || item.compType?.startsWith('slot')) continue
    if (item.rules?.length) rules[item.prop] = item.rules
  }
  return rules
}

function isFormConfigItem(value: unknown): value is FormConfigItem {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && ('prop' in value || 'compType' in value || 'label' in value || 'title' in value)
}

function isFormConfigSource(value: unknown): value is FormConfigSource {
  if (typeof value === 'function') return true
  if (isFormConfigItem(value)) return true
  if (Array.isArray(value)) return value.length === 0 || isFormConfigItem(value[0])
  if (value && typeof value === 'object' && 'value' in value) return true
  return false
}

function isV1FormRules(value: unknown): value is V1FormRules {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (isLoopFieldConfig(value) || isFormConfigItem(value)) return false
  if ('extraRules' in value || 'loops' in value || 'options' in value || 'formValidators' in value) return false
  return Object.values(value).every(item => Array.isArray(item))
}

function isFormRulesBuildOptions(value: unknown): value is FormRulesBuildOptions {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && ('extraRules' in value || 'loops' in value || 'options' in value || 'formValidators' in value)
    && !isFormConfigItem(value)
}

function createLoopFieldContext(
  model: Record<string, any>,
  arrayPath: string,
  index: number,
): LoopFieldContext | null {
  const list = getValueByPath(model, arrayPath)
  if (!Array.isArray(list) || !list[index]) return null
  return { item: list[index], index, model }
}

function resolveLoopFields(config: LoopFieldConfig, ctx: LoopFieldContext): FormConfigItem[] {
  const rawFields = typeof config.fields === 'function' ? config.fields(ctx) : config.fields
  if (!rawFields) return []
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
      if (part.extraRules) extraRules = part.extraRules
      if (part.loops) loops.push(...(Array.isArray(part.loops) ? part.loops : [part.loops]))
      if (part.formValidators) formValidators.push(...(Array.isArray(part.formValidators) ? part.formValidators : [part.formValidators]))
      if (part.options) options = { ...options, ...part.options }
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
  const issues: { path: Array<string | number>; message: string }[] = []
  for (const validator of validators) {
    for (const issue of normalizeFormValidatorResult(validator(model))) {
      if (!issue.path) continue
      issues.push({ path: issue.path.split('.'), message: issue.message })
    }
  }
  return issues
}

function resolveExtraRules(
  extraRules: FormRulesBuildOptions['extraRules'],
  model: Record<string, any>,
): V1FormRules {
  if (!extraRules) return {}
  if (typeof extraRules === 'function') return extraRules(model) || {}
  return { ...unref(extraRules) }
}

function isLoopFieldRequired(loop: LoopFieldConfig, path: string, model: Record<string, any>) {
  const prefix = `${loop.arrayPath}.`
  if (!path.startsWith(prefix)) return false
  const segments = path.slice(prefix.length).split('.')
  const index = Number.parseInt(segments[0], 10)
  if (Number.isNaN(index)) return false
  const fieldProp = segments.slice(1).join('.')
  if (!fieldProp) return false

  const ctx = createLoopFieldContext(model, loop.arrayPath, index)
  if (!ctx) return false
  if (loop.itemVisible && !loop.itemVisible(ctx)) return false

  return !!resolveLoopFields(loop, ctx).find(item => item.prop === fieldProp)?.required
}

function configsToRules(...args: [ProcessFormConfigOptions | FormConfigSource, ...(FormConfigSource[])]): V1FormRules {
  let options: ProcessFormConfigOptions = {}
  let sources: FormConfigSource[] = args as FormConfigSource[]

  if (args.length > 0 && !isFormConfigSource(args[0]) && typeof args[0] === 'object' && !Array.isArray(args[0]) && typeof args[0] !== 'function') {
    options = args[0] as ProcessFormConfigOptions
    sources = args.slice(1) as FormConfigSource[]
  }

  return sources.reduce<V1FormRules>((merged, source) => {
    const raw = typeof source === 'function' ? source() : unref(source)
    const list = Array.isArray(raw) ? raw : [raw]
    return { ...merged, ...configToRules(list, options) }
  }, {})
}

function buildFormRulesFromParsed(
  parsed: ReturnType<typeof parseSchemaParts>,
  model: Record<string, any>,
): V1FormRules {
  let rules = parsed.configs.length ? configsToRules(parsed.options || {}, ...parsed.configs) : {}
  rules = { ...rules, ...resolveExtraRules(parsed.extraRules, model) }
  for (const loop of parsed.loops) rules = { ...rules, ...loopFieldToRules(loop, model) }
  return rules
}

function loopFieldToRules(config: LoopFieldConfig, model: Record<string, any>): V1FormRules {
  const rules: V1FormRules = {}
  const list = getValueByPath(model, config.arrayPath)
  if (!Array.isArray(list) || list.length === 0) return rules

  for (let index = 0; index < list.length; index++) {
    const ctx = createLoopFieldContext(model, config.arrayPath, index)
    if (!ctx) continue
    if (config.itemVisible && !config.itemVisible(ctx)) continue

    const basePath = `${config.arrayPath}.${index}.`
    const itemRules = configToRules(resolveLoopFields(config, ctx), { ...config.options, basePath })
    for (const [prop, fieldRules] of Object.entries(itemRules)) {
      rules[prop] = fieldRules.map(rule => ({
        ...rule,
        message: rule.message && config.itemPrefix
          ? `${config.itemPrefix(ctx)}：${rule.message}`
          : rule.message,
      }))
    }
  }
  return rules
}
