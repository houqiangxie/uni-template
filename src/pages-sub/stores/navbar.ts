import pagesjson from "../../pages.json";
const hiddenBackButtonList = [
    'pages/index',
    'pages-sub/pages/index',
    'pages-sub/pages/login/index'
]
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
    // 更新菜单信息
    const setPageConfig = () => {
        const currentRoute = getCurrentRoute()
            // 在 pages.json 的 pages 和 subPackages 里查找
            if (pagesjson.pages) {
                pagesjson.pages.forEach(page => {
                    if (page.path === currentRoute) {
                        title.value = page.style?.navigationBarTitleText || '';
                        config.value = page
                    }
                });
            }
            if (!title.value && pagesjson.subPackages) {
                pagesjson.subPackages.forEach(pkg => {
                    pkg.pages.forEach(page => {
                        if (`${pkg.root}/${page.path}` === currentRoute) {
                            title.value = page.style?.navigationBarTitleText || '';
                            config.value = page
                        }
                    });
                });
            }
            showLeftButton.value=true
            if (hiddenBackButtonList.includes(currentRoute)) showLeftButton.value = false
    }

    const setTitle = (t: string) => {
        setNavigationBarTitle(title)
        title.value = t
    }
    return { title, showLeftButton, config, setPageConfig, setTitle }
})