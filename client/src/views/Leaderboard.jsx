import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSocket } from '../SocketContext.jsx'

function normalizePlayers(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.players)) return payload.players
  return []
}

function getDisplayName(player) {
  if (!player) return ''
  if (typeof player === 'string') return player
  if (typeof player.username === 'string') return player.username
  return ''
}

function getDisplayScore(player) {
  if (!player || typeof player !== 'object') return null
  if (typeof player.score === 'number') return player.score
  return null
}

export default function Leaderboard() {
  const { socket, connected } = useSocket()
  const location = useLocation()
  const [players, setPlayers] = useState(() => normalizePlayers(location.state?.players))

  useEffect(() => {
    function onUpdate(payload) {
      setPlayers(normalizePlayers(payload))
    }

    socket.on('update_player_list', onUpdate)
    return () => socket.off('update_player_list', onUpdate)
  }, [socket])

  const rows = useMemo(() => {
    const list = players
      .map((p) => ({
        name: getDisplayName(p),
        score: getDisplayScore(p),
      }))
      .filter((p) => p.name)

    list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    return list
  }, [players])

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Leaderboard</h1>
        <p className="subtitle">Game starting…</p>

        {rows.length === 0 ? (
          <p className="subtitle">Waiting for scores…</p>
        ) : (
          <ul className="hostList">
            {rows.map((row) => (
              <li key={row.name} className="hostListItem">
                {row.name}
                {row.score != null ? ` — ${row.score}` : ''}
              </li>
            ))}
          </ul>
        )}

        <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span>Route: /leaderboard</span>
        </div>
      </div>
    </div>
  )
}

