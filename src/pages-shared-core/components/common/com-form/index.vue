<template>
  <wd-cell-group :border="border" title="" :custom-class="groupClass">
    <slot name="pre-slot" />
    <template v-for="row in renderRows" :key="row.key">
      <view
        v-if="row.kind === 'loop-header'"
        class="flex items-center justify-between px-3 py-2 bg-gray-50"
      >
        <slot
          name="loop-head"
          :loop-index="row.loopIndex"
          :item="row.arrayItem"
          :config="row.loopConfig"
          :context="row.loopContext"
          :title="row.title"
        >
          <text>{{ row.title }}</text>
        </slot>
      </view>
      <view v-else>
        <wd-form-item v-bind="row.formItemAttrs">
          <wd-input
            v-if="row.item.compType === 'input'"
            v-model="getModel(row)[row.item.key]"
            :bordered="row.item.bordered"
            :placeholder="row.item.placeholder"
            :readonly="row.item.readonly"
            :suffix-icon="row.item.suffixIcon"
            :maxlength="row.item.maxlength"
            :type="row.item.inputType || 'text'"
            v-bind="row.childProps"
            :align-right="row.ctx.valueAlign === 'right'"
            @input="row.item.change"
            @focus="row.item.onFocus"
          />
          <wd-textarea
            v-else-if="row.item.compType === 'textarea'"
            v-model="getModel(row)[row.item.key]"
            auto-height
            :bordered="row.item.bordered"
            :placeholder="row.item.placeholder"
            v-bind="row.childProps"
            @input="row.item.change"
          />
          <wd-datetime-picker
            v-else-if="row.item.compType === 'picker-date'"
            v-model="getModel(row)[row.item.key]"
            custom-value-class="picker-date"
            root-portal
            v-bind="row.childProps"
            @confirm="row.item.change"
          />
          <ComUpload
            v-else-if="row.item.compType === 'upload'"
            v-model="getModel(row)[row.item.key]"
            v-bind="row.childProps"
            @change="row.item.change"
          />
          <ComChunkUpload
            v-else-if="row.item.compType === 'chunk-upload'"
            v-model="getModel(row)[row.item.key]"
            v-bind="row.childProps"
            @change="row.item.change"
          />
          <Sign
            v-else-if="row.item.compType === 'sign'"
            v-model="getModel(row)[row.item.key]"
            v-bind="row.childProps"
            @change="row.item.change"
          />
          <ComSelect
            v-else-if="row.item.compType === 'select'"
            v-model="getModel(row)[row.item.key]"
            :show-arrow="row.item.showArrow ?? false"
            v-bind="row.childProps"
            @change="row.item.change"
          />
          <ComTree
            v-else-if="row.item.compType === 'tree'"
            v-model="getModel(row)[row.item.key]"
            :show-arrow="row.item.showArrow ?? false"
            v-bind="row.childProps"
            @change="row.item.change"
          />
          <view v-else-if="row.item.compType === 'date'" class="flex items-center w-full">
            <uni-datetime-picker
              v-model="getModel(row)[row.item.key]"
              type="date"
              :clear-icon="false"
              :border="false"
              v-bind="row.childProps"
              @change="row.item.change"
            />
          </view>
          <wd-radio-group
            v-else-if="row.item.compType === 'radio'"
            v-model="getModel(row)[row.item.key]"
            direction="horizontal"
            v-bind="row.childProps"
            custom-class="com-form__control-group"
            @change="row.item.change"
          >
            <wd-radio
              v-for="column in row.item.columns"
              :key="column.value"
              :value="column.value"
              type="dot"
              placement="left"
              custom-class="!mr-0"
            >
              {{ column.text }}
            </wd-radio>
          </wd-radio-group>
          <wd-checkbox-group
            v-else-if="row.item.compType === 'checkbox'"
            v-model="getModel(row)[row.item.key]"
            v-bind="row.childProps"
            custom-class="com-form__control-group"
            @change="row.item.change"
          >
            <wd-checkbox
              v-for="column in row.item.columns"
              :key="column.value"
              :name="column.value"
              type="square"
              placement="left"
              custom-class="!mr-0"
            >
              {{ column.text }}
            </wd-checkbox>
          </wd-checkbox-group>
          <wd-input-number
            v-else-if="row.item.compType === 'number'"
            v-model="getModel(row)[row.item.key]"
            v-bind="row.childProps"
            @change="row.item.change"
          />
          <wd-switch
            v-else-if="row.item.compType === 'switch'"
            v-model="getModel(row)[row.item.key]"
            v-bind="row.childProps"
            @change="row.item.change"
          />
          <slot v-else-if="row.item.compType === 'slot1'" name="slot1" :item="row.item" />
          <slot v-else-if="row.item.compType === 'slot2'" name="slot2" :item="row.item" />
          <slot v-else-if="row.item.compType === 'slot3'" name="slot3" :item="row.item" />
          <slot v-else-if="row.item.compType === 'slot4'" name="slot4" :item="row.item" />
          <slot v-else-if="row.item.compType === 'slot5'" name="slot5" :item="row.item" />
        </wd-form-item>
      </view>
    </template>
    <slot name="suf-slot" />
  </wd-cell-group>
</template>

<script setup>
import { FORM_KEY } from '@wot-ui/ui/components/wd-form/types'
import { buildFormRenderRows } from './formRender'

defineOptions({ inheritAttrs: false })

/**
 * com-form 自身属性；layout / valueAlign 等可走 attrs，用于同一 wd-form 下多块 com-form 差异化。
 * valueAlign 默认 left：未设置时不继承 Form，避免多块被 Form 统一盖掉。
 */
const props = defineProps({
  config: {
    type: Array,
    default: () => [],
  },
  form: {
    type: Object,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  basePath: {
    type: String,
    default: '',
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  border: {
    type: Boolean,
    default: true,
  },
  titleWidth: {
    type: [String, Number],
    default: 'auto',
  },
})

const attrs = useAttrs()
const formProvide = inject(FORM_KEY, null)

const LINK_COMP_TYPES = ['select', 'tree', 'picker-date', 'date']

/** 不透传给子控件的表单项元数据 */
const FORM_ITEM_META_KEYS = new Set([
  'prop',
  'label',
  'title',
  'titleWidth',
  'compType',
  'required',
  'hidden',
  'hiddenLabel',
  'rules',
  'extendRules',
  'customValidators',
  'validationType',
  'validationMessage',
  'key',
  'uuid',
  'change',
  'onFocus',
  'isLink',
  'disabled',
  'vertical',
  'border',
  'center',
  'size',
  'layout',
  'valueAlign',
  'asteriskPosition',
  'hideAsterisk',
  'ellipsis',
  'validateTrigger',
  'clickable',
  'prefixIcon',
  'iconSize',
  'iconPrefix',
  'cssIcon',
  'alignRight',
  'columns',
])

/** 仅在 item / com-form attrs 有值时传给 form-item（其余交给 form-item 继承 Form） */
const FORM_ITEM_OVERRIDE_KEYS = [
  'center',
  'size',
  'asteriskPosition',
  'hideAsterisk',
  'ellipsis',
  'validateTrigger',
  'clickable',
  'placeholder',
  'value',
  'prefixIcon',
  'iconSize',
  'iconPrefix',
  'cssIcon',
]

const groupClass = computed(() => {
  const classes = ['com-form']
  const isVertical = props.vertical || resolveAttr('layout') === 'vertical'
  if (props.embedded)
    return [...classes, 'pb-2 rounded-lg overflow-hidden'].join(' ')
  return [...classes, isVertical ? 'vertical' : '', 'm-3 rounded-lg overflow-hidden'].filter(Boolean).join(' ')
})

const renderRows = computed(() => {
  const rows = buildFormRenderRows(props.config, props.form, {
    basePath: props.basePath,
    disabled: props.disabled,
  })

  return rows.map((row) => {
    if (row.kind !== 'field')
      return row

    const ctx = resolveItemContext(row.item, row.fieldIndex)
    return {
      ...row,
      ctx,
      formItemAttrs: getFormItemAttrs(row.item, ctx),
      childProps: pickChildProps(row.item, ctx),
    }
  })
})

function toKebabCase(key) {
  return key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
}

function toCamelCase(key) {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/** 未声明的布尔属性在 attrs 里是空字符串，按 true 处理 */
function normalizeAttrValue(value) {
  return value === '' ? true : value
}

function resolveAttr(key) {
  const camel = toCamelCase(key)
  const kebab = toKebabCase(camel)
  const raw = attrs[camel] ?? attrs[kebab]
  return raw === undefined ? undefined : normalizeAttrValue(raw)
}

function getItemProp(item, key) {
  if (item?.[key] !== undefined)
    return item[key]
  const kebab = toKebabCase(key)
  if (kebab !== key && item?.[kebab] !== undefined)
    return item[kebab]
  return undefined
}

/** item > com-form(props/attrs)；不读 Form，便于多块 com-form 差异化 */
function resolveComFormProp(item, key) {
  const fromItem = getItemProp(item, key)
  if (fromItem !== undefined)
    return fromItem
  if (key === 'disabled') {
    // props.disabled 默认 false，不能挡住 Form 禁用；仅 true 时视为 com-form 强制禁用
    if (props.disabled)
      return true
    return undefined
  }
  if (Object.prototype.hasOwnProperty.call(props, key) && props[key] !== undefined)
    return props[key]
  return resolveAttr(key)
}

function resolveBooleanComForm(item, key, fallback = false) {
  const value = resolveComFormProp(item, key)
  return value === undefined ? fallback : !!value
}

function resolveLayout(item) {
  const layout = resolveComFormProp(item, 'layout')
  if (layout !== undefined)
    return layout
  return resolveBooleanComForm(item, 'vertical') ? 'vertical' : undefined
}

/** 业务组件有效禁用：item > com-form > Form（原生 wd-* 走 useFormDisabled） */
function resolveEffectiveDisabled(formItem) {
  const fromItem = getItemProp(formItem, 'disabled')
  if (fromItem !== undefined)
    return !!fromItem
  if (props.disabled)
    return true
  return Boolean(formProvide?.props?.disabled)
}

function resolveItemContext(formItem, index) {
  const formItemDisabled = resolveComFormProp(formItem, 'disabled')
  const disabled = resolveEffectiveDisabled(formItem)
  const layout = resolveLayout(formItem)
  const vertical = layout === 'vertical' || resolveBooleanComForm(formItem, 'vertical')
  const border = resolveBooleanComForm(formItem, 'border', props.border)
  // 默认 left：保证未配置时各 com-form 一致，且不被 Form 的 value-align 统一覆盖
  const valueAlign = resolveComFormProp(formItem, 'valueAlign') || 'left'

  let isLink = false
  if (formItem.isLink !== undefined)
    isLink = !!formItem.isLink
  else if (LINK_COMP_TYPES.includes(formItem.compType))
    isLink = !vertical && !disabled

  const itemBorder = getItemProp(formItem, 'border') !== undefined
    ? !!getItemProp(formItem, 'border')
    : border && index > 0

  return {
    disabled,
    formItemDisabled,
    vertical,
    layout,
    border,
    valueAlign,
    isLink,
    itemBorder,
  }
}

function pickChildProps(formItem, resolved) {
  // 业务组件需要完整禁用态；原生 wd-* 即使多传 disabled 也不影响 Form 继承（falsy 会继续往下看）
  const childProps = { disabled: resolved.disabled }

  for (const [key, value] of Object.entries(formItem)) {
    if (value === undefined || FORM_ITEM_META_KEYS.has(key) || key.includes('-'))
      continue
    childProps[key] = value
  }

  return childProps
}

function assignIfDefined(target, key, value) {
  if (value !== undefined)
    target[key] = value
}

/**
 * 只传 item / com-form 覆盖项 + 本组件策略字段。
 * center/size/... 未设置时不传，交给 wd-form-item 继承 Form。
 * disabled 仅在 item/com-form 显式禁用时传入，避免默认 false 盖住 Form.disabled。
 */
function getFormItemAttrs(formItem, resolved) {
  const itemAttrs = {
    title: formItem.hiddenLabel ? '' : (formItem.title ?? formItem.label),
    prop: formItem.prop,
    border: resolved.itemBorder,
    titleWidth: getItemProp(formItem, 'titleWidth') ?? props.titleWidth,
    valueAlign: resolved.valueAlign,
  }

  assignIfDefined(itemAttrs, 'disabled', resolved.formItemDisabled)

  if (resolved.layout)
    itemAttrs.layout = resolved.layout
  if (resolved.isLink)
    itemAttrs.isLink = true

  assignIfDefined(itemAttrs, 'required', getItemProp(formItem, 'required'))

  for (const key of FORM_ITEM_OVERRIDE_KEYS) {
    const fromItem = getItemProp(formItem, key)
    if (fromItem !== undefined) {
      itemAttrs[key] = fromItem
      continue
    }
    const fromAttr = resolveAttr(key)
    if (fromAttr !== undefined)
      itemAttrs[key] = fromAttr
  }

  // switch 默认垂直居中，更贴官方示例
  if (formItem.compType === 'switch' && itemAttrs.center === undefined)
    itemAttrs.center = true

  return itemAttrs
}

function getModel(row) {
  return row.arrayItem ?? props.form
}
</script>

<style lang="scss" scoped>
.com-form {
  :deep(.wd-cell__left) {
    width: auto !important;
    flex: none !important;
    max-width: none !important;
    min-width: auto !important;
  }

  :deep(.wd-cell__title) {
    white-space: normal;
    word-break: break-word;
  }

  :deep(.wd-cell__right) {
    flex: 1;
    min-width: 0;
  }

  :deep(.com-form__control-group) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  :deep(.wd-cell__value--left .com-form__control-group) {
    justify-content: flex-start;
  }

  :deep(.wd-cell__value--right) {
    .com-form__control-group {
      justify-content: flex-end;
    }

    // input 已用 align-right；这里补业务控件与 textarea / date
    .wd-textarea__inner,
    .uni-input-input,
    .uni-textarea-textarea,
    .uni-input-placeholder,
    .uni-textarea-placeholder,
    .wd-picker__value,
    .com-select,
    .com-tree {
      text-align: right !important;
    }

    .wd-upload {
      justify-content: flex-end;
    }
  }

  :deep(.wd-cell__value--center) {
    .com-form__control-group {
      justify-content: center;
    }

    .wd-input__inner,
    .wd-textarea__inner,
    .uni-input-input,
    .uni-textarea-textarea,
    .uni-input-placeholder,
    .uni-textarea-placeholder {
      text-align: center !important;
    }
  }
}
</style>
