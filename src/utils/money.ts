/**
 * 精确加减乘除与金额单位转换
 */

export function accAdd(arg1: any, arg2: any) {
  let r1 = 0
  let r2 = 0
  try {
    r1 = arg1.toString().split('.')[1].length
  }
  catch { /* ignore */ }
  try {
    r2 = arg2.toString().split('.')[1].length
  }
  catch { /* ignore */ }
  const m = 10 ** Math.max(r1, r2)
  return (arg1 * m + arg2 * m) / m
}

export function accSub(arg1: any, arg2: any) {
  let r1 = 0
  let r2 = 0
  try {
    r1 = arg1.toString().split('.')[1].length
  }
  catch { /* ignore */ }
  try {
    r2 = arg2.toString().split('.')[1].length
  }
  catch { /* ignore */ }
  const m = 10 ** Math.max(r1, r2)
  const n = r1 >= r2 ? r1 : r2
  return ((arg1 * m - arg2 * m) / m).toFixed(n)
}

export function accMul(arg1: any, arg2: any) {
  let m = 0
  const s1 = arg1.toString()
  const s2 = arg2.toString()
  try {
    m += s1.split('.')[1] ? s1.split('.')[1].length : 0
  }
  catch { /* ignore */ }
  try {
    m += s2.split('.')[1] ? s2.split('.')[1].length : 0
  }
  catch { /* ignore */ }
  return (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) / 10 ** m
}

export function accDiv(arg1: any, arg2: any) {
  let t1 = 0
  let t2 = 0
  try {
    t1 = arg1.toString().split('.')[1].length
  }
  catch { /* ignore */ }
  try {
    t2 = arg2.toString().split('.')[1].length
  }
  catch { /* ignore */ }
  const r1 = Number(arg1.toString().replace('.', ''))
  const r2 = Number(arg2.toString().replace('.', ''))
  return (r1 / r2) * 10 ** (t2 - t1)
}

/** 万元转元 */
export function moneyFormatToY(money: any, currentType = 'Y') {
  let price: any = +money || 0
  if (currentType == 'WY')
    price = accMul(money, 10000) || 0
  price = price.toFixed(2)
  return +price
}

/** 元转万元 */
export function moneyFormatToWY(money: any, currentType = 'WY') {
  let price: any = money || 0
  if (currentType == 'WY')
    price = accDiv(money, 10000) || 0
  price = String(price)
  if (price.includes('.') && price.length > 8)
    price = (+price).toFixed(6)
  return +price
}

export function autoFormatMoney(money: any, currentType = 'WY') {
  return currentType == 'WY' ? moneyFormatToWY(money, currentType) : moneyFormatToY(money, currentType)
}

export function formatDecimalMoney(money = '', digit = 2) {
  return money?.replace(new RegExp(`^\\D*([0-9]\\d*\\.?\\d{0,${digit}})?.*$`), '$1')
}

export function autoTransformUnit(value: any, currentType = 'WY') {
  if (!value)
    return ''
  let price: any = currentType == 'WY' ? accMul(value, 10000) : accDiv(value, 10000)
  price = String(price)
  if (price.includes('.') && price.length > 8)
    price = (+price).toFixed(6)
  return price.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (currentType == 'WY' ? '元' : '万元')
}
