/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2023-08-03 10:23:29
 * @LastEditors: houqiangxie
 * @LastEditTime: 2025-02-28 10:44:19
 */
import JSEncrypt from 'jsencrypt';
// 密钥对生成 http://web.chacuo.net/netrsakeypair

const publicKey =
    'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAKoR8mX0rGKLqzcWmOzbfj64K8ZIgOdH\n' +
    'nzkXSOVOZbFu/TJhZ7rFAN+eaGkl3C4buccQd/EjEsj9ir7ijT7h96MCAwEAAQ==';

// const privateKey =
//     'MIIBVAIBADANBgkqhkiG9w0BAQEFAASCAT4wggE6AgEAAkEAqhHyZfSsYourNxaY\n' +
//     '7Nt+PrgrxkiA50efORdI5U5lsW79MmFnusUA355oaSXcLhu5xxB38SMSyP2KvuKN\n' +
//     'PuH3owIDAQABAkAfoiLyL+Z4lf4Myxk6xUDgLaWGximj20CUf+5BKKnlrK+Ed8gA\n' +
//     'kM0HqoTt2UZwA5E2MzS4EI2gjfQhz5X28uqxAiEA3wNFxfrCZlSZHb0gn2zDpWow\n' +
//     'cSxQAgiCstxGUoOqlW8CIQDDOerGKH5OmCJ4Z21v+F25WaHYPxCFMvwxpcw99Ecv\n' +
//     'DQIgIdhDTIqD2jfYjPTY8Jj3EDGPbH2HHuffvflECt3Ek60CIQCFRlCkHpi7hthh\n' +
//     'YhovyloRYsM+IS9h/0BzlEAuO0ktMQIgSPT3aFAgJYwKpqRYKlLDVcflZFCKY7u3\n' +
//     'UP8iWi1Qw0Y=';


// 企业端文件key
export const enterprisePublicKey = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi+Fz5LYom0Xu7yLJ0lsyxZfSvYEvT4LZV3ltZMzgOAmHbbZmvr2AoYH6JqA5pbN1+LJzKD2ED+yrIWa8JKgq0uYtMIzEzNB+3wO22q8hFVrGkC94tHlauvvYgF+Wf0mQPlHeMQKwQOQfsQG09dpH8eZlQQLbA9R+Pl2qa0x+QYkEQprplZAtTLAksjGgJ2YKzQQXUeIRrkz2X3profouMqPxZX0VrVVYay5tqnSvDiuyKT1NXzVc4d2wUQWq/Gd0y2YCW7mF19B4dCy3/oGFe2e/9SsLd+PDwqfn4MSiuBHv8UDN5gZbCbjagh7utER8kyA1k7OcbUcmRfaI+JH7XQIDAQAB`
// 加密
export function encrypt(txt: string, key = publicKey, flag: any) {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(key); // 设置公钥
    return encryptor.encrypt(txt); // 对数据进行加密
}

// 解密
// export function decrypt(txt: string) {
//     const encryptor = new JSEncrypt();
//     encryptor.setPrivateKey(privateKey); // 设置私钥
//     return encryptor.decrypt(txt); // 对数据进行解密
// }

// let base = baseUrl + '/station'
let base = '/station'
const getToken = () => {
    const str = uni.getStorageSync('user')
    let token
    if (str) {
        const user = JSON.parse(str)
        token = user?.userInfo?.token
    } else token = uni.getStorageSync('userInfo')?.token
    return token
}

export const formatUrl = (url: string) => {
    if (!url) return url
    let encryptToken = encrypt(getToken(), enterprisePublicKey, true)
    encryptToken = encodeURIComponent(encryptToken)
    let path = `${base}/image/download?imagePath=${url}&token=${encryptToken}`
    return path
}

export const createTempUrl = async (url: string, type = 'blob') => {
    if (!url) return
    const res = await fetch(formatUrl(url))
    const blob = await res.blob()
    let tempUrl
    if (type == 'blob') tempUrl = URL.createObjectURL(blob)
    else if (type == 'base64') {
        tempUrl = new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // 转换完成后返回 Base64 字符串
            reader.onerror = reject; // 处理错误
            reader.readAsDataURL(blob); // 将 Blob 转换为 Base64
        });
    } else tempUrl = ''
    return tempUrl
}

// 批量替换富文本中的链接
export function replaceMediaLinks(htmlContent: string): string {
    let updatedContent = htmlContent;
    const replaceAttrList = ['img', 'video', 'audio', 'source'];
    replaceAttrList.forEach(element => {
        const regex = new RegExp(`<${element}[^>]+src="([^"]+)"[^>]*>`, 'g');
        updatedContent = updatedContent.replace(regex, (match: string, p1: string) => {
            return match.replace(p1, formatUrl(p1));
        });
    });
    return updatedContent;
}
