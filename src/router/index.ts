import {
  ChannelPlugin,
  createRouter,
  InterceptorPlugin,
  ParamsPlugin,
} from '@meng-xi/uni-router'
import routes from './config'

const LOGIN_ROUTE = 'pagesLoginIndex' as const
const HOME_ROUTE = 'pagesIndex' as const

let launchOptions: App.LaunchShowOption | undefined
let coldStartGuardDone = false

function isLoggedIn(): boolean {
  const userStore = useUserStore()
  return !!userStore.userInfo?.token
}

function resolveLaunchPath(options?: App.LaunchShowOption): string | undefined {
  if (options?.path) {
    return options.path.startsWith('/') ? options.path : `/${options.path}`
  }
  return undefined
}

const router = createRouter({
  routes,
  plugins: [ParamsPlugin, ChannelPlugin, InterceptorPlugin],
  interceptUniApi: true,
})

router.beforeEach((to, from, next) => {
  const loggedIn = isLoggedIn()

  // if (!loggedIn && to.name !== LOGIN_ROUTE) {
  //   next(
  //     {
  //       name: LOGIN_ROUTE,
  //       query: { returnUrl: encodeURIComponent(to.fullPath) },
  //     },
  //     { mode: 'replace' },
  //   )
  //   return
  // }

  // if (loggedIn && to.name === LOGIN_ROUTE) {
  //   next({ name: HOME_ROUTE }, { mode: 'replace' })
  //   return
  // }

  next()
})

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
