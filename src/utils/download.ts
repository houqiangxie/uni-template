/** 文件下载 */
export class Download {
  constructor(url: string, name: string = '下载文件', flag = true) {
    if (flag)
      url = formatUrl(url)
    // #ifdef H5
    this.openDownload(url, name)
    // #endif
    // #ifndef H5
    uni.downloadFile({
      url,
      success(res) {
        const filePath = res.tempFilePath
        if (!filePath || res.statusCode !== 200) {
          uni.showToast({ title: '下载失败', icon: 'none' })
          return
        }
        uni.openDocument({
          filePath,
          showMenu: true,
          fail() {
            uni.showToast({ title: '无法打开文件', icon: 'none' })
          },
        })
      },
      fail() {
        uni.showToast({ title: '下载失败', icon: 'none' })
      },
    })
    // #endif
  }

  // #ifdef H5
  openDownload(urls: string, name: string) {
    const nameStr = name.replace(/(.*)(\..*)/, '$1')
    const link = urls
    const lastIndex = link.split('.').length - 1
    const type = link.split('.')[lastIndex]
    if (['jpg', 'png', 'jpeg', 'gif'].includes(type)) {
      this.getBase64Image2(link, (image: string) => {
        this.XMLHttpRequest(image, `${nameStr}.${type}`, 'image')
      })
    }
    else {
      this.XMLHttpRequest(link, name, 'file')
    }
  }

  XMLHttpRequest(link: string, name: string, _type: string) {
    const x = new XMLHttpRequest()
    x.open('GET', link, true)
    x.responseType = 'blob'
    x.onload = function () {
      const blob = x.response
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name || ''
      a.click()
    }
    x.send()
  }

  getBase64Image2(img: string, cb: (data: string) => void) {
    const canvas = document.createElement('canvas')
    const image = new Image()
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = `${img}?v=${Math.random()}`
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(image, 0, 0, image.width, image.height)
      const ext = image.src.substring(image.src.lastIndexOf('.') + 1).toLowerCase()
      const base64 = canvas.toDataURL(`image/${ext}`)
      cb(base64)
    }
  }

  dataURLtoBlob(base64: string, cb: (blob: Blob) => void) {
    const arr = base64.split(',')
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n > 0) {
      n -= 1
      u8arr[n] = bstr.charCodeAt(n)
    }
    cb(new Blob([u8arr]))
  }
  // #endif
}
