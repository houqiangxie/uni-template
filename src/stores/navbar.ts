import pagesjson from "@/pages.json";
import i18n from '@/locale'
import { routeTitleMap } from '@/locale/route-map'
import { appTitle, enableI18n } from '@/utils/config'
// const hiddenBackButtonList = [
//     'pages/index',
//     'pages-sub/pages/index',
//     '/pages/login/index'
// ]
export const getCurrentRoute = () => {
    const pages = getCurrentPages();
    if (!pages.length) return '';
    // 获取当前页面对象
    const currentPage = pages[pages.length - 1];
    return currentPage.route; // 获取当前页面的路径
}
export const useNavbarStore = defineStore('navbar', () => {
    const title = ref('')
    const showLeftButton = ref(true)
    const config = ref({})
    const hideNavbar = ref(false)
    // 更新菜单信息
    const setPageConfig = () => {
        let t=''
        const currentRoute = getCurrentRoute()
            // 在 pages.json 的 pages 和 subPackages 里查找
            if (pagesjson.pages) {
                pagesjson.pages.forEach(page => {
                    if (page.path === currentRoute) {
                        t = page.style?.navigationBarTitleText || '';
                        config.value = page
                    }
                });
            }
            if (!t && pagesjson.subPackages) {
                pagesjson.subPackages.forEach(pkg => {
                    pkg.pages.forEach(page => {
                        if (`${pkg.root}/${page.path}` === currentRoute) {
                            t = page.style?.navigationBarTitleText || '';
                            config.value = page
                        }
                    });
                });
            }
        hideNavbar.value = config.value?.style?.hideNavbar ?? false
        showLeftButton.value = config.value?.style?.showLeftButton ?? true
        // 翻译导航栏标题（未启用多语言时使用 pages.json 中的静态标题）
        let translatedTitle = t || appTitle
        if (enableI18n) {
            const titleKey = routeTitleMap[currentRoute]
            translatedTitle = titleKey ? i18n.global.t(titleKey) : (t || i18n.global.t('route.appName'))
        }
        title.value = translatedTitle
        if (translatedTitle && !hideNavbar.value)
            setNavigationBarTitle(translatedTitle)
        // if (currentRoute && hiddenBackButtonList.includes(currentRoute)) showLeftButton.value = false
    }

    const setTitle = (t: string) => {
        setNavigationBarTitle(t)
        title.value = t
        if (config.value) {
            if(!config.value.style) config.value.style = {}
            config.value.style.navigationBarTitleText = t
        }
    }
    
    return { title, showLeftButton, config, setPageConfig, setTitle, hideNavbar }
})