interface WebSocketOptions {
  url: string
  protocols?: string | string[]
  heartbeatInterval?: number
  reconnectInterval?: number
  maxReconnectAttempts?: number
  onOpen?: (event: Event) => void
  onMessage?: (event: MessageEvent) => void
  onError?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
}

type UniSocket = WebSocket | UniNamespace.SocketTask

export class WebSocketClient {
  private ws: UniSocket | null = null
  private options: WebSocketOptions
  private reconnectCount = 0
  private heartbeatTimer: any = null
  private reconnectTimer: any = null
  private manualClose = false
  public isConnected = false
  public isConnecting = false
  private eventListeners: { [key: string]: Array<(event: any) => void> } = {}

  constructor(options: WebSocketOptions) {
    this.options = {
      heartbeatInterval: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...options,
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected)
      return

    this.manualClose = false
    this.isConnecting = true

    try {
      await this.createConnection()
      this.isConnected = true
      this.reconnectCount = 0
      this.startHeartbeat()
    }
    catch (error) {
      this.isConnecting = false
      this.isConnected = false
      this.reconnect()
    }
  }

  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false
      const onOpen = (event: any) => {
        if (settled)
          return
        settled = true
        if (this.options.onOpen)
          this.options.onOpen(event)
        this.emit('open', event)
        this.isConnecting = false
        resolve()
      }
      const onMessage = (event: any) => {
        if (this.options.onMessage)
          this.options.onMessage(event)
        this.emit('message', event)
      }
      const onError = (event: any) => {
        if (this.options.onError)
          this.options.onError(event)
        this.emit('error', event)
        this.isConnecting = false
        if (!settled) {
          settled = true
          reject(event)
        }
      }
      const onClose = (event: any) => {
        if (this.options.onClose)
          this.options.onClose(event)
        this.emit('close', event)
        const wasConnected = this.isConnected
        this.isConnected = false
        this.isConnecting = false
        this.clearHeartbeat()
        // 尚未 open 时由 connect() 的 catch 负责重连，避免与 onClose 双触发
        if (!settled) {
          settled = true
          reject(event)
          return
        }
        if (wasConnected && !this.manualClose)
          this.reconnect()
      }

      try {
        // #ifdef H5
        const socket = new WebSocket(this.options.url, this.options.protocols)
        this.ws = socket
        socket.onopen = onOpen
        socket.onmessage = onMessage
        socket.onerror = onError
        socket.onclose = onClose
        // #endif

        // #ifndef H5
        const protocols = typeof this.options.protocols === 'string'
          ? [this.options.protocols]
          : this.options.protocols
        const socketTask = uni.connectSocket({
          url: this.options.url,
          protocols,
          complete: () => {},
        })
        if (!socketTask) {
          reject(new Error('WebSocket 连接创建失败'))
          return
        }
        this.ws = socketTask
        socketTask.onOpen(onOpen)
        socketTask.onMessage(onMessage)
        socketTask.onError(onError)
        socketTask.onClose(onClose)
        // #endif
      }
      catch (error) {
        reject(error)
      }
    })
  }

  public async send(data: any): Promise<boolean> {
    if (!this.isConnected || !this.ws) {
      console.error('WebSocket is not connected')
      return false
    }

    return new Promise((resolve, reject) => {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data)

        // #ifdef H5
        ;(this.ws as WebSocket).send(message)
        resolve(true)
        // #endif
        // #ifndef H5
        ;(this.ws as UniNamespace.SocketTask).send({
          data: message,
          success: () => resolve(true),
          fail: error => reject(error),
        })
        // #endif
      }
      catch (error) {
        reject(error)
      }
    })
  }

  public disconnect(): void {
    this.manualClose = true
    this.clearHeartbeat()
    this.clearReconnectTimer()

    if (this.ws) {
      // #ifdef H5
      ;(this.ws as WebSocket).close()
      // #endif
      // #ifndef H5
      ;(this.ws as UniNamespace.SocketTask).close({})
      // #endif

      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
  }

  public reconnect(): void {
    if (this.reconnectCount >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      this.emit('reconnect_failed', { type: 'reconnect_failed' })
      return
    }

    this.clearReconnectTimer()
    this.reconnectTimer = setTimeout(() => {
      this.reconnectCount++
      console.log(`Attempting to reconnect (${this.reconnectCount}/${this.options.maxReconnectAttempts})`)
      this.connect()
    }, this.options.reconnectInterval)
  }

  private startHeartbeat(): void {
    if (!this.options.heartbeatInterval)
      return

    this.clearHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' }).catch(() => {
          this.disconnect()
          this.reconnect()
        })
      }
    }, this.options.heartbeatInterval)
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  public on(type: string, callback: (event: any) => void): void {
    if (!this.eventListeners[type])
      this.eventListeners[type] = []

    this.eventListeners[type].push(callback)
  }

  public off(type: string, callback?: (event: any) => void): void {
    if (!this.eventListeners[type])
      return

    if (callback) {
      const index = this.eventListeners[type].indexOf(callback)
      if (index !== -1)
        this.eventListeners[type].splice(index, 1)
    }
    else {
      this.eventListeners[type] = []
    }
  }

  private emit(type: string, event: any): void {
    if (!this.eventListeners[type])
      return
    this.eventListeners[type].forEach((callback) => {
      try {
        callback(event)
      }
      catch (error) {
        console.error(`Error in WebSocket event listener for ${type}:`, error)
      }
    })
  }

  public get connected(): boolean {
    return this.isConnected
  }

  public get connecting(): boolean {
    return this.isConnecting
  }
}

// Reactivity wrapper for easier use
export function useWebSocket(options: WebSocketOptions) {
  const client = new WebSocketClient(options)
  const connected = ref(client.connected)
  const connecting = ref(client.connecting)

  const syncState = () => {
    connected.value = client.connected
    connecting.value = client.connecting
  }

  client.on('open', syncState)
  client.on('close', syncState)
  client.on('error', syncState)

  const connect = async () => {
    await client.connect()
    syncState()
  }

  const disconnect = () => {
    client.disconnect()
    syncState()
  }

  const send = async (data: any) => {
    return await client.send(data)
  }

  const reconnect = () => {
    client.reconnect()
  }

  const on = (type: string, callback: (event: any) => void) => {
    client.on(type, callback)
  }

  const off = (type: string, callback?: (event: any) => void) => {
    client.off(type, callback)
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected: computed(() => connected.value),
    connecting: computed(() => connecting.value),
    connect,
    disconnect,
    send,
    reconnect,
    on,
    off,
  }
}
