import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

function getSocketUrl() {
  const explicitUrl = import.meta.env.VITE_SOCKET_URL
  if (explicitUrl) return explicitUrl
  return window.location.origin
}

export function SocketProvider({ children }) {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  if (!socketRef.current) {
    socketRef.current = io(getSocketUrl(), {
      autoConnect: true,
    })
  }

  useEffect(() => {
    const socket = socketRef.current

    if (!socket.connected) {
        socket.connect()
    }

    const onConnect = () => {
      setConnected(true)
    }
    const onDisconnect = () => {
      setConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.disconnect()
    }
  }, [])

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
    }),
    [connected],
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const value = useContext(SocketContext)
  if (!value) throw new Error('useSocket must be used within a SocketProvider')
  return value
}

