import { ref, computed, onUnmounted } from 'vue'

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

interface WebSocketInstance {
  url: string
  ws: WebSocket | UniNamespace.WebSocket | null
  options: WebSocketOptions
  reconnectCount: number
  heartbeatTimer: any
  reconnectTimer: any
  isConnected: boolean
  isConnecting: boolean
  send: (data: any) => Promise<boolean>
  connect: () => Promise<void>
  disconnect: () => void
  reconnect: () => void
  on: (type: string, callback: (event: any) => void) => void
  off: (type: string, callback?: (event: any) => void) => void
}

export class WebSocketClient {
  private ws: WebSocket | UniNamespace.WebSocket | null = null
  private options: WebSocketOptions
  private reconnectCount = 0
  private heartbeatTimer: any = null
  private reconnectTimer: any = null
  public isConnected = false
  public isConnecting = false
  private eventListeners: { [key: string]: Array<(event: any) => void> } = {}

  constructor(options: WebSocketOptions) {
    this.options = {
      heartbeatInterval: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...options
    }
  }

  public async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return
    }

    this.isConnecting = true

    try {
      await this.createConnection()
      this.isConnected = true
      this.reconnectCount = 0

      if (this.options.onOpen) {
        this.options.onOpen(new Event('open'))
      }
      this.emit('open', new Event('open'))

      this.startHeartbeat()

    } catch (error) {
      this.isConnecting = false
      this.isConnected = false
      this.reconnect()
    }
  }

  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let socket: WebSocket | UniNamespace.WebSocket

        if (process.env.UNI_PLATFORM === 'h5' || !process.env.UNI_PLATFORM) {
          socket = new WebSocket(this.options.url, this.options.protocols)
        } else {
          socket = uni.connectSocket({
            url: this.options.url,
            protocols: this.options.protocols,
            method: 'GET',
          })
        }

        this.ws = socket

        socket.onopen = (event) => {
          if (this.options.onOpen) {
            this.options.onOpen(event)
          }
          this.emit('open', event)
          this.isConnecting = false
          resolve()
        }

        socket.onmessage = (event) => {
          if (this.options.onMessage) {
            this.options.onMessage(event)
          }
          this.emit('message', event)
        }

        socket.onerror = (event) => {
          if (this.options.onError) {
            this.options.onError(event)
          }
          this.emit('error', event)
          this.isConnecting = false
        }

        socket.onclose = (event) => {
          if (this.options.onClose) {
            this.options.onClose(event)
          }
          this.emit('close', event)
          this.isConnected = false
          this.isConnecting = false
          this.clearHeartbeat()
        }

      } catch (error) {
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

        if (process.env.UNI_PLATFORM === 'h5' || !process.env.UNI_PLATFORM) {
          this.ws.send(message)
          resolve(true)
        } else {
          uni.sendSocketMessage({
            data: message,
            success: () => resolve(true),
            fail: (error) => reject(error)
          })
        }
      } catch (error) {
        reject(error)
        return false
      }
    })
  }

  public disconnect(): void {
    this.clearHeartbeat()
    this.clearReconnectTimer()

    if (this.ws) {
      if (process.env.UNI_PLATFORM === 'h5' || !process.env.UNI_PLATFORM) {
        this.ws.close()
      } else {
        uni.closeSocket({})
      }
      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
  }

  public reconnect(): void {
    if (this.reconnectCount >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      this.emit('reconnect_failed', new Event('reconnect_failed'))
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
    if (!this.options.heartbeatInterval) return

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
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(callback)
  }

  public off(type: string, callback?: (event: any) => void): void {
    if (!this.eventListeners[type]) return

    if (callback) {
      const index = this.eventListeners[type].indexOf(callback)
      if (index !== -1) {
        this.eventListeners[type].splice(index, 1)
      }
    } else {
      this.eventListeners[type] = []
    }
  }

  private emit(type: string, event: any): void {
    if (!this.eventListeners[type]) return
    this.eventListeners[type].forEach(callback => {
      try {
        callback(event)
      } catch (error) {
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

  const connect = async () => {
    await client.connect()
    connected.value = client.connected
    connecting.value = client.connecting
  }

  const disconnect = () => {
    client.disconnect()
    connected.value = false
    connecting.value = false
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
    off
  }
}
