import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()

  function handleLogout() {
    logout()
  }

  return (
    <div className="page">
      <div className="card">
        {isAuthenticated && user && (
          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <span style={{ marginRight: '1rem' }}>Welcome, {user.username}</span>
            <button
              className="button secondary"
              type="button"
              onClick={handleLogout}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              Logout
            </button>
          </div>
        )}

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

        {!isAuthenticated && (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              className="button secondary"
              type="button"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

