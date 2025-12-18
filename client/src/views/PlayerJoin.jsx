import { useMemo, useState } from 'react'
import { useSocket } from '../SocketContext.jsx'

export default function PlayerJoin() {
  const { socket, connected, socketUrl } = useSocket()
  const [username, setUsername] = useState('')
  const [joined, setJoined] = useState(false)

  const canJoin = useMemo(() => username.trim().length > 0, [username])

  function onSubmit(event) {
    event.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return

    socket.emit('join_game', { username: trimmed })
    setJoined(true)
  }

  if (joined) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Waiting…</h1>
          <p className="subtitle">Hang tight while the host starts the game.</p>
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
        <p className="subtitle">Enter your name to join.</p>

        <form className="field" onSubmit={onSubmit}>
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
          <span style={{ fontSize: '0.7em' }}>{socketUrl}</span>
          <span>Route: /</span>
        </div>
      </div>
    </div>
  )
}

