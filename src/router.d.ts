import '@meng-xi/uni-router'

declare module '@meng-xi/uni-router' {
  interface RouteNameMap {
    /** 首页 */
    pagesIndex: { path: '/pages/index'; meta: { title: string } }
    pagesLoginIndex: { path: '/pages/login/index'; meta: {} }
    pagesSharedCorePagesPlaceholder: { path: '/pages-shared-core/pages/placeholder'; meta: {} }
    pagesSharedHeavyPagesPlaceholder: { path: '/pages-shared-heavy/pages/placeholder'; meta: {} }
    /** 图表示例 */
    pagesTestPagesChartDemoIndex: { path: '/pages-test/pages/chart-demo/index'; meta: { title: string } }
    /** 大文件上传 */
    pagesTestPagesChunkUploadDemoIndex: { path: '/pages-test/pages/chunk-upload-demo/index'; meta: { title: string } }
    /** ComSelect 本地分页 */
    pagesTestPagesComSelectDemoIndex: { path: '/pages-test/pages/com-select-demo/index'; meta: { title: string } }
    /** Dropdown 示例 */
    pagesTestPagesDaDropdownDemoIndex: { path: '/pages-test/pages/da-dropdown-demo/index'; meta: { title: string } }
    /** 表单示例 */
    pagesTestPagesFormDemoIndex: { path: '/pages-test/pages/form-demo/index'; meta: { title: string } }
    /** 扫码示例 */
    pagesTestPagesScanDemoIndex: { path: '/pages-test/pages/scan-demo/index'; meta: { title: string } }
    /** 上传中心 */
    pagesTestPagesUploadCenterDemoIndex: { path: '/pages-test/pages/upload-center-demo/index'; meta: { title: string } }
  }
}