import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSocket } from '../SocketContext.jsx'
import { useAuth } from '../AuthContext.jsx'

export default function PlayerGame() {
  const navigate = useNavigate()
  const location = useLocation()
  const { socket, connected } = useSocket()
  const { user, isAuthenticated, loading } = useAuth()

  const [gameCode] = useState(() => {
    return location.state?.gameCode || sessionStorage.getItem('current_game_code')
  })

  const [state, setState] = useState('waiting')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [wasCorrect, setWasCorrect] = useState(null)
  const [currentScore, setCurrentScore] = useState(0)
  const [countdown, setCountdown] = useState(null)
  const [isTopicPicker, setIsTopicPicker] = useState(false)
  const [topicPickerName, setTopicPickerName] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [chosenTopic, setChosenTopic] = useState('')
  const [roundPicker, setRoundPicker] = useState('')

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  useEffect(() => {
    if (!loading && !gameCode) {
      navigate('/join')
    }
  }, [loading, gameCode, navigate])

  useEffect(() => {
    if (connected && user && gameCode) {
      console.log('[PlayerGame] Auto-rejoining game:', gameCode)
      socket.emit('join_game', { username: user.username, gameCode })
    }
  }, [connected, user, gameCode, socket])

  useEffect(() => {
    function onQuestionStart(payload) {
      console.log('[PlayerGame] Question started:', payload)
      setQuestionText(payload.text || '')
      setOptions(payload.options || [])
      setSelectedAnswer(null)
      setWasCorrect(null)
      setState('question')
      setCountdown(payload.timeLimit) // Note: Server needs to send this or we default
      if (payload.topic) setChosenTopic(payload.topic)
      if (payload.pickerUsername) setRoundPicker(payload.pickerUsername)
    }

    function onRoundReveal(payload) {
      console.log('[PlayerGame] Round reveal:', payload)
      if (selectedAnswer !== null) {
        setWasCorrect(selectedAnswer === payload.correctIndex)
      }

      if (payload.scores) {
        const myScoreObj = payload.scores.find(p => p.username === user?.username)
        if (myScoreObj) {
          setCurrentScore(myScoreObj.score)
        }
      }

      setState('result')
    }

    function onRoundStart() {
      setState('waiting')
      setSelectedAnswer(null)
      setWasCorrect(null)
    }

    function onTopicRequest(payload) {
      console.log('[PlayerGame] Topic request:', payload)
      setIsTopicPicker(true)
      setState('topic_input')
    }

    function onTopicWaiting(payload) {
      console.log('[PlayerGame] Topic waiting:', payload)
      // If I am the picker, ignore this event because I should have received 'topic_request'
      if (user && payload.pickerUsername === user.username) {
        console.log('[PlayerGame] Ignoring topic_waiting because I am the picker')
        return
      }
      setIsTopicPicker(false)
      setTopicPickerName(payload.pickerUsername || 'another player')
      setState('topic_waiting')
    }

    function onTopicChosen(payload) {
      console.log('[PlayerGame] Topic chosen:', payload)
      setChosenTopic(payload.topic || '')
      setRoundPicker(payload.pickerUsername || '')
      setState('topic_chosen')
    }

    function onGameOver(payload) {
      console.log('[PlayerGame] Game over:', payload)
      navigate('/leaderboard', { state: { finalScores: payload.scores } })
    }

    function onError(message) {
      console.error('[PlayerGame] Socket error:', message)
      if (message === 'Game not found') {
        sessionStorage.removeItem('current_game_code')
        navigate('/join')
        alert('Game session expired or invalid.')
      }
    }

    socket.on('question_start', onQuestionStart)
    socket.on('round_reveal', onRoundReveal)
    socket.on('round_start', onRoundStart)
    socket.on('topic_request', onTopicRequest)
    socket.on('topic_waiting', onTopicWaiting)
    socket.on('topic_chosen', onTopicChosen)
    socket.on('game_over', onGameOver)
    socket.on('error', onError)

    return () => {
      socket.off('question_start', onQuestionStart)
      socket.off('round_reveal', onRoundReveal)
      socket.off('round_start', onRoundStart)
      socket.off('topic_request', onTopicRequest)
      socket.off('topic_waiting', onTopicWaiting)
      socket.off('topic_chosen', onTopicChosen)
      socket.off('game_over', onGameOver)
      socket.off('error', onError)
    }
  }, [socket, navigate, user, selectedAnswer])

  useEffect(() => {
    if (state === 'question' && countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [state, countdown])

  function handleAnswerClick(index) {
    if (state !== 'question' || selectedAnswer !== null) return

    setSelectedAnswer(index)
    setState('answered')
    console.log('[PlayerGame] Submitting answer:', { answerIndex: index, gameCode })
    socket.emit('submit_answer', { answerIndex: index, gameCode })
  }

  function handleTopicSubmit(event) {
    event.preventDefault()
    const topic = topicInput.trim()
    if (!topic) return

    console.log('[PlayerGame] Submitting topic:', { topic, gameCode })
    socket.emit('submit_topic', { topic, gameCode })
    setTopicInput('')
    setState('waiting')
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <h1 className="title">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="page">
      <div className="card">
        {(state === 'question' || state === 'answered' || state === 'result') && chosenTopic && (
           <div style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#aaa' }}>
             {chosenTopic} {roundPicker && `(${roundPicker})`}
           </div>
        )}

        {state === 'waiting' && (
          <>
            <h1 className="title">Look at the Host Screen</h1>
            <p className="subtitle">Waiting for the next question...</p>
          </>
        )}

        {state === 'topic_input' && (
          <>
            <h1 className="title">Pick a Topic!</h1>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>
              Enter a topic for the next round of questions
            </p>
            <form className="field" onSubmit={handleTopicSubmit}>
              <input
                className="input"
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter a topic (e.g., Movies, Sports, Science)"
                autoFocus
                maxLength={50}
              />
              <button className="button" type="submit" disabled={!topicInput.trim()}>
                Submit Topic
              </button>
            </form>
          </>
        )}

        {state === 'topic_waiting' && (
          <>
            <h1 className="title">Topic Selection</h1>
            <p className="subtitle" style={{ fontSize: '1.5rem', marginTop: '2rem' }}>
              Waiting for <strong>{topicPickerName}</strong> to pick a topic...
            </p>
          </>
        )}

        {state === 'topic_chosen' && (
          <>
            <h1 className="title" style={{ color: '#00aaff' }}>Topic Selected!</h1>
            <p className="subtitle" style={{ fontSize: '1.5rem', marginTop: '2rem' }}>
              <strong>{chosenTopic}</strong>
            </p>
            <p className="subtitle" style={{ marginTop: '1rem' }}>Get ready for questions!</p>
          </>
        )}

        {state === 'question' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '2rem', color: '#00aaff' }}>
              {countdown}s
            </div>
            {questionText && (
              <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                {questionText}
              </h2>
            )}
            <h3 className="subtitle" style={{ fontSize: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Select your answer
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {options.map((option, index) => (
                <button
                  key={index}
                  className="button"
                  onClick={() => handleAnswerClick(index)}
                  style={{
                    padding: '1.5rem',
                    fontSize: '1.2rem',
                    minHeight: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                  }}
                >
                  <strong style={{ marginRight: '1rem', fontSize: '1.5rem' }}>
                    {String.fromCharCode(65 + index)}
                  </strong>
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {state === 'answered' && (
          <>
            <h1 className="title" style={{ color: '#00aaff' }}>Answer Submitted!</h1>
            <p className="subtitle">Waiting for others...</p>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '1rem 2rem',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  fontSize: '1.5rem',
                }}
              >
                Your answer: <strong>{String.fromCharCode(65 + selectedAnswer)}</strong>
              </div>
            </div>
          </>
        )}

        {state === 'result' && (
          <>
            <h1
              className="title"
              style={{
                color: wasCorrect ? '#00ff00' : '#ff4444',
                fontSize: '3rem',
                marginBottom: '2rem',
              }}
            >
              {wasCorrect ? 'Correct!' : 'Wrong!'}
            </h1>
            {selectedAnswer !== null && (
              <p className="subtitle" style={{ fontSize: '1.2rem' }}>
                You answered: <strong>{String.fromCharCode(65 + selectedAnswer)}</strong>
              </p>
            )}
            <p className="subtitle" style={{ fontSize: '1.5rem', marginTop: '2rem' }}>
              Current Score: <strong>{currentScore}</strong>
            </p>
          </>
        )}

        <div className="statusRow">
          <span>{connected ? 'Connected' : 'Connecting…'}</span>
          <span>Route: /play</span>
        </div>
      </div>
    </div>
  )
}
