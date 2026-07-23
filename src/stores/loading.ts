export const useLoadingStore = defineStore('loading', () => {
    const loading = ref(false)
    const open = () => loading.value = true
    const close = () => loading.value = false
    return { loading, open, close }
})