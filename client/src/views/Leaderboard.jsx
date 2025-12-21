import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  
  const isGameOver = !!location.state?.finalScores
  const initialPlayers = isGameOver 
    ? normalizePlayers(location.state.finalScores) 
    : normalizePlayers(location.state?.players)

  const [players, setPlayers] = useState(initialPlayers)

  useEffect(() => {
    function onUpdate(payload) {
      if (!isGameOver) {
        setPlayers(normalizePlayers(payload))
      }
    }

    socket.on('update_player_list', onUpdate)
    return () => socket.off('update_player_list', onUpdate)
  }, [socket, isGameOver])

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

  const winner = isGameOver && rows.length > 0 ? rows[0] : null

  return (
    <div className="page">
      <div className="card">
        {isGameOver ? (
          <>
            <h1 className="title" style={{ fontSize: '3rem', color: '#ffaa00' }}>Game Over!</h1>
            {winner && (
              <p className="subtitle" style={{ fontSize: '1.5rem', marginTop: '1rem', color: '#fff' }}>
                Winner: <strong>{winner.name}</strong>
              </p>
            )}
          </>
        ) : (
          <>
            <h1 className="title">Leaderboard</h1>
            <p className="subtitle">Game starting…</p>
          </>
        )}

        {rows.length === 0 ? (
          <p className="subtitle">Waiting for scores…</p>
        ) : (
          <ul className="hostList" style={{ marginTop: '2rem' }}>
            {rows.map((row, index) => (
              <li
                key={row.name}
                className="hostListItem"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  ...(isGameOver && index === 0 ? { backgroundColor: '#ffaa00', color: '#000', transform: 'scale(1.05)', fontWeight: 'bold' } : {})
                }}
              >
                <span>{index + 1}. {row.name}</span>
                {row.score != null ? <span>{row.score}</span> : ''}
              </li>
            ))}
          </ul>
        )}

        {isGameOver && (
          <button
            className="button"
            style={{ marginTop: '2rem' }}
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        )}

        <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span>Route: /leaderboard</span>
        </div>
      </div>
    </div>
  )
}

