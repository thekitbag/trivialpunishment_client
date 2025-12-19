import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter both username and password')
      return
    }

    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      login(data.token, { id: data.userId, username: username.trim() })
      navigate('/')
    } catch (err) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Login</h1>
        <p className="subtitle">Sign in to your account</p>

        <form className="field" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            disabled={loading}
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            disabled={loading}
          />

          {error && <p style={{ color: '#ff4444', margin: '0.5rem 0' }}>{error}</p>}

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#00aaff' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
