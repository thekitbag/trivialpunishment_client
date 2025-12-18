import { useEffect, useMemo, useState } from 'react'
import { useSocket } from '../SocketContext.jsx'

function normalizePlayers(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.players)) return payload.players
  return []
}

export default function HostLobby() {
  const { socket, connected, socketUrl } = useSocket()
  const [players, setPlayers] = useState([])

  useEffect(() => {
    function onUpdate(payload) {
      setPlayers(normalizePlayers(payload))
    }

    socket.on('update_player_list', onUpdate)

    // Request initial state in case we missed the connection event
    if (connected) {
      socket.emit('request_player_list')
    }

    return () => socket.off('update_player_list', onUpdate)
  }, [socket, connected])

  const playerList = useMemo(
    () =>
      players
        .map((p) => {
          if (typeof p === 'string') return { id: p, username: p }
          return p
        })
        .filter((p) => p && p.username),
    [players],
  )

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Host Lobby</h1>
        <p className="subtitle">Players joined: {playerList.length}</p>

        {playerList.length === 0 ? (
          <p className="subtitle">No players yet.</p>
        ) : (
          <ul className="hostList">
            {playerList.map((p) => (
              <li key={p.id || p.username} className="hostListItem">
                {p.username}
              </li>
            ))}
          </ul>
        )}

        <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span>Server: {socketUrl}</span>
          <span>Route: /host</span>
        </div>
      </div>
    </div>
  )
}

