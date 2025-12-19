import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

function getSocketUrl() {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL
  if (explicitUrl) return explicitUrl
  return window.location.origin
}

// Global Singleton Socket - will be configured with auth in the Provider
let socket = null

function createSocket() {
  const token = localStorage.getItem('token')
  return io(getSocketUrl(), {
    autoConnect: false,
    reconnection: true,
    auth: {
      token: token || undefined,
    },
  })
}

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = createSocket()
    }

    const onConnect = () => {
      setConnected(true)
    }

    const onDisconnect = (reason) => {
      setConnected(false)
    }

    const onConnectError = (err) => {
      console.error('[SocketContext] CONNECT_ERROR:', err)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)

    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, connected, socketUrl: getSocketUrl() }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const value = useContext(SocketContext)
  if (!value) throw new Error('useSocket must be used within a SocketProvider')
  return value
}
