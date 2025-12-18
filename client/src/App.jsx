import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import HostLobby from './views/HostLobby.jsx'
import LandingPage from './views/LandingPage.jsx'
import PlayerJoin from './views/PlayerJoin.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/host" element={<HostLobby />} />
      <Route path="/join" element={<PlayerJoin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
