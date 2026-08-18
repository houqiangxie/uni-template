# ComTree 树形选择



树形单选/多选组件，支持弹层选择、内嵌面板、搜索、远程数据、懒加载与自定义项。



## 主要属性



| 属性 | 说明 | 默认值 |

|------|------|--------|

| `options` | 树形数据源 | `[]` |

| `multiple` | 多选 | `false` |

| `leafOnly` | 仅允许选择叶子节点 | `false` |

| `checkStrictly` | 多选时父子不关联 | `false` |

| `showSearch` | 弹层/面板内搜索 | `false` |

| `searchMode` | 搜索模式：`flat` 仅叶子 / `tree` 保留层级 | `'flat'` |

| `remote` | 远程搜索 | `false` |

| `remoteUrl` | 远程搜索接口（与 ComSelect 一致） | - |

| `customFunc` | 自定义远程搜索函数（返回树数据） | - |

| `searchFunc` | 远程搜索回调，等同 `@search`；返回树数组时组件内直接渲染 | - |

| `searchKey` | 搜索参数字段名 | `'keyword'` |

| `params` | 附加请求参数 | - |

| `token` | 请求 token | - |

| `emptySearch` | 关键词为空时是否请求 | `true` |

| `lazy` | 懒加载子节点 | `false` |

| `load` | 懒加载函数，等同 `@load` | - |

| `loadFunc` | 懒加载函数（`load` 别名，便于 form config 传参） | - |

| `isLeafKey` | 节点是否为叶子的字段名 | `'isLeaf'` |

| `loading` | 外部 loading（仅 `@search` 事件模式） | `false` |

| `showFullPath` | 展示完整路径 | `false` |

| `pathSeparator` | 路径分隔符 | `'-'` |

| `showField` | 展示触发器输入框 | `true` |

| `popup` | 弹层选择 | `true` |

| `allowCreate` | 搜索无匹配时允许创建 | `false` |

| `showTags` | 多选标签展示 | `false` |

| `embedded` | 嵌入筛选栏样式 | `false` |

| `title` | 弹层标题（默认同 i18n） | - |

| `placeholder` | 触发器占位 | i18n |

| `searchPlaceholder` | 搜索框占位 | i18n |

| `emptyText` | 无数据文案 | i18n |



## 远程搜索

与 ComSelect 对齐，支持 `remoteUrl` / `customFunc` 内置请求，也支持 `@search` 事件由父组件自行请求。

### 内置远程（推荐）

```vue
<com-tree
  v-model="deptId"
  remote
  remote-url="/api/dept/tree"
  show-search
  :params="{ status: 1 }"
/>
```

或使用自定义函数：

```vue
<com-tree
  v-model="deptId"
  remote
  :custom-func="fetchDeptTree"
  show-search
/>
```

```ts
async function fetchDeptTree(keyword: string) {
  const { data } = await post('/api/dept/tree', { keyword })
  return data.records ?? data
}
```

接口返回格式支持 `data.records`、`data`（数组）或 `data.list`。组件内部管理 loading，并使用与 ComSelect 相同的请求去重/合并策略。

弹层打开或搜索时会自动请求；`emptySearch: false` 时仅在有搜索词时请求。已选值不在树中时，会通过 `ids` 参数补拉节点以展示文案。

### 事件模式（兼容）

### 属性回调（com-form 等场景）

循环渲染无法写 `@search` / `@load` 时，用 `searchFunc`、`load` / `loadFunc` 传函数即可：

```vue
<com-tree
  v-model="deptId"
  remote
  lazy
  :options="treeData"
  :loading="loading"
  show-search
  :search-func="fetchTree"
  :load-func="loadChildren"
/>
```

`searchFunc` 无返回值时由外部更新 `options`；返回 `TreeNodeModel[]` 时与 `customFunc` 一样在组件内渲染。

未配置 `remoteUrl` / `customFunc` 时，仍可通过 `@search` 由父组件拉数：

```vue
<com-tree
  v-model="deptId"
  :options="treeData"
  remote
  :loading="loading"
  show-search
  @search="fetchTree"
/>
```

父组件在 `@search` 中请求数据并更新 `options`，请求期间传 `loading`。



## 懒加载



开启 `lazy` 后，节点通过 `isLeaf: true` 标记叶子；未加载子节点的非叶子节点在展开时触发 `load`。



```vue
<com-tree

  v-model="deptId"

  lazy

  :options="rootNodes"

  leaf-only

  @load="handleLoad"
/>
```



```ts
const rootNodes = [

  { id: '1', name: '总公司', isLeaf: false },

  { id: '2', name: '分公司', isLeaf: true },

]

function handleLoad(node: TreeNodeModel | null, resolve: (children: TreeNodeModel[]) => void) {

  if (node === null) {

    // 根节点远程加载（options 为空时）

    fetchRoot().then(resolve)

    return

  }

  fetchChildren(node.id).then(resolve)

}
```



也可使用 `load` / `loadFunc` 属性传入加载函数；`node === null` 表示加载根级数据。



## 远程 + 懒加载



根数据通过 `remote` + `searchFunc`（或 `@search`）拉取，子节点通过 `lazy` + `loadFunc`（或 `@load`）按需展开：



```vue
<com-tree

  v-model="deptId"

  lazy

  remote

  :options="treeData"

  :loading="loading"

  show-search

  :search-func="fetchTree"

  :load-func="loadChildren"
/>
```



## 基础用法



```vue
<com-tree v-model="deptId" :options="treeData" />
```



## 树形搜索



```vue
<com-tree

  v-model="deptId"

  :options="treeData"

  show-search

  search-mode="tree"
/>
```



## 在 com-form 中使用



```ts

{

  prop: 'deptId',

  label: '部门',

  compType: 'tree',

  options: treeData,

  leafOnly: true,

}

```



远程 / 懒加载示例（函数写在 config 里，无需模板事件）：



```ts

{

  prop: 'deptId',

  label: '部门',

  compType: 'tree',

  remote: true,

  lazy: true,

  showSearch: true,

  options: treeData,

  loading,

  searchFunc: fetchTree,

  loadFunc: loadChildren,

}

```



## 事件



| 事件 | 说明 |

|------|------|

| `update:modelValue` | v-model 更新 |

| `change` | 选中变更，参数 `(node, label)` |

| `cancel` | 弹层关闭未确认 |

| `search` | 远程搜索，参数 `keyword`（可用 `searchFunc` 属性替代） |

| `load` | 懒加载，参数 `(node, resolve)`（可用 `load` / `loadFunc` 属性替代） |



## 暴露方法



| 方法 | 说明 |

|------|------|

| `open()` | 打开弹层 |



## 实现说明



- 选中值比较使用 `isSameTreeValue`，避免多选数组引用不一致重复触发。

- 弹层打开期间外部 `modelValue` 变更仅更新触发器文案，不重置弹层内勾选态。

- `options` 引用未变时不重复深拷贝，减少大树性能开销。

- 扁平搜索（`searchMode="flat"`）预计算叶子节点列表，搜索时只扫描叶子，并缓存同关键词结果；懒加载模式下未展开分支不参与扁平搜索，需配合 `remote` 搜索。

- 勾选态使用 `TreeCheckStatus` 常量（未选 / 半选 / 全选）。

- 懒加载展开时在节点旁展示 loading 动画，加载完成后自动展开子级。

