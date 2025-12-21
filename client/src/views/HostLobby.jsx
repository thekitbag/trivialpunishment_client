import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useSocket } from '../SocketContext.jsx'
import { useAuth } from '../AuthContext.jsx'

function normalizePlayers(payload) {
// ... existing normalizePlayers code ...
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.players)) return payload.players
  return []
}

function normalizeGameCode(payload) {
// ... existing normalizeGameCode code ...
  if (!payload) return null
  if (typeof payload === 'string') return payload
  if (typeof payload.gameCode === 'string') return payload.gameCode
  if (typeof payload.code === 'string') return payload.code
  return null
}

function clampInt(value, min, max) {
// ... existing clampInt code ...
  const parsed = Number.parseInt(String(value), 10)
  if (Number.isNaN(parsed)) return min
  return Math.max(min, Math.min(max, parsed))
}

export default function HostLobby() {
  const { socket, connected } = useSocket()
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [gameCode, setGameCode] = useState(null)
  const [creatingGame, setCreatingGame] = useState(false)
  const [previousCode, setPreviousCode] = useState(null)

  const [targetPlayerCount, setTargetPlayerCount] = useState(3)
  const [roundsPerPlayer, setRoundsPerPlayer] = useState(2)
  const [questionsPerRound, setQuestionsPerRound] = useState(5)
  const [isConfigured, setIsConfigured] = useState(false)
  
  const [joinUrl, setJoinUrl] = useState(window.location.origin)
  const [altUrl, setAltUrl] = useState(null)

  useEffect(() => {
    // Fetch network info to get the real LAN IP
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        if (data.ip) {
          const port = window.location.port
          const protocol = window.location.protocol
          const newUrl = `${protocol}//${data.ip}:${port}`
          setJoinUrl(newUrl)

          // Try to construct a friendly local URL
          if (data.hostname && !data.hostname.includes('localhost')) {
             let host = data.hostname
             if (!host.endsWith('.local')) host += '.local'
             setAltUrl(`${protocol}//${host}:${port}`)
          }
        }
      })
      .catch(err => console.error('Failed to fetch network info:', err))
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
// ... existing useEffect code ...
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    const stored = sessionStorage.getItem('gameCode')
// ... existing useEffect logic ...
    if (stored) {
      setPreviousCode(stored)
    }

    function onUpdate(payload) {
      setPlayers(normalizePlayers(payload))
    }

    function onGameCreated(payload) {
      const code = normalizeGameCode(payload)
      if (!code) return
      setGameCode(code)
      sessionStorage.setItem('gameCode', code)
      setIsConfigured(true)
      setCreatingGame(false)

      if (payload.maxPlayers) setTargetPlayerCount(payload.maxPlayers)
      if (payload.roundsPerPlayer) setRoundsPerPlayer(payload.roundsPerPlayer)
      if (payload.questionsPerRound) setQuestionsPerRound(payload.questionsPerRound)
    }

    function onHostReconnected(payload) {
      const code = normalizeGameCode(payload)
      if (!code) return

      if (payload.gameState === 'GAME_OVER') {
        // Game is finished, do not reconnect
        console.log('[HostLobby] Previous game is over, clearing session')
        sessionStorage.removeItem('gameCode')
        setPreviousCode(null)
        setGameCode(null)
        setIsConfigured(false)
        return
      }
      
      setGameCode(code)
      setTargetPlayerCount(payload.maxPlayers)
      setRoundsPerPlayer(payload.roundsPerPlayer)
      setQuestionsPerRound(payload.questionsPerRound)
      
      setIsConfigured(true)
      setCreatingGame(false)
      sessionStorage.setItem('gameCode', code)
    }
    
    function onError(msg) {
        if (msg === 'Game not found' || msg === 'Invalid game code') {
            sessionStorage.removeItem('gameCode')
            setPreviousCode(null)
        }
        setCreatingGame(false)
        console.error('Socket Error:', msg)
        // alert('Error: ' + msg)
    }

    function onGameStarted(payload) {
      navigate('/game')
    }

    socket.on('update_player_list', onUpdate)
    socket.on('game_created', onGameCreated)
    socket.on('host_reconnected', onHostReconnected)
    socket.on('error', onError)
    socket.on('game_started', onGameStarted)

    // Attempt Reconnection
    if (connected && stored && !gameCode && !creatingGame) {
       socket.emit('reconnect_host', { gameCode: stored })
    }

    return () => {
      socket.off('update_player_list', onUpdate)
      socket.off('game_created', onGameCreated)
      socket.off('host_reconnected', onHostReconnected)
      socket.off('error', onError)
      socket.off('game_started', onGameStarted)
    }
  }, [navigate, socket, connected])

  function onCreateGame() {
    const maxPlayers = clampInt(targetPlayerCount, 2, 8)
    const rounds = clampInt(roundsPerPlayer, 1, 5)
    const questions = clampInt(questionsPerRound, 3, 10)

    setTargetPlayerCount(maxPlayers)
    setRoundsPerPlayer(rounds)
    setQuestionsPerRound(questions)

    setPlayers([])
    setGameCode(null)
    setIsConfigured(true)
    setCreatingGame(true)

    socket.emit('create_game', {
      maxPlayers,
      roundsPerPlayer: rounds,
      questionsPerRound: questions,
    })
  }

  const names = useMemo(
    () =>
      players
        .map((p) => (typeof p === 'string' ? p : p?.username))
        .filter(Boolean),
    [players],
  )

  const isReadyToStart = isConfigured && names.length === targetPlayerCount

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!isConfigured) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Host Setup</h1>
          <p className="subtitle">Choose your game settings.</p>
          {previousCode ? (
            <p className="subtitle">Previous code found: {previousCode}</p>
          ) : null}

          <div className="configGrid" role="group" aria-label="Game configuration">
            <label className="configRow">
              <span className="configLabel">Players</span>
              <input
                className="input"
                type="number"
                min={2}
                max={8}
                value={targetPlayerCount}
                onChange={(e) => setTargetPlayerCount(e.target.value)}
              />
            </label>
            <label className="configRow">
              <span className="configLabel">Rounds per player</span>
              <input
                className="input"
                type="number"
                min={1}
                max={5}
                value={roundsPerPlayer}
                onChange={(e) => setRoundsPerPlayer(e.target.value)}
              />
            </label>
            <label className="configRow">
              <span className="configLabel">Questions per round</span>
              <input
                className="input"
                type="number"
                min={3}
                max={10}
                value={questionsPerRound}
                onChange={(e) => setQuestionsPerRound(e.target.value)}
              />
            </label>
          </div>

          <button className="button" type="button" onClick={onCreateGame} disabled={creatingGame || !connected}>
            Create Game
          </button>

          <div className="statusRow">
            <span>{connected ? 'Connected' : 'Connecting…'}</span>
            <span>Route: /host</span>
          </div>
        </div>
      </div>
    )
  }

  if (creatingGame || !gameCode) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Host</h1>
          <p className="subtitle">Creating game…</p>
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
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="codeBlock" aria-label="Join code" style={{ marginBottom: '1rem' }}>
            <div className="codeLabel">JOIN CODE</div>
            <div className="codeValue">{gameCode}</div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <QRCodeSVG value={joinUrl} size={150} />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', color: '#00aaff', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Scan or go to:
            </div>
            <div style={{ fontSize: '1.5rem', color: '#fff', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
              {joinUrl}
            </div>
            {altUrl && (
              <div style={{ fontSize: '1rem', color: '#aaa' }}>
                Or try: {altUrl}
              </div>
            )}
          </div>
        </div>

        <p className="subtitle">
          {targetPlayerCount} Players • {roundsPerPlayer} Rounds each • {questionsPerRound} Questions
        </p>
        <p className="subtitle">
          Players Joined: {names.length} / {targetPlayerCount}
        </p>

        {isReadyToStart ? <div className="banner">Starting Game…</div> : null}

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
