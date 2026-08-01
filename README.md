# Ping — Real-Time Chat for Power Users

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg?logo=nodedotjs)](https://nodejs.org/)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws-010101.svg?logo=socketdotio)](https://github.com/websockets/ws)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-green.svg)](LICENSE)

Ping is a zero-cost, high-performance, real-time web messaging platform engineered for developer-centric power users. Designed around low-latency text delivery and expressive developer ergonomics, Ping combines native WebSockets transport with a glassmorphic UI, live typing speed indicators, Off-the-Record privacy modes, and inline AI assistance.

---

## Key Features

- ** Global Public Chat**: Broadcast channel for all connected users with persistent history and real-time online member indicators.
- ** 1-to-1 Private Messaging**: Point-to-point direct messages with persistent chat history.
- ** Live WPM Typing Indicator**: Real-time keystroke cadence detection displaying typing status and live Words-Per-Minute (WPM) calculations over WebSockets.
- ** Off-the-Record (OTR) Mode**: Ephemeral messaging toggle for 1-to-1 chats—messages bypass database persistence and exist only in client state.
- ** @PingBot AI Integration**: Native in-chat AI assistant capability (powered by Gemini Flash API) responding directly in chat threads.
- ** Modern Glassmorphism Design**: Sleek frosted-glass UI powered by Tailwind CSS v4, Lucide React icons, and custom HSL color-coded user avatars.
- ** User Profiles & Settings**: Customizable bio, status message, location, sound notification toggles, and centralized single-point logout.

---

## Technology Stack

| Layer              | Technology                                         | Description                                                                  |
| ------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Frontend**       | React 18 / 19, Vite, Tailwind CSS v4, Lucide React | High-performance single-page app with glassmorphism design system            |
| **Backend**        | Node.js, Express, `ws` (WebSockets)                | Lightweight server providing HTTP API endpoints and bidirectional WS routing |
| **Database**       | MongoDB Atlas, Mongoose ODM                        | Cloud document storage for users and persistent message history              |
| **Authentication** | `bcryptjs`, LocalStorage session                   | Password hashing with serverless-compatible token-based sessions             |
| **Icons & Media**  | Lucide React                                       | Modern visual icon system replacing standard emojis                          |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT (React 19 / Vite)                     │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│   │  Auth Views  │    │  Chat Canvas │    │ Profile/Settings│   │
│   └──────┬───────┘    └──────┬───────┘    └────────┬────────┘   │
│          │                   │                     │            │
│          └───────────────────▼─────────────────────┘            │
│                       App.jsx (State Hub)                       │
│             ┌──────────────────────────────────┐                │
│             │ WebSocket Client / REST API Fetch│                │
│             └────────────────┬─────────────────┘                │
└──────────────────────────────┼──────────────────────────────────┘
                               │  HTTP + WebSocket (wss://)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SERVER (Node.js + Express)                      │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ REST API Routes  │  │ WebSocket Server │  │ AI Assistant  │  │
│  │ /api/login       │  │ (ws library)     │  │ /api/bot      │  │
│  │ /api/register    │  │ activeUsers Map  │  │ (Gemini API)  │  │
│  │ /api/messages    │  │ broadcast logic  │  └───────────────┘  │
│  └────────┬─────────┘  └────────┬─────────┘                     │
└───────────┼─────────────────────┼───────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas Database                       │
│                                                                 │
│  • Collection: users (username, password, bio, avatarColor, etc)│
│  • Collection: messages (sender, recipient, type, message, etc) │
└─────────────────────────────────────────────────────────────────┘
```

---

## WebSocket Event Protocol

| Event Name                   | Direction       | Description                                                          |
| ---------------------------- | --------------- | -------------------------------------------------------------------- |
| `register`                   | Client → Server | Connects user session and triggers real-time online status broadcast |
| `global_chat`                | Bidirectional   | Broadcasts public messages to all connected clients & saves to DB    |
| `private_chat`               | Bidirectional   | Direct message routing; skipped DB persistence if `otr: true`        |
| `typing` / `typing_wpm`      | Bidirectional   | Transmits live typing status and calculated WPM cadence              |
| `history`                    | Server → Client | Delivers historical messages upon channel selection                  |
| `userList`                   | Server → Client | Broadcasts updated list of online/offline registered users           |
| `bot_query` / `bot_response` | Bidirectional   | Intercepts `@PingBot` queries and streams AI replies                 |

---

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **MongoDB** connection string (MongoDB Atlas or local instance)

### Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Unknownbeliek/chat-app.git
   cd chat-app
   ```

2. **Configure Backend Environment**:
   Navigate to the `server/` directory and set up environment variables:

   ```bash
   cd server
   cp .env.example .env
   ```

   Edit `.env` to supply your MongoDB URI and port:

   ```env
   PORT=9000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ping
   ```

3. **Install Server Dependencies & Start Backend**:

   ```bash
   npm install
   npm run dev    # or node server.js
   ```

   _Server runs on `http://localhost:9000` by default._

4. **Install Client Dependencies & Start Frontend**:
   In a new terminal window, navigate to the `client/` directory:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   _Client application opens on `http://localhost:5173` (or Vite's designated port)._

---

## Project Structure

```
chat-app/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/      # Auth modals (Login, Register)
│   │   │   ├── chat/      # Chat canvas, message list, input box
│   │   │   ├── common/    # Glassmorphic modal popups & shared UI
│   │   │   ├── profile/   # User profile editor & status views
│   │   │   ├── settings/  # Preferences & centralized Logout
│   │   │   └── sidebar/   # Contact list, active chats, navigation bar
│   │   ├── App.jsx        # Main application state hub & WebSocket routing
│   │   ├── index.css      # Tailwind v4 setup & Glassmorphic CSS custom styles
│   │   └── main.jsx       # Client entry point
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js + Express + WebSockets Backend
│   ├── server.js          # Core Express routes, Mongoose models, WS handlers
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── ping_prd.md             # Product Requirements Document
├── LICENSE                 # ISC License
└── README.md               # Project documentation
```

---

## License

This project is licensed under the [MIT License](LICENSE).
