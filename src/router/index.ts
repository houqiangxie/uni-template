import {
  ChannelPlugin,
  InterceptorPlugin,
  ParamsPlugin,
  createRouter,
} from '@meng-xi/uni-router'
import type { NavigationGuard, RouteLocation } from '@meng-xi/uni-router'
import routes from './config'

const LOGIN_ROUTE = 'pagesLoginIndex' as const
const HOME_ROUTE = 'pagesIndex' as const

/** 无需登录可访问的路由 name（主包首页、登录、示例分包） */
const PUBLIC_ROUTE_NAMES = new Set<string>([
  LOGIN_ROUTE,
  HOME_ROUTE,
])

function isPublicRoute(name?: string, path?: string): boolean {
  if (name && PUBLIC_ROUTE_NAMES.has(name))
    return true
  if (name?.startsWith('pagesTest'))
    return true
  if (path?.includes('/pages-test/'))
    return true
  if (path === '/pages/index' || path?.startsWith('/pages/login/'))
    return true
  return false
}

let launchOptions: App.LaunchShowOption | undefined
let coldStartGuardDone = false

function isLoggedIn(): boolean {
  const userStore = useUserStore()
  return !!userStore.userInfo?.token
}

function resolveLaunchPath(options?: App.LaunchShowOption): string | undefined {
  if (options?.path)
    return options.path.startsWith('/') ? options.path : `/${options.path}`
  return undefined
}

const router = createRouter({
  routes,
  plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin],
  interceptUniApi: true,
})

const authGuard = ((to: RouteLocation) => {
  const loggedIn = isLoggedIn()
  const toName = to.name
  const toPath = to.path

  if (!loggedIn && !isPublicRoute(toName, toPath)) {
    return {
      location: {
        name: LOGIN_ROUTE,
        query: { returnUrl: encodeURIComponent(to.fullPath) },
      },
      mode: 'replace' as const,
    }
  }

  if (loggedIn && toName === LOGIN_ROUTE)
    return { location: { name: HOME_ROUTE }, mode: 'replace' as const }
}) as NavigationGuard

router.beforeEach(authGuard)

/** 记录 App 冷启动参数（deeplink / 分享等） */
export function setLaunchOptions(options?: App.LaunchShowOption) {
  launchOptions = options
}

/**
 * 冷启动 / H5 刷新 / App deeplink 时补执行守卫。
 * 需在首个 onShow 调用，此时页面栈已就绪。
 */
export function runColdStartGuard() {
  if (coldStartGuardDone)
    return Promise.resolve()

  return router.isReady().then(async () => {
    router.syncRoute()
    const launchPath = resolveLaunchPath(launchOptions)

    try {
      await router.guardRoute(launchPath, {
        onAbort: () => {
          router.relaunch({ name: LOGIN_ROUTE })
        },
      })
    }
    catch {
      // 守卫重定向或 onAbort 已处理
    }
    finally {
      coldStartGuardDone = true
    }
  })
}

export default router
