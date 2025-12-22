# Trivial Punishment Client

The frontend for **Trivial Punishment**, a local multiplayer party game inspired by "Jackbox" games. Built with React, Vite, and Socket.io.

## Overview

- **Concept:** A Host (TV/Laptop) runs the game, and Players (Phones) join via a 4-letter room code.
- **Role:** Handles user interface, game state display, and real-time interactions.
- **Communication:** Connects to the [Backend Server](https://github.com/thekitbag/trivialpunishment_server) via WebSocket.

## Features

- **Host View (Big Screen):**
  - Full-screen cinematic display (100vh).
  - Large typography and "Jackbox-style" animations.
  - Switches between Question View and Leaderboard View automatically.
  - QR code generation for easy player joining.
- **Player View (Mobile):**
  - Optimized for mobile touchscreens.
  - Answer buttons, topic selection, and score display.
- **Authentication:**
  - Login/Signup required.
  - Persistent sessions (localStorage).
  - Protected routes (`/host`, `/join`).
- **Resilience:**
  - Automatic reconnection for hosts and players.

## Project Structure

```
trivialpunishment_client/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── public/                 # Static assets
└── src/
    ├── main.jsx            # Application entry point
    ├── App.jsx             # Router and layout
    ├── App.css             # Global styles
    ├── AuthContext.jsx     # Auth state provider
    ├── SocketContext.jsx   # Socket.io connection provider
    └── views/              # Page components
        ├── LandingPage.jsx # Home (Login/Signup/Menu)
        ├── Login.jsx       # Auth forms
        ├── Signup.jsx      # Auth forms
        ├── HostLobby.jsx   # Game configuration
        ├── GameRoom.jsx    # Main game display (Host)
        ├── PlayerJoin.jsx  # Join screen
        ├── PlayerGame.jsx  # Player controller
        └── Leaderboard.jsx # Final results
```

## Setup & Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The app will run at `http://localhost:5173` (default).

3.  **Environment Variables:**
    Create a `.env` file (optional, see `.env.example`):
    ```env
    VITE_SOCKET_URL=http://localhost:3001
    VITE_API_URL=http://localhost:3001
    ```

    **Note:** During development, Vite's proxy configuration (in `vite.config.js`) automatically forwards `/api` and `/socket.io` requests to `http://localhost:3001`. In production, these environment variables should point to your backend server's URL.

## Technology Stack

- **Framework:** React 19
- **Build Tool:** Vite 7
- **Real-time:** Socket.io-client 4.8
- **Routing:** React Router DOM 7
- **QR Codes:** qrcode.react
- **Styling:** CSS3 (Variables, Clamp for responsive text, Grid/Flexbox)

## Development

- **Formatting:** ESLint is configured.
- **Styles:** Global styles in `src/App.css` and `src/index.css`.
- **Build:** Run `npm run build` to create a production build in the `dist/` directory.
- **Preview:** Run `npm run preview` to preview the production build locally.