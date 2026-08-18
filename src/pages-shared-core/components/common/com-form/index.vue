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
        :class="resolveItemContext(row.item, row.fieldIndex).vertical ? ' mb-3 vertical-box' : ''"
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
              :border="resolveItemContext(row.item, row.fieldIndex).vertical"
              v-bind="pickChildProps(row.item, row.fieldIndex)"
              @change="row.item.change"
            />
          </view>
          <wd-radio-group
            v-else-if="row.item.compType === 'radio'"
            v-model="getModel(row)[row.item.key]"
            direction="horizontal"
            custom-class="flex flex-wrap items-center justify-end gap-2 w-full"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
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
            custom-class="flex flex-wrap items-center justify-end gap-2 w-full"
            v-bind="pickChildProps(row.item, row.fieldIndex)"
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

const LINK_COMP_TYPES = ['select', 'tree', 'picker-date', 'date']

const INHERIT_KEYS = ['disabled', 'vertical', 'border']

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
  ...INHERIT_KEYS,
])

const groupClass = computed(() => {
  const classes = ['com-form']
  if (props.embedded)
    return [...classes, 'pb-2 rounded-lg overflow-hidden'].join(' ')
  return [...classes, props.vertical ? 'vertical' : '', 'm-3 rounded-lg overflow-hidden'].filter(Boolean).join(' ')
})

const renderRows = computed(() => {
  return buildFormRenderRows(props.config, props.form, {
    basePath: props.basePath,
    disabled: props.disabled,
  })
})

function resolveInheritProp(item, key) {
  if (item[key] !== undefined)
    return !!item[key]
  return props[key]
}

function resolveItemContext(formItem, index) {
  const disabled = resolveInheritProp(formItem, 'disabled')
  const vertical = resolveInheritProp(formItem, 'vertical')
  const border = resolveInheritProp(formItem, 'border')

  let isLink = false
  if (formItem.isLink !== undefined)
    isLink = !!formItem.isLink
  else if (LINK_COMP_TYPES.includes(formItem.compType))
    isLink = !vertical && !disabled

  const itemBorder = formItem.border !== undefined
    ? !!formItem.border
    : border && !vertical && index > 0

  return { disabled, vertical, border, isLink, itemBorder }
}

function pickChildProps(formItem, index) {
  const resolved = resolveItemContext(formItem, index)
  const childProps = { disabled: resolved.disabled }

  for (const [key, value] of Object.entries(formItem)) {
    if (value === undefined || FORM_ITEM_META_KEYS.has(key))
      continue
    childProps[key] = value
  }

  return childProps
}

function getFormItemAttrs(formItem, index) {
  const resolved = resolveItemContext(formItem, index)
  const attrs = {
    title: formItem.hiddenLabel ? '' : formItem.label,
    prop: formItem.prop,
    border: resolved.itemBorder,
    titleWidth: formItem.titleWidth ?? props.titleWidth,
  }
  if (resolved.isLink)
    attrs.isLink = true
  return attrs
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
}
</style>
