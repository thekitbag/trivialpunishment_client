import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import HostLobby from './views/HostLobby.jsx'
import LandingPage from './views/LandingPage.jsx'
import Leaderboard from './views/Leaderboard.jsx'
import PlayerJoin from './views/PlayerJoin.jsx'
import Login from './views/Login.jsx'
import Signup from './views/Signup.jsx'
import GameRoom from './views/GameRoom.jsx'
import PlayerGame from './views/PlayerGame.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/host" element={<HostLobby />} />
      <Route path="/join" element={<PlayerJoin />} />
      <Route path="/game" element={<GameRoom />} />
      <Route path="/play" element={<PlayerGame />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
