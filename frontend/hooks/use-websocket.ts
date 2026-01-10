"use client"

import * as React from "react"

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: unknown) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  reconnect?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
}

interface UseWebSocketReturn {
  sendMessage: (data: unknown) => void
  isConnected: boolean
  lastMessage: unknown | null
  reconnect: () => void
}

/**
 * Hook for WebSocket connection
 * Used for real-time job status updates
 * 
 * @example
 * ```tsx
 * const { sendMessage, isConnected, lastMessage } = useWebSocket({
 *   url: `ws://localhost:8000/ws/jobs/${jobId}`,
 *   onMessage: (data) => {
 *     console.log('Job update:', data)
 *   }
 * })
 * ```
 */
export function useWebSocket({
  url,
  onMessage,
  onError,
  onOpen,
  onClose,
  reconnect = true,
  reconnectInterval = 3000,
  reconnectAttempts = 5,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = React.useState(false)
  const [lastMessage, setLastMessage] = React.useState<unknown | null>(null)
  const [reconnectCount, setReconnectCount] = React.useState(0)

  const wsRef = React.useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = React.useRef(reconnect)

  const connect = React.useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
        setReconnectCount(0)
        onOpen?.()
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data)
        } catch {
          setLastMessage(event.data)
          onMessage?.(event.data)
        }
      }

      ws.onerror = (error) => {
        onError?.(error)
      }

      ws.onclose = () => {
        setIsConnected(false)
        wsRef.current = null
        onClose?.()

        // Attempt reconnection
        if (
          shouldReconnectRef.current &&
          reconnectCount < reconnectAttempts
        ) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount((prev) => prev + 1)
            connect()
          }, reconnectInterval)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error("WebSocket connection error:", error)
    }
  }, [url, onMessage, onError, onOpen, onClose, reconnectCount, reconnectAttempts, reconnectInterval])

  const disconnect = React.useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
  }, [])

  const sendMessage = React.useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const manualReconnect = React.useCallback(() => {
    disconnect()
    shouldReconnectRef.current = true
    setReconnectCount(0)
    connect()
  }, [connect, disconnect])

  React.useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, []) // Only connect once

  return {
    sendMessage,
    isConnected,
    lastMessage,
    reconnect: manualReconnect,
  }
}
