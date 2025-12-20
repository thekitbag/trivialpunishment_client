import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../SocketContext.jsx'
import { useAuth } from '../AuthContext.jsx'

export default function GameRoom() {
  const navigate = useNavigate()
  const { socket, connected } = useSocket()
  const { isAuthenticated, loading } = useAuth()

  const [leaderboard, setLeaderboard] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null)
  const [playersAnswered, setPlayersAnswered] = useState(new Set())
  const [phase, setPhase] = useState('waiting')
  const [roundNumber, setRoundNumber] = useState(1)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    function onQuestionStart(payload) {
      console.log('[GameRoom] Question start:', payload)
      console.log('[GameRoom] Question text:', payload.text)
      console.log('[GameRoom] Setting phase to question')
      const question = {
        text: payload.text || 'No question text received',
        options: payload.options || [],
        timeLimit: payload.timeLimit || 30,
      }
      console.log('[GameRoom] Current question object:', question)
      setCurrentQuestion(question)
      setCorrectAnswerIndex(null)
      setPlayersAnswered(new Set())
      setPhase('question')
      setCountdown(payload.timeLimit || 30)
    }

    function onPlayerAnswered(payload) {
      console.log('[GameRoom] Player answered:', payload)
      setPlayersAnswered((prev) => new Set([...prev, payload.playerId]))
    }

    function onRoundReveal(payload) {
      console.log('[GameRoom] Round reveal:', payload)
      setCorrectAnswerIndex(payload.correctIndex)
      setPhase('reveal')

      if (payload.scores) {
        const scores = Array.isArray(payload.scores) ? payload.scores : []
        setLeaderboard(scores.sort((a, b) => b.score - a.score))
      }
    }

    function onUpdateLeaderboard(payload) {
      console.log('[GameRoom] Update leaderboard:', payload)
      if (payload.scores) {
        const scores = Array.isArray(payload.scores) ? payload.scores : []
        setLeaderboard(scores.sort((a, b) => b.score - a.score))
      }
    }

    function onRoundStart(payload) {
      console.log('[GameRoom] Round start:', payload)
      if (payload.roundNumber) {
        setRoundNumber(payload.roundNumber)
      }
      setPhase('intermission')
      setCurrentQuestion(null)
      setCorrectAnswerIndex(null)
    }

    function onGameOver(payload) {
      console.log('[GameRoom] Game over:', payload)
      navigate('/leaderboard', { state: { finalScores: payload.scores } })
    }

    socket.on('question_start', onQuestionStart)
    socket.on('player_answered', onPlayerAnswered)
    socket.on('round_reveal', onRoundReveal)
    socket.on('update_leaderboard', onUpdateLeaderboard)
    socket.on('round_start', onRoundStart)
    socket.on('game_over', onGameOver)

    return () => {
      socket.off('question_start', onQuestionStart)
      socket.off('player_answered', onPlayerAnswered)
      socket.off('round_reveal', onRoundReveal)
      socket.off('update_leaderboard', onUpdateLeaderboard)
      socket.off('round_start', onRoundStart)
      socket.off('game_over', onGameOver)
    }
  }, [socket, navigate])

  useEffect(() => {
    if (phase === 'question' && countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, countdown])

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

  return (
    <div className="page" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '3' }}>
          {phase === 'waiting' && (
            <>
              <h1 className="title">Waiting for game to start...</h1>
              <p className="subtitle">The host will begin the game shortly.</p>
            </>
          )}

          {phase === 'intermission' && (
            <>
              <h1 className="title">Round {roundNumber} Starting...</h1>
              <p className="subtitle">Get ready for the next question!</p>
            </>
          )}

          {phase === 'question' && currentQuestion && (
            <>
              <div style={{ textAlign: 'right', marginBottom: '1rem', color: '#00aaff' }}>
                Time: {countdown}s
              </div>
              <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                {currentQuestion.text}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="card"
                    style={{
                      padding: '1.5rem',
                      backgroundColor: correctAnswerIndex === index ? '#00ff00' : '#2a2a2a',
                      cursor: 'default',
                    }}
                  >
                    <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                  </div>
                ))}
              </div>
              <p className="subtitle" style={{ marginTop: '2rem' }}>
                Players answered: {playersAnswered.size} / {leaderboard.length}
              </p>
            </>
          )}

          {phase === 'reveal' && currentQuestion && (
            <>
              <h2 className="title" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
                {currentQuestion.text}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="card"
                    style={{
                      padding: '1.5rem',
                      backgroundColor: correctAnswerIndex === index ? '#00aa00' : '#2a2a2a',
                      border: correctAnswerIndex === index ? '3px solid #00ff00' : 'none',
                    }}
                  >
                    <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                    {correctAnswerIndex === index && (
                      <span style={{ marginLeft: '1rem', color: '#00ff00' }}>✓ Correct!</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="statusRow" style={{ marginTop: '2rem' }}>
            <span>{connected ? 'Connected' : 'Connecting…'}</span>
            <span>Phase: {phase}</span>
            <span>Question: {currentQuestion ? 'Set' : 'Null'}</span>
          </div>
        </div>

        <div className="card" style={{ flex: '1', minWidth: '250px' }}>
          <h3 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Leaderboard
          </h3>
          {leaderboard.length === 0 ? (
            <p className="subtitle">No scores yet</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {leaderboard.map((player, index) => (
                <li
                  key={player.username || index}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: index === 0 ? '#ffaa00' : '#2a2a2a',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    {index + 1}. {player.username}
                  </span>
                  <strong>{player.score}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
