import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../SocketContext.jsx'

export default function PlayerJoin() {
  const { socket, connected } = useSocket()
  const [gameCode, setGameCode] = useState('')
  const [username, setUsername] = useState('')
  const [joined, setJoined] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    function onGameStarted() {
      setGameStarted(true)
    }

    socket.on('game_started', onGameStarted)
    return () => socket.off('game_started', onGameStarted)
  }, [socket])

  const canJoin = useMemo(() => {
    const code = gameCode.trim()
    return code.length === 4 && username.trim().length > 0
  }, [gameCode, username])

  function onSubmit(event) {
    event.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return

    const code = gameCode.trim().toUpperCase()
    if (code.length !== 4) return

    socket.emit('join_game', { username: trimmed, gameCode: code })
    setJoined(true)
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
            <span>You joined as: {username.trim()}</span>
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
        <p className="subtitle">Enter the 4-letter room code and your name.</p>

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
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            autoComplete="nickname"
            maxLength={24}
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
