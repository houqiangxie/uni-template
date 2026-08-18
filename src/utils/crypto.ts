/*
 * @Author: wuxiangqu
 * @Date: 2024-01-25 10:03:43
 * @LastEditors: wuxiangqu
 * @LastEditTime: 2024-01-25 10:05:24
 * @Description:
 */
import utf8 from 'crypto-js/enc-utf8'
import aes from 'crypto-js/aes'
import ecb from 'crypto-js/mode-ecb'
import pkcs7 from 'crypto-js/pad-pkcs7'

function resolveAesKey(key?: string): string {
  const resolved = key || import.meta.env.VITE_AES_KEY || ''
  if (!resolved)
    console.warn('[crypto] VITE_AES_KEY is not configured')

  return resolved
}

/** Aes-128-ecb 加密 */
export function encryptAes128(value: string, key?: string) {
  const sKey = utf8.parse(resolveAesKey(key))
  const sValue = utf8.parse(value)
  const result = aes.encrypt(sValue, sKey, { mode: ecb, padding: pkcs7 })
  return result.toString()
}

/** Aes-128-ecb 解密 */
export function decryptionAes128(value: string, key?: string) {
  try {
    const sKey = utf8.parse(resolveAesKey(key))
    const result = aes.decrypt(value, sKey, { mode: ecb, padding: pkcs7 })
    return utf8.stringify(result).toString()
  }
  catch {
    return JSON.stringify('')
  }
}
