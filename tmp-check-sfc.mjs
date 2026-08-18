import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const sfc = require('@vue/compiler-sfc')
const pkg = require('@vue/compiler-sfc/package.json')
console.log('compiler-sfc', pkg.version)

const src = `
<script setup>
defineOptions({
  inheritAttrs: false,
  options: { virtualHost: true, styleIsolation: 'shared' },
})
const x = defineModel()
</script>
<template><view /></template>
`

const { descriptor } = sfc.parse(src)
const compiled = sfc.compileScript(descriptor, { id: 'x', inlineTemplate: false })
console.log('--- compiled script ---')
console.log(compiled.content)
console.log('--- has defineOptions call?', compiled.content.includes('defineOptions('))
console.log('--- has defineModel call?', compiled.content.includes('defineModel('))
console.log('--- inheritAttrs', compiled.content.includes('inheritAttrs'))
