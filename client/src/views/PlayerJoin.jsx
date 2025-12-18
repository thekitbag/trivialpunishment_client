import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../SocketContext.jsx'

export default function PlayerJoin() {
  const { socket, connected, socketUrl } = useSocket()
  const [gameCode, setGameCode] = useState('')
  const [username, setUsername] = useState('')
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState(null)

  const canJoin = useMemo(() => {
    const code = gameCode.trim()
    return code.length === 4 && username.trim().length > 0
  }, [gameCode, username])

  useEffect(() => {
    function onError(msg) {
        setError(msg)
        setJoined(false)
        // If we were trying to auto-reconnect and failed, clear storage
        if (sessionStorage.getItem('playerGameCode')) {
             sessionStorage.removeItem('playerGameCode')
             sessionStorage.removeItem('playerUsername')
        }
    }

    socket.on('error', onError)
    return () => socket.off('error', onError)
  }, [socket])

  // Auto-join if session exists
  useEffect(() => {
    if (connected && !joined) {
        const storedCode = sessionStorage.getItem('playerGameCode')
        const storedName = sessionStorage.getItem('playerUsername')
        if (storedCode && storedName) {
            setGameCode(storedCode)
            setUsername(storedName)
            setJoined(true)
            socket.emit('join_game', { username: storedName, gameCode: storedCode })
        }
    }
  }, [connected, joined, socket])

  function onSubmit(event) {
    event.preventDefault()
    const trimmedName = username.trim()
    const trimmedCode = gameCode.trim().toUpperCase()
    
    if (!trimmedName || trimmedCode.length !== 4) return

    setError(null)
    setJoined(true)
    
    // Save session
    sessionStorage.setItem('playerGameCode', trimmedCode)
    sessionStorage.setItem('playerUsername', trimmedName)

    socket.emit('join_game', { username: trimmedName, gameCode: trimmedCode })
  }

  if (joined && !error) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Waiting…</h1>
          <p className="subtitle">Joined Room <strong>{gameCode.toUpperCase()}</strong></p>
          <p className="subtitle">Hang tight while the host starts the game.</p>
          <div className="statusRow">
            <span>You: {username.trim()}</span>
            <span>{connected ? 'Connected' : 'Connecting…'}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Join Game</h1>
        
        {error ? <div className="errorBanner" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div> : null}

        <form className="field" onSubmit={onSubmit}>
          <label className="label">GAME CODE</label>
          <input
            className="input"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            maxLength={4}
            autoCorrect="off"
            autoCapitalize="characters"
          />

          <label className="label">YOUR NAME</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your Name"
            autoComplete="nickname"
            maxLength={24}
          />
          
          <button className="button" type="submit" disabled={!canJoin}>
            JOIN ROOM
          </button>
        </form>

        <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span style={{ fontSize: '0.7em' }}>{socketUrl}</span>
        </div>
      </div>
    </div>
  )
}
