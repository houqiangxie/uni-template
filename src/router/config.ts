import type { RouteConfig } from '@meng-xi/uni-router'

/**
 * 路由配置列表
 * @description 由 pages.json 自动生成
 */
export const routes: RouteConfig[] = [
	{
		path: '/pages/index',
		name: 'pagesIndex',
		meta: { title: '首页' }
	},
	{
		path: '/pages/login/index',
		name: 'pagesLoginIndex'
	},
	{
		path: '/pages-shared-core/pages/placeholder',
		name: 'pagesSharedCorePagesPlaceholder'
	},
	{
		path: '/pages-shared-heavy/pages/placeholder',
		name: 'pagesSharedHeavyPagesPlaceholder'
	},
	{
		path: '/pages-test/pages/chart-demo/index',
		name: 'pagesTestPagesChartDemoIndex',
		meta: { title: '图表示例' }
	},
	{
		path: '/pages-test/pages/chunk-upload-demo/index',
		name: 'pagesTestPagesChunkUploadDemoIndex',
		meta: { title: '大文件上传' }
	},
	{
		path: '/pages-test/pages/com-select-demo/index',
		name: 'pagesTestPagesComSelectDemoIndex',
		meta: { title: 'ComSelect 本地分页' }
	},
	{
		path: '/pages-test/pages/da-dropdown-demo/index',
		name: 'pagesTestPagesDaDropdownDemoIndex',
		meta: { title: 'Dropdown 示例' }
	},
	{
		path: '/pages-test/pages/form-demo/index',
		name: 'pagesTestPagesFormDemoIndex',
		meta: { title: '表单示例' }
	},
	{
		path: '/pages-test/pages/scan-demo/index',
		name: 'pagesTestPagesScanDemoIndex',
		meta: { title: '扫码示例' }
	},
	{
		path: '/pages-test/pages/upload-center-demo/index',
		name: 'pagesTestPagesUploadCenterDemoIndex',
		meta: { title: '上传中心' }
	}
]

export default routes
