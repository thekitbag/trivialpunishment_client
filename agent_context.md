# Agent Context: Trivial Punishment Client

## Project Overview
**Trivial Punishment** is a local multiplayer, mobile-first web game.
- **Concept:** A Host (TV/Laptop) runs the game, and Players (Phones) join via a 4-letter room code to answer questions.
- **Theme:** "Questionable Puns" / Seasonal.
- **Stack:** React 19 (Vite), Socket.io-client, React Router, qrcode.react.

## Architecture
- **Frontend Only:** This repository contains the Client code in the root directory (files were moved from `client/` subdirectory to root for simplified deployment).
- **Communication:** Communicates with the backend server via Socket.io (default port 3001) for real-time game state and HTTP (`/api`) for authentication.
- **State Management:**
  - `SocketContext.jsx`: Global singleton socket instance. Includes auth token in socket connection handshake.
  - `AuthContext.jsx`: User authentication state management with localStorage persistence.

## Component Structure
### Host Views
- **`HostLobby.jsx`**: Pre-game lobby where host creates and configures the game
  - Game creation with configuration (players, rounds, questions, difficulty)
  - Difficulty selector with options: Easy, Medium, Hard, Mixed (default)
  - Displays join code and QR code for players to scan
  - Shows player list as they join
  - Displays selected configuration including difficulty level
  - Requires authentication
  - Auto-starts game when all players have joined

- **`GameRoom.jsx`**: Main host display shown on big screen during gameplay
  - **Full-screen display** - Uses entire viewport (100vh/100vw)
  - **Toggles between two exclusive views:**
    - **Question View**: Shows during `question` phase
      - Large question text (up to 64px)
      - Answer options with letter badges (A, B, C, D)
      - Countdown timer
      - Topic badge at top
      - Players answered counter
    - **Leaderboard View**: Shows during `reveal`, `round_over`, `intermission` phases
      - Large leaderboard title (up to 128px) with gold gradient
      - Player rankings with scores
      - Special styling for top 3 (gold, silver, bronze)
  - **Never shows both views simultaneously**
  - Listens to socket events: `question_start`, `round_reveal`, `round_over`, `topic_waiting`, `topic_chosen`

- **`Leaderboard.jsx`**: Final game results page
  - Shows final scores sorted by rank
  - Navigation back to home

### Player Views
- **`PlayerJoin.jsx`**: Player join screen
  - Enter 4-letter room code
  - Shows username from authenticated session
  - Waiting screen after joining
  - Requires authentication

- **`PlayerGame.jsx`**: Player's personal game interface (mobile-optimized)
  - Question display with answer selection
  - Topic selection when player is the picker
  - Score display
  - Detailed feedback: Points earned (green) or Correct Answer (red)

### Shared Components
- **`LandingPage.jsx`**: Home screen with Host/Join options and Login/Signup
- **`Login.jsx`**: User login form
- **`Signup.jsx`**: User registration form

## Key Features Implemented
1.  **Host/Player Separation:** Different routes (`/host` vs `/join` vs `/`) for different roles.
2.  **Game Creation:** Host can configure settings (Players, Rounds, Questions, Difficulty) and create a room.
    - **Difficulty Selection:** Choose from Easy, Medium, Hard, or Mixed difficulty levels
3.  **Resilience:**
    - **Host Reconnect:** If the Host refreshes, they can resume their session (via `sessionStorage`).
    - **Player Rejoin:** If a Player refreshes, they auto-rejoin the lobby.
4.  **Real-time Updates:** Player lists and game states sync instantly via WebSockets.
5.  **User Authentication (Phase 4):**
    - **Login/Signup:** Users must create accounts to join or host games. No guest access.
    - **Persistent Identity:** User data (username, token) stored in localStorage and persists across sessions.
    - **Protected Routes:** `/join` and `/host` automatically redirect to `/login` if not authenticated.
    - **Socket Authentication:** Auth token automatically included in socket connection for server-side user identification.
    - **Components:** `Login.jsx`, `Signup.jsx`, `AuthContext.jsx`.

## Styling & UI Design
### Full-Screen Host Display (GameRoom.jsx)
- **CSS Classes:**
  - `.gameView`: Full-screen container (100vh) with gradient background
  - `.questionCard` / `.leaderboardCard`: Content containers that fill viewport
  - `.questionTitle`, `.questionText`, `.optionsGrid`: Question display elements
  - `.leaderboardTitle`, `.leaderboardList`, `.leaderboardItem`: Leaderboard elements
- **Responsive Sizing:** Uses `clamp()` for fluid typography that scales with viewport
  - Question titles: `clamp(48px, 8vw, 96px)`
  - Question text: `clamp(36px, 5vw, 64px)`
  - Leaderboard titles: `clamp(64px, 10vw, 128px)`
- **Visual Effects:**
  - Gradient backgrounds and text
  - Top 3 leaderboard positions have gold/silver/bronze styling
  - Hover effects on option items
  - Box shadows and borders for depth

### Debug Features
- **Status Footers:** All `statusRow` divs showing connection status and route are commented out in production
  - Can be uncommented for debugging by removing `{/* */}` comments
  - Located at bottom of views: HostLobby, PlayerJoin, PlayerGame, Leaderboard
  - Shows: Connection status ("Connected"/"Connecting…") and current route

### Mobile-First Design
- Player views (PlayerJoin, PlayerGame) optimized for phone screens
- Host views (GameRoom) optimized for large displays (TV/projector)

## Development Guidelines
- **Socket.io:** Use the `useSocket` hook. Ensure event listeners are cleaned up in `useEffect`.
- **Authentication:** Use the `useAuth` hook to access user state and auth functions. Always check `loading` state before checking `isAuthenticated`.
- **Protected Routes:** Add authentication redirect logic in components that require login.
- **Environment:**
  - `VITE_SOCKET_URL` controls the backend socket target (defaults to `window.location.origin` if unset).
  - `VITE_API_URL` controls the backend API target for HTTP requests (defaults to `window.location.origin` if unset).
  - **Development Proxy:** `vite.config.js` includes proxy configuration for `/api` and `/socket.io` endpoints, targeting `http://localhost:3001` by default during development.
- **Styling:**
  - Global styles in `src/App.css` and `src/index.css`
  - Uses viewport units and clamp() for responsive sizing
  - CSS variables for theming
  - Grid/Flexbox for layouts
- **Debugging:** Uncomment `statusRow` elements in views for connection/route debugging.

## Current Status
- **Phase:** Phase 4 Complete (User Authentication & Persistent Identity) + UI Enhancements.
- **Completed:**
  - User registration and login system
  - Token-based authentication with localStorage persistence
  - Protected routes for host and join flows
  - Socket authentication with token
  - Username display throughout the app
  - **Full-screen host display (GameRoom.jsx)**:
    - Questions and leaderboard never shown simultaneously
    - True full-screen layout (100vh) with no wasted space
    - Large, readable typography for big screen viewing
    - Automatic view switching based on game phase
  - Debug status footers commented out (can be enabled for troubleshooting)
- **Next Steps:** Phase 5 (Global Leaderboards & Stats Tracking).

## Authentication Flow
1. **New User:** Visit landing page → Click "Sign Up" → Enter credentials → Auto-login → Redirected to landing page
2. **Returning User:** Visit landing page → Click "Login" → Enter credentials → Redirected to landing page
3. **Persistent Session:** Token and user data stored in localStorage, user stays logged in across page refreshes
4. **Protected Access:** Attempting to access `/join` or `/host` without authentication redirects to `/login`
5. **Logout:** Click "Logout" button on landing page → Clears localStorage → Returns to logged-out state
