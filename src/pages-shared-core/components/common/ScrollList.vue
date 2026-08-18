<template>
  <scroll-view
    scroll-y
    :style="customStyle"
    :class="customClass"
    @scrolltolower="handleScrolltolower"
  >
    <template v-if="list?.length">
      <template v-if="paginate">
        <wd-card v-for="(item, index) in list" :key="item[rowKey] || index" custom-class="!p-3">
          <slot :item="item" :index="index" />
        </wd-card>
      </template>
      <slot v-else />
    </template>
    <empty v-else />
  </scroll-view>
</template>

<script setup>
defineOptions({
  inheritAttrs: false,
  options: {
    styleIsolation: 'shared',
    virtualHost: true,
  },
})

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  customStyle: {
    type: Object,
    default: () => ({}),
  },
  customClass: {
    type: String,
    default: '',
  },
  rowKey: {
    type: String,
    default: 'id',
  },
  paginate: {
    type: Boolean,
    default: true,
  },
})

const emits = defineEmits(['scrolltolower'])

function handleScrolltolower() {
  if (props.paginate)
    emits('scrolltolower')
}
</script>
