//登录
export async function loginUser(data:any) {
    return await post('/auth/login', data)
}
export async function getInfo(data:any,config:any) {
    return await get('/user/current', data,config)
}
export async function doUserLogout() {
    return await post('/auth/logout')
}
//获取验证码
export async function getAuthCode() {
    return await get('/auth/captcha')
}
