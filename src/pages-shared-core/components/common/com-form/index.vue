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
      <view
        v-else
      >
        <wd-form-item v-bind="getFormItemAttrs(row.item, row.fieldIndex)">
          <wd-input
            v-if="row.item.compType === 'input'"
            v-model="getModel(row)[row.item.key]"
            :bordered="row.item.bordered"
            :disabled="resolveItemContext(row.item, row.fieldIndex).disabled"
            :placeholder="row.item.placeholder"
            :readonly="row.item.readonly"
            :suffix-icon="row.item.suffixIcon"
            :maxlength="row.item.maxlength"
            :type="row.item.inputType || 'text'"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            :align-right="resolveItemContext(row.item, row.fieldIndex).valueAlign === 'right'"
            @input="row.item.change"
            @focus="row.item.onFocus"
          />
          <wd-textarea
            v-else-if="row.item.compType === 'textarea'"
            v-model="getModel(row)[row.item.key]"
            auto-height
            :bordered="row.item.bordered"
            :disabled="resolveItemContext(row.item, row.fieldIndex).disabled"
            :placeholder="row.item.placeholder"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            @input="row.item.change"
          />
          <wd-datetime-picker
            v-else-if="row.item.compType === 'picker-date'"
            v-model="getModel(row)[row.item.key]"
            custom-value-class="picker-date"
            root-portal
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            @confirm="row.item.change"
          />
          <ComUpload
            v-else-if="row.item.compType === 'upload'"
            v-model="getModel(row)[row.item.key]"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            @change="row.item.change"
          />
          <ComChunkUpload
            v-else-if="row.item.compType === 'chunk-upload'"
            v-model="getModel(row)[row.item.key]"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            @change="row.item.change"
          />
          <Sign
            v-else-if="row.item.compType === 'sign'"
            v-model="getModel(row)[row.item.key]"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            @change="row.item.change"
          />
          <ComSelect
            v-else-if="row.item.compType === 'select'"
            v-model="getModel(row)[row.item.key]"
            :show-arrow="row.item.showArrow ?? false"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            @change="row.item.change"
          />
          <ComTree
            v-else-if="row.item.compType === 'tree'"
            v-model="getModel(row)[row.item.key]"
            :show-arrow="row.item.showArrow ?? false"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
            @change="row.item.change"
          />
          <view v-else-if="row.item.compType === 'date'" class="flex items-center w-full">
            <uni-datetime-picker
              v-model="getModel(row)[row.item.key]"
              type="date"
              :clear-icon="false"
              :border="false"
              v-bind="pickChildProps(row.item, row.fieldIndex)"
              @change="row.item.change"
            />
          </view>
          <wd-radio-group
            v-else-if="row.item.compType === 'radio'"
            v-model="getModel(row)[row.item.key]"
            direction="horizontal"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
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
            v-bind="pickChildProps(row.item, row.fieldIndex)"
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
            v-bind="pickChildProps(row.item, row.fieldIndex)"
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

defineOptions({ inheritAttrs: false })

/** 仅声明 com-form 自身属性；layout / valueAlign 等透传属性走 attrs */
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
  'alignRight',
])

const ATTR_SKIP_KEYS = new Set(['class', 'style', 'id'])

const groupClass = computed(() => {
  const classes = ['com-form']
  const isVertical = props.vertical || resolveAttr('layout') === 'vertical'
  if (props.embedded)
    return [...classes, 'pb-2 rounded-lg overflow-hidden'].join(' ')
  return [...classes, isVertical ? 'vertical' : '', 'm-3 rounded-lg overflow-hidden'].filter(Boolean).join(' ')
})

const renderRows = computed(() => {
  return buildFormRenderRows(props.config, props.form, {
    basePath: props.basePath,
    disabled: props.disabled,
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

/** item > com-form(attrs/props) > wd-form */
function resolveInheritProp(item, key) {
  const fromItem = getItemProp(item, key)
  if (fromItem !== undefined)
    return fromItem
  if (Object.prototype.hasOwnProperty.call(props, key) && props[key] !== undefined)
    return props[key]
  const fromAttr = resolveAttr(key)
  if (fromAttr !== undefined)
    return fromAttr
  return formProvide?.props?.[key]
}

function resolveBooleanInherit(item, key, fallback = false) {
  const value = resolveInheritProp(item, key)
  return value === undefined ? fallback : !!value
}

function resolveLayout(item) {
  const layout = resolveInheritProp(item, 'layout')
  if (layout !== undefined)
    return layout
  return resolveBooleanInherit(item, 'vertical') ? 'vertical' : undefined
}

function resolveItemContext(formItem, index) {
  const disabled = resolveBooleanInherit(formItem, 'disabled')
  const layout = resolveLayout(formItem)
  const vertical = layout === 'vertical' || resolveBooleanInherit(formItem, 'vertical')
  const border = resolveBooleanInherit(formItem, 'border', props.border)
  const valueAlign = resolveInheritProp(formItem, 'valueAlign') || 'left'

  let isLink = false
  if (formItem.isLink !== undefined)
    isLink = !!formItem.isLink
  else if (LINK_COMP_TYPES.includes(formItem.compType))
    isLink = !vertical && !disabled

  const itemBorder = getItemProp(formItem, 'border') !== undefined
    ? !!getItemProp(formItem, 'border')
    : border && index > 0

  return { disabled, vertical, layout, border, valueAlign, isLink, itemBorder }
}

function pickChildProps(formItem, index) {
  const resolved = resolveItemContext(formItem, index)
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

/** 把 com-form 上未声明的属性透传给 wd-form-item */
function pickPassthroughAttrs() {
  const result = {}
  for (const [key, value] of Object.entries(attrs)) {
    if (ATTR_SKIP_KEYS.has(key) || value === undefined)
      continue
    result[toCamelCase(key)] = normalizeAttrValue(value)
  }
  return result
}

function getFormItemAttrs(formItem, index) {
  const resolved = resolveItemContext(formItem, index)
  const itemAttrs = {
    ...pickPassthroughAttrs(),
    title: formItem.hiddenLabel ? '' : (formItem.title ?? formItem.label),
    prop: formItem.prop,
    border: resolved.itemBorder,
    titleWidth: getItemProp(formItem, 'titleWidth') ?? props.titleWidth,
  }

  if (resolved.isLink)
    itemAttrs.isLink = true

  assignIfDefined(itemAttrs, 'required', getItemProp(formItem, 'required'))
  assignIfDefined(itemAttrs, 'clickable', getItemProp(formItem, 'clickable'))
  assignIfDefined(itemAttrs, 'placeholder', getItemProp(formItem, 'placeholder'))
  assignIfDefined(itemAttrs, 'value', getItemProp(formItem, 'value'))
  assignIfDefined(itemAttrs, 'prefixIcon', getItemProp(formItem, 'prefixIcon'))
  assignIfDefined(itemAttrs, 'iconSize', getItemProp(formItem, 'iconSize'))
  assignIfDefined(itemAttrs, 'iconPrefix', getItemProp(formItem, 'iconPrefix'))

  // item > attrs > wd-form；未设置则不覆盖，交给 form-item 自身继承
  for (const key of Object.keys(itemAttrs)) {
    if (ATTR_SKIP_KEYS.has(key) || ['title', 'prop', 'border', 'titleWidth', 'isLink', 'required', 'clickable', 'placeholder', 'value', 'prefixIcon', 'iconSize', 'iconPrefix'].includes(key))
      continue
    const fromItem = getItemProp(formItem, key)
    if (fromItem !== undefined)
      itemAttrs[key] = fromItem
  }

  // inject 到的属性显式补齐（attrs 未写时也能驱动子控件）
  for (const key of ['center', 'size', 'layout', 'valueAlign', 'asteriskPosition', 'hideAsterisk', 'ellipsis', 'validateTrigger']) {
    if (itemAttrs[key] !== undefined)
      continue
    assignIfDefined(itemAttrs, key, resolveInheritProp(formItem, key))
  }

  if (itemAttrs.layout === undefined && resolved.layout)
    itemAttrs.layout = resolved.layout

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

  :deep(.wd-cell__value--left) {
    .com-form__control-group {
      justify-content: flex-start;
    }

    .wd-input__inner,
    .wd-textarea__inner,
    .uni-input-input,
    .uni-textarea-textarea,
    .uni-input-placeholder,
    .uni-textarea-placeholder {
      text-align: left !important;
    }
  }

  :deep(.wd-cell__value--right) {
    .com-form__control-group {
      justify-content: flex-end;
    }

    .wd-input__inner,
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
