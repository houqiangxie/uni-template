export const isDark = useDark()
export const toggleDark = () => isDark.value = !isDark.value

/**
 * 获取当前系统是否为深色模式
 * @returns 是否为深色模式
 */
function useDark() {
  const darkMode = ref(false)
  try {
    const systemInfo = uni.getSystemInfoSync()
    darkMode.value = systemInfo?.theme === 'dark'
  }
  catch { /* ignore */ }
  if (typeof uni.onThemeChange === 'function')
    uni.onThemeChange(res => darkMode.value = res.theme === 'dark')
  return darkMode
}
