/**
 * 三端通用图片压缩（H5 / 小程序 / APP）
 * 自动强制压成 JPG、多轮降质压缩、目标体积控制
 * 兼容 wot-design-uni 上传组件
 */

const isH5 = typeof window !== 'undefined' && typeof document !== 'undefined';

/* --------------------------
   H5 压缩（核心）
--------------------------- */
export function compressImageH5(fileOrBlob, {
    targetKB = 300,
    minKB = 100,
    maxWidth = 2000,
    qualityStart = 0.8,
    qualityMin = 0.3
} = {}) {

    return new Promise((resolve, reject) => {
        let blob = fileOrBlob instanceof Blob ? fileOrBlob : null;
        if (!blob) return reject("Not a Blob");

        if (blob.size / 1024 <= minKB) return resolve(blob);

        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = async () => {

                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');

                let scale = img.width > maxWidth ? maxWidth / img.width : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                let quality = qualityStart;
                let lastBlob = blob;

                let hasAlpha = false;
                try {
                    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    for (let i = 3; i < data.length; i += 200) {
                        if (data[i] < 255) { hasAlpha = true; break; }
                    }
                } catch (e) {
                    hasAlpha = blob.type === 'image/png';
                }

                const mime = hasAlpha ? 'image/png' : 'image/jpeg';

                if (mime === 'image/png') {
                    const newBlob = await new Promise(r => canvas.toBlob(r, mime));
                    return resolve(newBlob || lastBlob);
                }

                while (quality >= qualityMin) {
                    const newBlob = await new Promise(r =>
                        canvas.toBlob(r, mime, quality)
                    );
                    if (!newBlob) break;
                    if (newBlob.size / 1024 <= targetKB) {
                        return resolve(newBlob);
                    }
                    lastBlob = newBlob;
                    quality -= 0.15;
                }
                resolve(lastBlob);
            };
            img.onerror = () => reject("Image load failed");
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/* --------------------------
  生成安全文件名（JPG）
--------------------------- */
function getSafeName(name = 'image', ext = 'jpg') {
    name = name.replace(/[\/\\:?#@]/g, '_');
    let base = name.replace(/\.[^.]+$/, '');
    base = base.replace(/[^a-zA-Z0-9_-]/g, '_');
    return base + '.' + ext;
}

/* --------------------------
   小程序 / APP 使用 tempFilePath
--------------------------- */
function compressMpOrApp(filePath, quality = 80,format = 'jpg',targetKB = 300) {
    return new Promise(resolve => {
        // 先获取文件大小
        uni.getFileInfo({
            filePath,
            success(fileInfo) {
                // byte -> KB
                const sizeKB = fileInfo.size / 1024
                // 小于目标大小，不压缩
                if (sizeKB <= targetKB) {
                    resolve({
                        path: filePath,
                        size: fileInfo.size,
                        file: null
                    })
                    return
                }
                // 超过才压缩
                uni.compressImage({
                    src: filePath,
                    quality,
                    format,
                    success: res => {
                        resolve({
                            path: res.tempFilePath,
                            size: res.tempFileSize,
                            file: null
                        })
                    },
                    fail: () => {
                        resolve({
                            path: filePath,
                            size: fileInfo.size,
                            file: null
                        })
                    }
                })
            },
            fail() {
                // 获取失败直接尝试压缩
                uni.compressImage({
                    src: filePath,
                    quality,
                    format,
                    success: res => {
                        resolve({
                            path: res.tempFilePath,
                            size: res.tempFileSize,
                            file: null
                        })
                    },
                    fail: () => {
                        resolve({
                            path: filePath,
                            size: 0,
                            file: null
                        })
                    }
                })
            }
        })
    })
}

/* --------------------------
   单张压缩（最终调用入口）
--------------------------- */
export async function compressSingle(file, opt = {}) {
    const sys = uni.getSystemInfoSync();
    const isMp = sys.platform.startsWith("mp-");
    const isApp = sys.platform === "app-plus";

    let filePath = file.url || '';
    let fileName = file.name || "image.jpg";

    /* --------------------------
         H5 走 Canvas 多轮压缩
    --------------------------- */
    if (isH5) {
        const blob = file.file instanceof Blob
            ? file.file
            : await fetch(filePath).then(r => r.blob());

            
        const newBlob = await compressImageH5(blob, opt);
        
        const ext = newBlob.type === 'image/png' ? 'png' : 'jpg';
        // const newName = getSafeName(fileName, ext);
        const newName = fileName;
        const newFile = new File([newBlob], newName, { type: newBlob.type });

        return {
            ...file,
            url: URL.createObjectURL(newFile),
            size: newBlob.size,
            file: newFile,
            name: newName,
            extname: ext
        };
    }

    /* --------------------------
        小程序 / APP 使用 uni.compressImage
    --------------------------- */
    const lastDot = fileName.lastIndexOf('.');
    const extSrc = lastDot > -1 ? fileName.slice(lastDot + 1).toLowerCase() : '';
    const format = extSrc === 'png' ? 'png' : 'jpg';
    const res = await compressMpOrApp(filePath, (opt.quality || 30), format, opt.targetKB||300);

    return {
        ...file,
        url: res.path,
        size: res.size,
        file: null,
        name: getSafeName(fileName, format),
        extname: format
    };
}

/* --------------------------
   批量压缩
--------------------------- */
export async function compressFiles(list, opt) {
    const arr = Array.isArray(list) ? list : [list];
    return Promise.all(arr.map(f => compressSingle(f, opt)));
}
