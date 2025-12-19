import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../SocketContext.jsx'
import { useAuth } from '../AuthContext.jsx'

export default function PlayerJoin() {
  const navigate = useNavigate()
  const { socket, connected } = useSocket()
  const { user, isAuthenticated, loading } = useAuth()
  const [gameCode, setGameCode] = useState('')
  const [joined, setJoined] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    function onGameStarted() {
      setGameStarted(true)
    }

    socket.on('game_started', onGameStarted)
    return () => socket.off('game_started', onGameStarted)
  }, [socket])

  const canJoin = useMemo(() => {
    const code = gameCode.trim()
    return code.length === 4 && isAuthenticated
  }, [gameCode, isAuthenticated])

  function onSubmit(event) {
    event.preventDefault()

    if (!isAuthenticated || !user) return

    const code = gameCode.trim().toUpperCase()
    if (code.length !== 4) return

    socket.emit('join_game', { username: user.username, gameCode: code })
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
          <h1 className="title">{gameStarted ? 'Game Starting!' : 'Waiting…'}</h1>
          {gameStarted ? (
            <p className="subtitle">Get Ready! The game is about to begin.</p>
          ) : (
            <p className="subtitle">Waiting for host in Room {gameCode.trim().toUpperCase()}…</p>
          )}
          <div className="statusRow">
            <span>You joined as: {user.username}</span>
            <span>{connected ? 'Connected' : 'Connecting…'}</span>
          </div>
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

        <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span>Route: /join</span>
        </div>
      </div>
    </div>
  )
}
