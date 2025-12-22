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
  const [topicPickerName, setTopicPickerName] = useState('')
  const [currentTopic, setCurrentTopic] = useState('')
  const [roundPicker, setRoundPicker] = useState('')

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
      if (payload.topic) setCurrentTopic(payload.topic)
      if (payload.pickerUsername) setRoundPicker(payload.pickerUsername)
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

    function onTopicWaiting(payload) {
      console.log('[GameRoom] Topic waiting:', payload)
      setTopicPickerName(payload.pickerUsername || 'a player')
      if (payload.round !== undefined) {
        setRoundNumber(payload.round)
      }
      setPhase('topic_selection')
    }

    function onTopicChosen(payload) {
      console.log('[GameRoom] Topic chosen:', payload)
      setCurrentTopic(payload.topic || '')
      setRoundPicker(payload.pickerUsername || '')
      setPhase('topic_chosen')
    }

    function onRoundOver(payload) {
      console.log('[GameRoom] Round over:', payload)
      if (payload.scores) {
        const scores = Array.isArray(payload.scores) ? payload.scores : []
        setLeaderboard(scores.sort((a, b) => b.score - a.score))
      }
      if (payload.round !== undefined) {
        setRoundNumber(payload.round)
      }
      setPhase('round_over')
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
    socket.on('topic_waiting', onTopicWaiting)
    socket.on('topic_chosen', onTopicChosen)
    socket.on('round_over', onRoundOver)
    socket.on('game_over', onGameOver)

    return () => {
      socket.off('question_start', onQuestionStart)
      socket.off('player_answered', onPlayerAnswered)
      socket.off('round_reveal', onRoundReveal)
      socket.off('update_leaderboard', onUpdateLeaderboard)
      socket.off('round_start', onRoundStart)
      socket.off('topic_waiting', onTopicWaiting)
      socket.off('topic_chosen', onTopicChosen)
      socket.off('round_over', onRoundOver)
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

  // Show leaderboard during intermission/reveal/round_over phases
  const showLeaderboard = phase === 'reveal' || phase === 'round_over' || phase === 'intermission'

  if (showLeaderboard) {
    return (
      <div className="gameView">
        <div className="leaderboardCard">
          <h1 className="leaderboardTitle">Leaderboard</h1>
          {leaderboard.length === 0 ? (
            <p className="questionText">No scores yet</p>
          ) : (
            <ul className="leaderboardList">
              {leaderboard.map((player, index) => (
                <li key={player.username || index} className="leaderboardItem">
                  <span className="leaderboardRank">#{index + 1}</span>
                  <span className="leaderboardName">{player.username}</span>
                  <span className="leaderboardScore">{player.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'question' && currentQuestion) {
    return (
      <div className="gameView">
        <div className="questionCard">
          {currentTopic && (
            <div className="topicBadge">
              <span className="topicLabel">Topic:</span>
              <span className="topicName">{currentTopic}</span>
              {roundPicker && <span className="topicPicker">(chosen by {roundPicker})</span>}
            </div>
          )}
          <div className="questionHeader">
            <h2 className="questionTitle">Question {roundNumber}</h2>
            {countdown !== null && <div className="countdown">{countdown}s</div>}
          </div>
          <p className="questionText">{currentQuestion.text}</p>
          <div className="optionsGrid">
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="optionItem">
                <span className="optionLetter">{String.fromCharCode(65 + index)}</span>
                <span className="optionText">{option}</span>
              </div>
            ))}
          </div>
          <p className="playersAnsweredText">
            Players answered: {playersAnswered.size} / {leaderboard.length}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="gameView">
      <div className="leaderboardCard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
          {(phase === 'question' || phase === 'reveal') && currentTopic && (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#333', borderRadius: '4px', textAlign: 'center' }}>
              <span style={{ color: '#aaa' }}>Current Round: </span>
              <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{currentTopic}</strong>
              {roundPicker && <span style={{ color: '#aaa', marginLeft: '0.5rem' }}>(chosen by {roundPicker})</span>}
            </div>
          )}

          {phase === 'waiting' && (
            <>
              <h1 className="leaderboardTitle">Get Ready!</h1>
              <p className="questionText">The game will begin shortly...</p>
            </>
          )}

          {phase === 'topic_selection' && (
            <>
              <h1 className="leaderboardTitle">Topic Selection</h1>
              <p className="questionText">
                Waiting for <strong>{topicPickerName}</strong> to pick a topic...
              </p>
            </>
          )}

          {phase === 'topic_chosen' && (
            <>
              <h1 className="leaderboardTitle">Topic Selected!</h1>
              <p className="questionText">
                The topic is: <strong>{currentTopic}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
