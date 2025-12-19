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
      const response = await fetch(`${apiUrl}/api/auth/signup`, {
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
        throw new Error(data.message || 'Signup failed')
      }

      login(data.token, { id: data.userId, username: username.trim() })
      navigate('/')
    } catch (err) {
      setError(err.message || 'An error occurred during signup')
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
