import { useNavigate } from 'react-router-dom'
import { useSocket } from '../SocketContext.jsx'

export default function LandingPage() {
  const navigate = useNavigate()
  const { connected } = useSocket()

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Questionable Puns</h1>
        <p className="subtitle">A game of wits and dad jokes.</p>
        
        <div className="buttonGroup">
          <button className="button" onClick={() => navigate('/host')}>
            HOST A GAME
          </button>
          <button className="button" onClick={() => navigate('/join')}>
            JOIN A GAME
          </button>
        </div>

        <div className="statusRow">
            <span>{connected ? 'Connected' : 'Connecting…'}</span>
        </div>
      </div>
    </div>
  )
}