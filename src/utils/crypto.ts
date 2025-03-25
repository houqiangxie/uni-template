/*
 * @Author: wuxiangqu
 * @Date: 2024-01-25 10:03:43
 * @LastEditors: wuxiangqu
 * @LastEditTime: 2024-01-25 10:05:24
 * @Description: 
 */
import utf8 from 'crypto-js/enc-utf8';
import aes from 'crypto-js/aes';
import ecb from 'crypto-js/mode-ecb';
import pkcs7 from 'crypto-js/pad-pkcs7';
//  * Aes-128-ecb加密
export const encryptAes128 = (value, key = 'jgzf;QIYE3316++=') => {
    let sKey = utf8.parse(key);
    let sValue = utf8.parse(value);
    let result = aes.encrypt(sValue, sKey, { mode: ecb, padding: pkcs7 });
    return result.toString();
};

//  * Aes-128-ecb解密
export const decryptionAes128 = (value, key = 'jgzf;QIYE3316++=') => {
    try {
        let sKey = utf8.parse(key);
        let result = aes.decrypt(value, sKey, { mode: ecb, padding: pkcs7 });
        return utf8.stringify(result).toString();
    } catch {
        return JSON.stringify('');
    }
};