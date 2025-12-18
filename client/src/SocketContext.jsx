import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

function getSocketUrl() {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL
  console.log('[SocketContext] Socket URL:', explicitUrl || window.location.origin)
  if (explicitUrl) return explicitUrl
  return window.location.origin
}

// Global Singleton Socket
const socket = io(getSocketUrl(), {
  autoConnect: false, // We control connection in the Provider
  reconnection: true,
})

export function SocketProvider({ children }) {
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    const onConnect = () => {
      console.log('[SocketContext] CONNECTED event fired. ID:', socket.id)
      setConnected(true)
    }

    const onDisconnect = (reason) => {
      console.log('[SocketContext] DISCONNECTED event fired. Reason:', reason)
      setConnected(false)
    }

    const onConnectError = (err) => {
      console.error('[SocketContext] CONNECT_ERROR:', err)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)

    if (!socket.connected) {
        console.log('[SocketContext] Connecting...')
        socket.connect()
    }

    return () => {
      // In strict mode, we might not want to disconnect entirely, 
      // but standard practice is cleanup.
      // socket.disconnect() 
      // socket.off('connect', onConnect) 
      // ...
      
      // For debugging this stubborn issue, let's LEAVE listeners attached
      // and NOT disconnect on unmount, relying on Singleton behavior.
      // This risks memory leaks in SPA navigation but fixes strict mode weirdness.
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
