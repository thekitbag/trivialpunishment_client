import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../SocketContext.jsx'

function normalizePlayers(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.players)) return payload.players
  return []
}

function normalizeGameCode(payload) {
  if (!payload) return null
  if (typeof payload === 'string') return payload
  if (typeof payload.gameCode === 'string') return payload.gameCode
  if (typeof payload.code === 'string') return payload.code
  return null
}

export default function HostLobby() {
  const { socket, connected, socketUrl } = useSocket()
  const [players, setPlayers] = useState([])
  const [gameCode, setGameCode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function onUpdate(payload) {
      setPlayers(normalizePlayers(payload))
    }

    function onGameCreated(payload) {
      const code = normalizeGameCode(payload)
      if (!code) return
      setGameCode(code)
      sessionStorage.setItem('hostGameCode', code)
      setLoading(false)
    }

    function onError(message) {
      console.error('[HostLobby] Server Error:', message)
      // If reconnection failed, fallback to creating a new game
      if (message === 'Game not found' && sessionStorage.getItem('hostGameCode')) {
        console.log('[HostLobby] Session invalid, creating new game...')
        sessionStorage.removeItem('hostGameCode')
        socket.emit('create_game')
        return
      }
      // Other errors
      if (!gameCode) { 
          // Only stop loading if we don't have a game yet
          setLoading(false)
          setGameCode('ERROR')
      }
    }

    socket.on('update_player_list', onUpdate)
    socket.on('game_created', onGameCreated)
    socket.on('error', onError)

    if (connected) {
      const storedCode = sessionStorage.getItem('hostGameCode')
      if (storedCode) {
        console.log('[HostLobby] Attempting reconnection to:', storedCode)
        socket.emit('reconnect_host', { gameCode: storedCode })
      } else {
        console.log('[HostLobby] Creating new game...')
        socket.emit('create_game')
      }
    }

    return () => {
      socket.off('update_player_list', onUpdate)
      socket.off('game_created', onGameCreated)
      socket.off('error', onError)
    }
  }, [socket, connected])

  const names = useMemo(
    () =>
      players
        .map((p) => (typeof p === 'string' ? p : p?.username))
        .filter(Boolean),
    [players],
  )

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Host</h1>
          <p className="subtitle">Loading…</p>
          <div className="statusRow">
            <span>{connected ? 'Connected' : 'Connecting…'}</span>
            <span>Route: /host</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Host Lobby</h1>
        <div className="codeBlock" aria-label="Join code">
          <div className="codeLabel">JOIN CODE</div>
          <div className="codeValue">{gameCode}</div>
        </div>
        <p className="subtitle">Players joined: {names.length}</p>

        {names.length === 0 ? (
          <p className="subtitle">No players yet.</p>
        ) : (
          <ul className="hostList">
            {names.map((name) => (
              <li key={name} className="hostListItem">
                {name}
              </li>
            ))}
          </ul>
        )}

        <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span>Route: /host</span>
        </div>
      </div>
    </div>
  )
}
