# Ping — Real-Time Chat for Power Users

[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg?logo=nodedotjs)](https://nodejs.org/)
[![WebSockets](https://img.shields.io/badge/WebSockets-ws-010101.svg?logo=socketdotio)](https://github.com/websockets/ws)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Ping is a high-performance, real-time web messaging platform engineered for developer-centric power users. Designed around low-latency text delivery and expressive developer ergonomics, Ping combines native WebSockets transport with an iOS-inspired glassmorphic UI, live typing speed indicators, Off-the-Record privacy modes, Web Push notifications, desktop keyboard shortcuts, mobile touch gestures, and full Markdown code block rendering.

---

## Key Features

- ⚡ **Global Public & 1-to-1 Private Chat**: Real-time broadcast channels and direct private messaging with persistent database history.
- 🎹 **Power User Keyboard Shortcuts**: Global hotkey navigation (`Ctrl+K` search, `Ctrl+/` slash commands, `Ctrl+Enter` send, `Alt+↑/↓` chat switching, `?` interactive cheatsheet modal).
- 📱 **Mobile Touch Gestures**: Swipe-right to reply to messages, 500ms long-press context menu with emoji reactions, double-tap quick heart, and swipe-left contact actions.
- 🔔 **Web Push Notifications**: Background browser notifications via Service Worker (`/sw.js`) and standard Push API using VAPID keys.
- 🔍 **Active Chat History & Real-Time Search**: Historical messaging peer aggregation (`GET /api/chats/history`) paired with multi-field instant search across usernames, bios, and emails.
- 📝 **Markdown & Code Syntax Highlighting**: Rich text rendering with automatic code block detection, VS Code Dark+ themes, and interactive **Copy Code** buttons.
- 📩 **Dynamic Message Status Checkmarks**: Visual confirmation for message states — Sent (`✓`), Delivered (`✓✓`), and Read (`✓✓` Glowing Cyan).
- ⌨️ **Live WPM Typing Indicator**: Real-time keystroke cadence detection displaying typing status and live Words-Per-Minute (WPM) metrics.
- 🕵️ **Off-the-Record (OTR) Mode**: Ephemeral messaging toggle for 1-to-1 chats — messages bypass database persistence and exist only in client memory.
- 🤖 **@PingBot AI Integration**: Native in-chat AI assistant capability (powered by Gemini Flash API) responding directly in threads.
- 🎨 **Modern Glassmorphism UI**: Sleek frosted-glass design system built with Tailwind CSS v4, Lucide React icons, and Google Inter / JetBrains Mono typography.

---

## Desktop Keyboard Shortcuts & Gestures

| Shortcut / Gesture | Action |
| ------------------ | ------ |
| `Ctrl + K` | Focus sidebar search bar |
| `Ctrl + /` | Toggle slash-command palette (`/whisper`, `/me`, `/clear`) |
| `Ctrl + Enter` | Send message |
| `Alt + ↑ / ↓` | Navigate between active conversations |
| `Ctrl + Shift + M` | Toggle mute/unmute during voice calls |
| `Ctrl + Shift + V` | Toggle video stream during video calls |
| `Escape` | Clear search / close modals / cancel reply |
| `?` | Open interactive Keyboard Shortcuts & Gestures cheatsheet |
| **Swipe Right on Message** | Quote & reply to message |
| **Long-Press on Message (500ms)** | Open context action menu & emoji picker |
| **Double-Tap Message** | Quick react with ❤️ |
| **Swipe Left on Contact** | Reveal quick mute & delete actions |

---

## Technology Stack

| Layer | Technology | Description |
| ----- | ---------- | ----------- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, `react-markdown` | Single-page app with glassmorphism design system & code syntax highlighting |
| **Backend** | Node.js, Express, `ws` (WebSockets), `web-push` | HTTP REST API and bidirectional WebSocket event router |
| **Database** | MongoDB Atlas, Mongoose ODM | Cloud document storage for users, conversations, and message logs |
| **Notifications** | Service Worker (`sw.js`), Web Push API | Background push notification delivery using VAPID keys |
| **Typography** | Google Fonts (Inter & JetBrains Mono) | Modern sans-serif and monospace UI typography |

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

   Edit `.env` to supply your MongoDB URI, port, and VAPID keys:

   ```env
   PORT=9000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ping
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_SUBJECT=mailto:admin@pingapp.com
   ```

   *(Optionally generate VAPID keys using `npx web-push generate-vapid-keys`)*

3. **Start Backend Server**:

   You can start the server using `node server.js` or `npm run dev`:

   ```bash
   cd server
   npm install
   node server.js    # or npm run dev / npm start
   ```

   *Server runs on `http://localhost:9000` by default.*

4. **Start Frontend Client**:

   In a new terminal window, navigate to the `client/` directory:

   ```bash
   cd ../client
   npm install
   npm run dev
   ```

   *Client application opens on `http://localhost:5173` (or Vite's designated port).*

---

## Project Structure

```
chat-app/
├── client/                 # React + Vite Frontend
│   ├── public/
│   │   └── sw.js          # Web Push Service Worker
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/      # Auth modals (Login, Register)
│   │   │   ├── chat/      # Chat canvas, MessageBubble, SlashCommandPalette
│   │   │   ├── common/    # ShortcutsHelpModal, NotificationPermissionModal
│   │   │   ├── profile/   # User profile editor & status views
│   │   │   ├── settings/  # Preferences & centralized Logout
│   │   │   └── sidebar/   # Contact list, active chats, navigation bar
│   │   ├── hooks/
│   │   │   └── useKeyboardShortcuts.js  # Global desktop shortcut manager
│   │   ├── utils/
│   │   │   └── push.js    # Web Push registration & subscription helper
│   │   ├── App.jsx        # Main application state hub & WebSocket routing
│   │   ├── index.css      # Tailwind v4 setup & Glassmorphic CSS custom styles
│   │   └── main.jsx       # Client entry point
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js + Express + WebSockets Backend
│   ├── handlers/          # WebSocket event handlers (chat, history, call, typing)
│   ├── models/            # Mongoose models (User, Message, Conversation, PushSubscription)
│   ├── routes/            # REST API endpoints (auth, users, messages, push)
│   ├── services/          # Active users & broadcast service
│   ├── server.js          # Core Express application entry point
│   └── package.json
├── LICENSE                 # MIT License
└── README.md               # Project documentation
```

---

## License

This project is licensed under the [MIT License](LICENSE).
