import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Questionable Puns</h1>
        <p className="subtitle">Host on a big screen. Join on your phone.</p>

        <div className="splitActions">
          <button className="button" type="button" onClick={() => navigate('/host')}>
            Host a Game
          </button>
          <button className="button secondary" type="button" onClick={() => navigate('/join')}>
            Join a Game
          </button>
        </div>
      </div>
    </div>
  )
}

