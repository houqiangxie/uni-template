
export const closeApp = () => { 
    // #ifdef APP-PLUS
    plus.runtime.quit();
    // #endif
    // #ifdef H5
    var ua = window.navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == 'micromessenger') {
        WeixinJSBridge.call?.('closeWindow');
        wx.closeWindow?.();
    } else {
        window.opener = null;
        window.open("about:blank", "_self");
        window.close();
    }
    // #endif
}


// 动态设置导航栏title
export const setNavigationBarTitle = (title) => {
    // #ifdef H5
    const pageTitle = document.getElementsByClassName('uni-page-head__title')||[]
    Object.values(pageTitle).forEach(element => {
        element.innerText = title
    });
    // #endif
    uni.setNavigationBarTitle({title})
}
