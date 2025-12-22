import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../SocketContext.jsx'
import { useAuth } from '../AuthContext.jsx'

export default function PlayerJoin() {
  const navigate = useNavigate()
  const { socket, connected } = useSocket()
  const { user, isAuthenticated, loading } = useAuth()
  const [gameCode, setGameCode] = useState(() => {
    return sessionStorage.getItem('current_game_code') || ''
  })
  const [joined, setJoined] = useState(() => {
    return !!sessionStorage.getItem('current_game_code')
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    // Auto-emit join if we restored state from storage
    if (joined && gameCode && isAuthenticated && user && connected) {
      console.log('[PlayerJoin] Auto-rejoining lobby:', gameCode)
      socket.emit('join_game', { username: user.username, gameCode })
    }
  }, [joined, gameCode, isAuthenticated, user, connected, socket])

  useEffect(() => {
    function onGameStarted() {
      navigate('/play', { state: { gameCode } })
    }

    function onError(message) {
      console.error('[PlayerJoin] Socket error:', message)
      if (message === 'Game not found' || message === 'Room Full' || message === 'Game already started') {
        sessionStorage.removeItem('current_game_code')
        setJoined(false)
        setGameCode('')
        alert(message)
      }
    }

    socket.on('game_started', onGameStarted)
    socket.on('error', onError)
    return () => {
      socket.off('game_started', onGameStarted)
      socket.off('error', onError)
    }
  }, [socket, navigate, gameCode])

  const canJoin = useMemo(() => {
    const code = gameCode.trim()
    return code.length === 4 && isAuthenticated
  }, [gameCode, isAuthenticated])

  function onSubmit(event) {
    event.preventDefault()

    if (!isAuthenticated || !user) return

    const code = gameCode.trim().toUpperCase()
    if (code.length !== 4) return

    sessionStorage.setItem('current_game_code', code)
    setJoined(true)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (joined) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Waiting…</h1>
          <p className="subtitle">Waiting for host in Room {gameCode.trim().toUpperCase()}…</p>
          {/* Debug footer - commented out for production */}
          {/* <div className="statusRow">
            <span>You joined as: {user.username}</span>
            <span>{connected ? 'Connected' : 'Connecting…'}</span>
          </div> */}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Questionable Puns</h1>
        <p className="subtitle">
          Enter the 4-letter room code. Joining as {user.username}
        </p>

        <form className="field" onSubmit={onSubmit}>
          <input
            className="input"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="Game code (4 letters)"
            autoComplete="off"
            maxLength={4}
            inputMode="text"
          />
          <button className="button" type="submit" disabled={!canJoin}>
            JOIN
          </button>
        </form>

        {/* Debug footer - commented out for production */}
        {/* <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span>Route: /join</span>
        </div> */}
      </div>
    </div>
  )
}
