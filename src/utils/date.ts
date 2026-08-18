export function dateFormat(time: any, type = 'date') {
  const normalized = typeof time === 'string'
    ? time.replace(/-/g, '/').replace('T', ' ')
    : time
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime()))
    return ''
  const year = date.getFullYear()
  const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
  const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()
  const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
  const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()
  return type == 'date' ? (`${year}-${month}-${day}`) : (`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`)
}
