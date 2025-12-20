import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const signupUrl = `${apiUrl}/api/auth/signup`
      console.log('[Signup] Attempting signup to:', signupUrl)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      console.log('[Signup] Response:', response.status, data)

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      login(data.token, { id: data.userId, username: username.trim() })
      navigate('/')
    } catch (err) {
      console.error('[Signup] Error:', err)
      if (err.name === 'AbortError') {
        setError('Request timed out. Is the server running?')
      } else if (err.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend is running.')
      } else {
        setError(err.message || 'An error occurred during signup')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Sign Up</h1>
        <p className="subtitle">Create a new account</p>

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
            placeholder="Password (min 8 characters)"
            autoComplete="new-password"
            disabled={loading}
          />
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            autoComplete="new-password"
            disabled={loading}
          />

          {error && <p style={{ color: '#ff4444', margin: '0.5rem 0' }}>{error}</p>}

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'SIGN UP'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: '#00aaff' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}
