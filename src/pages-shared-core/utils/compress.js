/**
 * 三端通用图片压缩（H5 / 小程序 / APP）
 * 限宽高、多轮/二分降质、目标体积控制；超标时非 JPG 先转 JPG 再压
 * 小程序：离屏 Canvas → 页面旧版 canvas 兜底 → compressImage
 * 兼容 wot-design-uni 上传组件
 */

export const COMPRESS_LEGACY_CANVAS_ID = 'uniCompressLegacyCanvas';

const DEFAULTS = {
    targetKB: 300,
    minKB: 100,
    maxWidth: 2000,
    maxHeight: 2000,
    qualityStart: 0.8,
    qualityMin: 0.3,
    concurrency: 3,
};

/** @type {Map<any, { component: any, setSize?: Function, canvasId?: string }>} */
const legacyCanvasApis = new Map();
/** @type {{ component: any, setSize?: Function, canvasId?: string } | null} */
let legacyCanvasApi = null;
/** 旧版 canvas 串行，避免多图并发互相覆盖 */
let legacyCanvasQueue = Promise.resolve();

/** 由上传组件挂载时注册，供 PC 小程序等无 OffscreenCanvas 场景兜底 */
export function registerCompressLegacyCanvas(api) {
    if (!api) return;
    if (api.component) legacyCanvasApis.set(api.component, api);
    legacyCanvasApi = api;
}

export function unregisterCompressLegacyCanvas(api) {
    if (!api) {
        legacyCanvasApi = null;
        legacyCanvasApis.clear();
        return;
    }
    if (api.component) legacyCanvasApis.delete(api.component);
    if (legacyCanvasApi === api || legacyCanvasApi?.component === api.component) {
        legacyCanvasApi = legacyCanvasApis.size
            ? legacyCanvasApis.values().next().value
            : null;
    }
}

function resolveLegacyCanvasApi(canvasComponent) {
    if (canvasComponent && legacyCanvasApis.has(canvasComponent)) {
        return legacyCanvasApis.get(canvasComponent);
    }
    return legacyCanvasApi;
}

function runLegacyCanvasTask(task) {
    const run = legacyCanvasQueue.then(task, task);
    legacyCanvasQueue = run.catch(() => {});
    return run;
}

/** quality: 0~1 或 0~100 → 0~1 */
function toQuality01(q, fallback) {
    if (q == null || q === '') return fallback;
    const n = Number(q);
    if (Number.isNaN(n)) return fallback;
    return n > 1 ? Math.min(n / 100, 1) : Math.max(0, Math.min(n, 1));
}

/** 0~1 → 1~100 */
function toQuality100(q01) {
    return Math.round(Math.max(1, Math.min(100, q01 * 100)));
}

function normalizeOpt(opt = {}) {
    const fromQuality = toQuality01(opt.quality, null);
    let qualityStart = fromQuality ?? toQuality01(opt.qualityStart, DEFAULTS.qualityStart);
    let qualityMin = toQuality01(opt.qualityMin, DEFAULTS.qualityMin);
    // qualityStart 不能低于 qualityMin，否则小程序 while 不执行、H5 二分失效
    if (qualityStart < qualityMin) qualityMin = qualityStart;
    return {
        targetKB: opt.targetKB ?? DEFAULTS.targetKB,
        minKB: opt.minKB ?? DEFAULTS.minKB,
        maxWidth: opt.maxWidth ?? DEFAULTS.maxWidth,
        maxHeight: opt.maxHeight ?? DEFAULTS.maxHeight,
        qualityStart,
        qualityMin,
        concurrency: opt.concurrency ?? DEFAULTS.concurrency,
    };
}

function calcDrawSize(imgW, imgH, maxWidth, maxHeight) {
    const w = Number(imgW) || 1;
    const h = Number(imgH) || 1;
    const scale = Math.min(1, maxWidth / w, maxHeight / h);
    return {
        width: Math.max(1, Math.round(w * scale)),
        height: Math.max(1, Math.round(h * scale)),
    };
}

/** 只传受限边，避免宽高同时指定导致拉伸 */
function pickCompressSize(imgW, imgH, maxWidth, maxHeight) {
    const { width, height } = calcDrawSize(imgW, imgH, maxWidth, maxHeight);
    if (width === imgW && height === imgH) {
        return {};
    }
    // 以缩放比例对应的边为准；相等时优先限宽
    if (width / (imgW || 1) <= height / (imgH || 1)) {
        return { compressedWidth: width };
    }
    return { compressedHeight: height };
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/* --------------------------
   H5 压缩（ObjectURL + 白底转 JPG + 二分质量）
--------------------------- */
export function compressImageH5(fileOrBlob, opt = {}) {
    const { targetKB, minKB, maxWidth, maxHeight, qualityStart, qualityMin } = normalizeOpt(opt);

    return new Promise((resolve, reject) => {
        const blob = fileOrBlob instanceof Blob ? fileOrBlob : null;
        if (!blob) return reject(new Error('Not a Blob'));

        if (blob.size / 1024 <= minKB) return resolve(blob);

        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);

        const cleanup = () => URL.revokeObjectURL(objectUrl);

        img.onload = async () => {
            try {
                const { width, height } = calcDrawSize(img.width, img.height, maxWidth, maxHeight);
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // 白底合成，透明 PNG 也强制出 JPG
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                let lo = qualityMin;
                let hi = qualityStart;
                let best = null;
                let last = null;

                // 先试起始质量
                const first = await canvasToBlob(canvas, 'image/jpeg', hi);
                if (!first) {
                    cleanup();
                    return resolve(blob);
                }
                last = first;
                if (first.size / 1024 <= targetKB) {
                    cleanup();
                    return resolve(first);
                }

                // 二分：尽量高质且体积 ≤ targetKB
                for (let i = 0; i < 6 && hi - lo > 0.04; i++) {
                    const mid = (lo + hi) / 2;
                    const next = await canvasToBlob(canvas, 'image/jpeg', mid);
                    if (!next) break;
                    last = next;
                    if (next.size / 1024 <= targetKB) {
                        best = next;
                        lo = mid;
                    } else {
                        hi = mid;
                    }
                }

                cleanup();
                resolve(best || last || blob);
            } catch (e) {
                cleanup();
                reject(e);
            }
        };

        img.onerror = () => {
            cleanup();
            reject(new Error('Image load failed'));
        };
        img.src = objectUrl;
    });
}

/* --------------------------
  仅替换路径不安全字符，保留原文件名（含中文），并统一扩展名
--------------------------- */
function getSafeName(name = 'image', ext = 'jpg') {
    let base = String(name).replace(/[\/\\:?#<>|"*]/g, '_');
    base = base.replace(/\.[^.]+$/, '') || 'image';
    return base + '.' + ext;
}

function getFileInfo(filePath) {
    return new Promise((resolve, reject) => {
        uni.getFileInfo({
            filePath,
            success: resolve,
            fail: reject,
        });
    });
}

function getImageInfo(src) {
    return new Promise((resolve, reject) => {
        uni.getImageInfo({
            src,
            success: resolve,
            fail: reject,
        });
    });
}

function compressImageOnce(src, { quality, compressedWidth, compressedHeight }) {
    return new Promise((resolve, reject) => {
        const opts = {
            src,
            quality,
            success: resolve,
            fail: reject,
        };
        if (compressedWidth) opts.compressedWidth = compressedWidth;
        if (compressedHeight) opts.compressedHeight = compressedHeight;
        // App 可将非 JPG 压成 JPG；小程序 quality 仅对 JPG 生效
        // #ifdef APP-PLUS
        opts.format = 'jpg';
        // #endif
        uni.compressImage(opts);
    });
}

function isJpegType(type = '', filePath = '', fileName = '') {
    const t = String(type).toLowerCase();
    if (t === 'jpeg' || t === 'jpg') return true;
    // 有明确非 jpg 类型时直接否定（勿被默认文件名 image.jpg 误导）
    if (t && t !== 'unknown') return false;
    const path = String(filePath).toLowerCase();
    const name = String(fileName).toLowerCase();
    // 路径带扩展名优先；仅文件名时排除占位默认名
    if (/\.jpe?g(\?|#|$)/i.test(path)) return true;
    if (name && name !== 'image.jpg' && /\.jpe?g(\?|#|$)/i.test(name)) return true;
    if (/\.png(\?|#|$)/i.test(path) || /\.png(\?|#|$)/i.test(name)) return false;
    if (/\.webp(\?|#|$)/i.test(path) || /\.webp(\?|#|$)/i.test(name)) return false;
    // 无扩展名、无 type：保守当作非 jpg，走转码
    return false;
}

/**
 * 非 JPG（尤其 PNG）先转成 JPG。PC 微信小程序 uni.compressImage 对 PNG 无效。
 * 顺序：离屏 Canvas → 页面旧版 canvas 兜底 → compressImage
 */
async function ensureJpeg(filePath, { maxWidth, maxHeight, quality01, fileName = '', canvasComponent = null }) {
    let info;
    try {
        info = await getImageInfo(filePath);
    } catch (_) {
        info = { width: maxWidth, height: maxHeight, type: '' };
    }

    if (isJpegType(info.type, filePath, fileName)) {
        return filePath;
    }

    const { width, height } = calcDrawSize(
        info.width || maxWidth,
        info.height || maxHeight,
        maxWidth,
        maxHeight,
    );

    // 1) 离屏 Canvas（手机端较稳）
    try {
        const jpgPath = await convertToJpegByOffscreen(filePath, width, height, quality01);
        if (jpgPath) return jpgPath;
    } catch (_) {
        // fall through
    }

    // 2) 页面旧版 canvas 兜底（PC / Mac 小程序常无 Canvas 2D）
    try {
        const jpgPath = await convertToJpegByLegacyCanvas(filePath, width, height, quality01, canvasComponent);
        if (jpgPath) return jpgPath;
    } catch (_) {
        // fall through
    }

    // 3) App 等：compressImage 可能直接转出 JPG
    try {
        const sizeOpts = pickCompressSize(
            info.width || maxWidth,
            info.height || maxHeight,
            maxWidth,
            maxHeight,
        );
        const res = await compressImageOnce(filePath, {
            quality: toQuality100(quality01),
            ...sizeOpts,
        });
        if (res?.tempFilePath) return res.tempFilePath;
    } catch (_) {
        // fall through
    }

    return filePath;
}

function convertToJpegByOffscreen(src, width, height, quality01) {
    return new Promise((resolve, reject) => {
        let canvas;
        try {
            canvas = typeof uni.createOffscreenCanvas === 'function'
                ? uni.createOffscreenCanvas({ type: '2d', width, height })
                : (typeof wx !== 'undefined' && wx.createOffscreenCanvas
                    ? wx.createOffscreenCanvas({ type: '2d', width, height })
                    : null);
        } catch (e) {
            return reject(e);
        }
        if (!canvas || typeof canvas.getContext !== 'function') {
            return reject(new Error('OffscreenCanvas unavailable'));
        }

        const ctx = canvas.getContext('2d');
        if (!ctx || typeof canvas.createImage !== 'function') {
            return reject(new Error('Canvas2D unavailable'));
        }

        const img = canvas.createImage();
        img.onload = () => {
            try {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
            } catch (e) {
                return reject(e);
            }

            const done = (res) => {
                if (res?.tempFilePath) resolve(res.tempFilePath);
                else reject(new Error('canvasToTempFilePath empty'));
            };
            const fail = (err) => reject(err || new Error('canvasToTempFilePath fail'));

            const exportOpts = {
                canvas,
                fileType: 'jpg',
                quality: quality01,
                destWidth: width,
                destHeight: height,
                success: done,
                fail,
            };
            if (typeof uni.canvasToTempFilePath === 'function') {
                uni.canvasToTempFilePath(exportOpts);
            } else if (typeof wx !== 'undefined' && wx.canvasToTempFilePath) {
                wx.canvasToTempFilePath(exportOpts);
            } else {
                reject(new Error('canvasToTempFilePath unavailable'));
            }
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = src;
    });
}

/** 旧版 canvas-id 导出 JPG（需页面已 registerCompressLegacyCanvas） */
function convertToJpegByLegacyCanvas(src, width, height, quality01, canvasComponent) {
    const api = resolveLegacyCanvasApi(canvasComponent);
    const component = canvasComponent || api?.component;
    const canvasId = api?.canvasId || COMPRESS_LEGACY_CANVAS_ID;
    if (!component) {
        return Promise.reject(new Error('Legacy canvas component not bound'));
    }

    return runLegacyCanvasTask(async () => {
        if (typeof api?.setSize === 'function') {
            api.setSize(width, height);
            // 等视图层更新 canvas 宽高（PC 端尤其需要）
            await new Promise((r) => setTimeout(r, 80));
        }

        return new Promise((resolve, reject) => {
            const ctx = uni.createCanvasContext(canvasId, component);
            ctx.setFillStyle('#ffffff');
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(src, 0, 0, width, height);
            ctx.draw(false, () => {
                // draw 回调后仍需短延迟，否则 PC 导出空白/失败
                setTimeout(() => {
                    uni.canvasToTempFilePath(
                        {
                            canvasId,
                            x: 0,
                            y: 0,
                            width,
                            height,
                            destWidth: width,
                            destHeight: height,
                            fileType: 'jpg',
                            quality: quality01,
                            success: (res) => {
                                if (res?.tempFilePath) resolve(res.tempFilePath);
                                else reject(new Error('legacy canvasToTempFilePath empty'));
                            },
                            fail: (err) => reject(err || new Error('legacy canvasToTempFilePath fail')),
                        },
                        component,
                    );
                }, 200);
            });
        });
    });
}

/* --------------------------
   小程序 / APP：超标再转 JPG + 限宽高 + 多轮降质
--------------------------- */
async function compressMpOrApp(filePath, opt = {}, fileName = '') {
    const { targetKB, maxWidth, maxHeight, qualityStart, qualityMin } = normalizeOpt(opt);
    const canvasComponent = opt.canvasComponent || null;

    let size = 0;
    let imgW = maxWidth;
    let imgH = maxHeight;
    try {
        size = (await getFileInfo(filePath)).size;
    } catch (_) {
        // ignore
    }
    try {
        const info = await getImageInfo(filePath);
        imgW = info.width || imgW;
        imgH = info.height || imgH;
    } catch (_) {
        // ignore
    }

    // 已小于目标体积：不转格式、不压缩
    if (size > 0 && size / 1024 <= targetKB) {
        return { path: filePath, size, file: null };
    }

    // 超标时非 JPG 先转，再压（PC 小程序 compressImage 对 PNG 无效）
    let src = filePath;
    try {
        src = await ensureJpeg(filePath, {
            maxWidth,
            maxHeight,
            quality01: qualityStart,
            fileName,
            canvasComponent,
        });
    } catch (_) {
        src = filePath;
    }

    if (src !== filePath) {
        try {
            size = (await getFileInfo(src)).size;
        } catch (_) {
            // ignore
        }
        try {
            const info = await getImageInfo(src);
            imgW = info.width || imgW;
            imgH = info.height || imgH;
        } catch (_) {
            // ignore
        }
        // 转 JPG 后已达标则结束
        if (size > 0 && size / 1024 <= targetKB) {
            return { path: src, size, file: null };
        }
    }

    let quality = toQuality100(qualityStart);
    const qualityFloor = toQuality100(qualityMin);
    let last = { path: src, size, file: null };
    const sizeOpts = pickCompressSize(imgW, imgH, maxWidth, maxHeight);

    while (quality >= qualityFloor) {
        try {
            const res = await compressImageOnce(src, {
                quality,
                ...sizeOpts,
            });
            const path = res.tempFilePath;
            let nextSize = res.tempFileSize;
            if (nextSize == null || nextSize === 0) {
                try {
                    nextSize = (await getFileInfo(path)).size;
                } catch (_) {
                    nextSize = null;
                }
            }
            // 拿不到体积时仍保留结果，但不当作“已达标”
            if (nextSize == null) {
                last = { path, size: last.size, file: null };
                src = path;
            } else {
                last = { path, size: nextSize, file: null };
                if (nextSize / 1024 <= targetKB) return last;
                src = path;
            }
        } catch (_) {
            break;
        }
        quality -= 15;
    }

    return last;
}

/* --------------------------
   单张压缩（最终调用入口）
--------------------------- */
export async function compressSingle(file, opt = {}) {
    const filePath = file.url || file.path || '';
    const fileName = file.name || 'image.jpg';
    const normalized = normalizeOpt(opt);

    /* --------------------------
         H5 走 Canvas（App WebView 也有 window/document，不能用运行时探测）
    --------------------------- */
    // #ifdef H5
    {
        const blob = file.file instanceof Blob
            ? file.file
            : await fetch(filePath).then((r) => r.blob());

        const newBlob = await compressImageH5(blob, normalized);
        // 小于 minKB 未重编码时保留原类型；否则为 image/jpeg
        const finalMime = newBlob.type || 'image/jpeg';
        const finalExt = finalMime === 'image/png' ? 'png' : 'jpg';
        const newName = getSafeName(fileName, finalExt);
        const newFile = new File([newBlob], newName, { type: finalMime });

        // H5 上传走 file，不创建 ObjectURL，避免泄漏
        return {
            ...file,
            url: file.url || filePath,
            size: newBlob.size,
            file: newFile,
            name: newName,
            extname: finalExt,
        };
    }
    // #endif

    /* --------------------------
        小程序 / APP 使用 uni.compressImage
    --------------------------- */
    // #ifndef H5
    const res = await compressMpOrApp(
        filePath,
        { ...normalized, canvasComponent: opt.canvasComponent },
        fileName,
    );
    // 未转码时保留原扩展名；转码/压缩后一般为 jpg
    const changed = res.path && res.path !== filePath;
    const ext = changed ? 'jpg' : (() => {
        const m = String(fileName).match(/\.([^.]+)$/);
        return (m ? m[1] : 'jpg').toLowerCase().replace(/jpeg/, 'jpg');
    })();
    const newName = getSafeName(fileName, ext === 'jpeg' ? 'jpg' : ext);

    return {
        ...file,
        url: res.path,
        size: res.size,
        file: null,
        name: newName,
        extname: ext === 'jpeg' ? 'jpg' : ext,
    };
    // #endif
}

/* --------------------------
   批量压缩（限制并发，避免大图同时解码 OOM）
--------------------------- */
export async function compressFiles(list, opt) {
    const arr = Array.isArray(list) ? list : [list];
    if (!arr.length) return [];

    const { concurrency } = normalizeOpt(opt);
    const results = new Array(arr.length);
    let cursor = 0;

    async function worker() {
        while (cursor < arr.length) {
            const idx = cursor++;
            results[idx] = await compressSingle(arr[idx], opt);
        }
    }

    const n = Math.min(concurrency, arr.length);
    await Promise.all(Array.from({ length: n }, () => worker()));
    return results;
}
