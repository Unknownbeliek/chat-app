# Product Requirements Document (PRD)
## Ping — Real-Time Chat for Power Users
**Document Version:** 1.0  
**Status:** Draft for Engineering Review  
**Date:** August 1, 2026  
**Author:** Product Management  
**Reviewers:** Engineering Lead, Frontend Lead, Backend Lead

---

## 1. Executive Summary

### 1.1 Product Vision

Ping is a zero-cost, high-performance, real-time web messaging platform engineered for developer-centric power users. Unlike consumer messaging apps optimized for media sharing, Ping is designed around the core act of communication: fast, precise, expressive text. Every design decision — from its native WebSocket transport layer to its Glassmorphism UI — prioritizes low-latency responsiveness and developer ergonomics over feature bloat.

### 1.2 The Problem

Modern chat platforms fail the developer community in one of two ways. Consumer platforms (WhatsApp, Messenger) are too opaque — no markdown, no code blocks, no presence signals. Enterprise platforms (Slack, Discord) are too heavy — requiring accounts, OAuth, and client downloads that create friction. Neither category operates within a zero-cost infrastructure budget while delivering a premium experience.

### 1.3 The Solution

Ping delivers a real-time, browser-native chat experience built exclusively on free-tier infrastructure (MongoDB Atlas, Render.com, Vite). It supports **Global Public Chat** visible to all authenticated users, **1-to-1 Private Messaging** with full persistent history, **developer-grade formatting** (Markdown, inline code), a **live WPM typing indicator** over WebSockets, an integrated **@PingBot AI assistant** powered by a free-tier AI API, and an **Off-the-Record** ephemeral messaging mode — all wrapped in a responsive Glassmorphism interface that works on both desktop and mobile.

---

## 2. Target Audience & User Personas

### 2.1 Primary Personas

| Persona | Name | Description | Core Need |
|---|---|---|---|
| **The Developer** | Dev Dhruv | Full-stack developer actively coding on side projects; needs to share code snippets, debug with teammates, and query documentation inline. | Markdown + code block rendering; @PingBot AI queries. |
| **The Student** | Student Sara | CS/Engineering student collaborating on group projects and homework; values free tools with minimal setup friction. | Zero-cost access; private 1:1 channels; persistent history. |
| **The Power User** | Power Priya | Fast typist who lives in keyboard-driven workflows; uses browser-based tools exclusively; hates mouse dependence. | Live WPM feedback; keyboard shortcuts; OTR privacy mode. |

### 2.2 Secondary Personas

| Persona | Description | Core Need |
|---|---|---|
| **The Lurker** | Passive reader of Global Chat; monitors project channels without contributing heavily. | Read-only reliability; unread message tracking. |
| **The Privacy-Conscious User** | Sensitive to data retention; needs to discuss confidential details. | Off-the-Record toggle; zero message persistence mode. |

---

## 3. Functional Requirements — Epics & User Stories

### Epic 1: Authentication & User Identity

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| AUTH-01 | As a new user, I want to register with a unique username and password so that I can create a persistent identity on Ping. | P0 | Registration validates min-length (username ≥ 2 chars, password ≥ 4 chars); returns 400 on duplicate username; passwords stored as bcrypt hashes. |
| AUTH-02 | As a returning user, I want to log in with my credentials so that my chat history and profile are restored. | P0 | Successful login returns profile fields (bio, status, avatarColor); JWT-equivalent session token persisted in `localStorage`. |
| AUTH-03 | As a user, I want my session to automatically re-authenticate on page refresh so that I don't have to log in every visit. | P0 | `localStorage` token parsed on mount; WebSocket `register` event fired before UI renders chat. |
| AUTH-04 | As a user, I want to log out securely from a single centralized location so that I don't see scattered logout buttons across the UI. | P1 | Logout only exposed in Settings tab; confirmation modal required; `localStorage` cleared and WebSocket closed on confirmation. |

---

### Epic 2: Real-Time Global Chat

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| GLOBAL-01 | As a user, I want to send messages to a shared Global Chat channel so that I can broadcast to all online users simultaneously. | P0 | Messages broadcast via WebSocket to all connected clients; saved to MongoDB; sender aligned right, others left. |
| GLOBAL-02 | As a user, I want to see the last 50 messages of Global Chat history on connect so that I have immediate context. | P0 | Server queries MongoDB for 50 most recent global messages on WebSocket open; sent as `type: history` payload. |
| GLOBAL-03 | As a user, I want to see how many members are currently online so that I have a sense of channel activity. | P1 | Online count badge (`🟢 X members online`) displayed in sidebar header and Global Chat panel header; updates in real-time on user join/leave. |
| GLOBAL-04 | As a user, I want to see username avatars (initials, color-coded) next to every message bubble so that I can visually distinguish senders. | P1 | Avatars derived from [getInitials(username)](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#14-27) and [getUsernameColor(username)](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#3-13) or custom `avatarColor` from user profile. |

---

### Epic 3: 1-to-1 Private Messaging

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| DM-01 | As a user, I want to send private messages to a specific registered contact so that I can have confidential 1:1 conversations. | P0 | Messages routed point-to-point via WebSocket; saved to MongoDB with `type: private_chat`, `username`, and `recipient` fields. |
| DM-02 | As a user, I want to see my full private chat history with any contact when I open their conversation so that I have continuity across sessions. | P0 | Selecting a contact triggers `GET /api/messages/private?user1=&user2=`; last 100 messages returned, rendered chronologically. |
| DM-03 | As a user, I want to see all registered contacts (both online and offline) in my contacts panel so that I can message anyone, not just active users. | P1 | Contacts list populated from `GET /api/users`; green badge for online, grey for offline; real-time status updates via `userList` WebSocket event. |
| DM-04 | As a user, I want a clear last-message preview and timestamp in my contacts list so that I know which conversations are active. | P1 | Contact list items show truncated last message body and localized timestamp; empty state shows bio text. |

---

### Epic 4: Developer-Centric UX — Markdown & Code Formatting

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| DEV-01 | As a developer, I want to send messages with Markdown formatting (bold, italics, headers, lists) so that I can communicate structured thoughts clearly. | P1 | Message content rendered through a Markdown parser (e.g. `react-markdown`); output sanitized against XSS. |
| DEV-02 | As a developer, I want to paste code snippets wrapped in triple-backtick fences so that I can share runnable code with proper syntax highlighting. | P1 | Code fences rendered via `react-syntax-highlighter`; language auto-detected; dark theme consistent with app Glassmorphism palette. |
| DEV-03 | As a developer, I want inline code (single backtick) to render with monospace styling so that variable names and commands are clearly readable. | P2 | Inline `code` spans styled with `font-mono`, subtle background rounding, distinguishable from prose text. |

---

### Epic 5: Hyper-Interactive Presence — Live WPM Typing Indicator

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| WPM-01 | As a user, I want to see a real-time "typing…" indicator when another user is actively composing a message so that I know a reply is coming. | P1 | `typing` WebSocket event emitted on `input` keydown; indicator auto-clears after 2 seconds of inactivity. |
| WPM-02 | As a user, I want to see the live WPM speed of a user who is typing so that I know whether a long or short reply is coming. | P2 | WPM calculated client-side from keystroke cadence; broadcast via `typing_wpm` WebSocket event; displayed as `[username] typing… (82 WPM)`. |
| WPM-03 | As a user, I want WPM data to be suppressed when I am in a private chat so that WPM visibility is limited to the active chat partner. | P2 | `typing_wpm` events are targeted (routed only to the recipient for DMs); broadcast only in Global Chat for global events. |

---

### Epic 6: AI Integration — @PingBot

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| BOT-01 | As a user, I want to mention `@PingBot` followed by a question so that I can query an AI assistant without leaving the chat. | P1 | Message starting with `@PingBot` intercepted client-side; query forwarded to AI API endpoint on server; response rendered as a special bot message bubble. |
| BOT-02 | As a user, I want @PingBot's responses to appear inline in the chat thread with a distinct visual style so that I can differentiate AI responses from user messages. | P1 | Bot messages rendered with unique avatar (🤖), purple-tinted bubble, and `PingBot` username label; Markdown-rendered response body. |
| BOT-03 | As a user, I want @PingBot to handle API failures gracefully so that the chat isn't disrupted by AI service downtime. | P1 | On API error, bot replies with a friendly error message (`PingBot is unavailable right now. Try again later.`); no crash or empty state. |
| BOT-04 | As a user, I want @PingBot usage to be rate-limited per user to prevent abuse of the free-tier AI API quota. | P2 | Server enforces max 10 bot queries per user per minute; returns a `rate_limit` error message to the client on breach. |

---

### Epic 7: Privacy Mode — Off-the-Record (OTR) Messaging

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| OTR-01 | As a privacy-conscious user, I want to toggle "Off-the-Record" mode in a 1:1 chat so that my messages are transmitted but never saved to the database. | P1 | OTR toggle visible in DM chat header; when active, `private_chat` messages sent with `otr: true` flag; server skips MongoDB `save()` call for flagged messages. |
| OTR-02 | As a user, I want OTR messages to be visually distinguished from regular messages so that both parties are aware of the ephemeral context. | P1 | OTR message bubbles rendered with striped/dashed border and italic text; tooltip on hover: "This message was not saved". |
| OTR-03 | As a user, I want OTR messages to disappear from the conversation thread on page reload so that ephemeral behavior is enforced client-side. | P1 | OTR messages stored only in React state; not persisted to `localStorage` or fetched from history endpoint; cleared on unmount/reload. |

---

### Epic 8: User Profiles & Settings

| ID | User Story | Priority | Acceptance Criteria |
|---|---|---|---|
| PROF-01 | As a user, I want to view and edit my profile (bio, status, location, avatar color) so that my contacts can identify me. | P1 | Profile tab renders current user data fetched from `GET /api/profile/:username`; form saves via `PUT /api/profile`; success/error toast displayed. |
| PROF-02 | As a user, I want a color-coded initial avatar derived from my username so that I have a distinct visual identity without uploading a photo. | P1 | [getInitials()](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#14-27) generates 1-2 char abbreviation; [getUsernameColor()](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#3-13) generates deterministic HSL color from username hash; overridden by `avatarColor` preference. |
| PROF-03 | As a user, I want to configure sound notification and desktop push notification preferences in Settings so that I control how I am alerted. | P2 | Sound toggle persisted in `localStorage`; browser `Notification.requestPermission()` called on push toggle enable; notifications fire on incoming message. |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| Requirement | Target |
|---|---|
| WebSocket Message Latency | < 100ms round-trip on same continent (local network) |
| Page Initial Load Time | < 2.5s (Vite bundle, gzip compressed) |
| Chat History API Response | < 500ms for 100 messages from MongoDB Atlas |
| Client Bundle Size | < 300 kB gzipped (excluding vendor chunks) |
| Typing Indicator Debounce | ≤ 500ms from keydown to indicator visible on recipient |

### 4.2 Security

| Requirement | Implementation |
|---|---|
| Password Storage | bcrypt with salt factor 10 (server-side hashing via `bcryptjs`) |
| XSS Prevention | All user-generated content rendered via React's escaped JSX; Markdown output sanitized via `DOMPurify` or `rehype-sanitize` |
| Authentication | Session token stored in `localStorage`; server-side validation on WebSocket `register` event and REST calls |
| Rate Limiting | `express-rate-limit` middleware on `/api/login`, `/api/register`, and `/api/bot` routes |
| CORS Policy | `origin` restricted to production domain in production environment; wildcard only in local development |

### 4.3 Infrastructure & Cost Constraints

| Constraint | Detail |
|---|---|
| Hosting | All components hosted on **free-tier** platforms only (Render.com, Vercel, etc.) |
| Database | MongoDB **Atlas Free Tier** (512 MB storage limit; no replica sets) |
| AI API | Free-tier models only (Gemini Flash, Groq Llama, or equivalent zero-cost endpoint) |
| Concurrent WebSocket Connections | Designed for ≤ 100 concurrent connections on free-tier compute |
| Cold Start Tolerance | Application must tolerate server cold starts (Render.com free tier spins down after inactivity); client should implement WebSocket reconnect logic |

### 4.4 Availability & Reliability

| Requirement | Target |
|---|---|
| WebSocket Reconnect | Auto-reconnect with exponential backoff on connection loss |
| Session Persistence | Login state restored from `localStorage` on page refresh |
| Graceful Degradation | If WebSocket is unavailable, user sees "Connecting…" spinner rather than a blank/crashed UI |

---

## 5. Technical Architecture & Stack

### 5.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 18 (Vite) | Fast HMR, JSX component model, hooks-first architecture |
| **Styling** | Tailwind CSS v4 | Utility-first; minimal build size; no runtime CSS costs |
| **Real-Time Transport** | Native WebSockets (`ws` library) | Zero overhead vs. Socket.IO; full duplex; free on any Node host |
| **Backend Framework** | Node.js + Express | Lightweight; shares JS runtime with frontend; zero licensing cost |
| **Database** | MongoDB Atlas (Mongoose ODM) | Document model ideal for chat messages; free tier adequate for v1.0 |
| **Auth** | `bcryptjs` + `localStorage` session | Serverless-compatible; zero dependency on JWT libraries for v1.0 |
| **AI Integration** | Gemini Flash API (free tier) | Highest free-tier token quota; Markdown-native responses |

### 5.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React / Vite)                        │
│                                                                      │
│   ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐    │
│   │  Auth Views  │   │  Chat Canvas │   │  Profile / Settings │    │
│   └──────┬───────┘   └──────┬───────┘   └──────────┬──────────┘    │
│          │                  │                        │               │
│          └──────────────────▼────────────────────────┘               │
│                       App.jsx (State Hub)                            │
│                   ┌──────────────────────┐                           │
│                   │  WebSocket Client    │ ◄─── ws message handler   │
│                   │  REST fetch() calls  │                           │
└───────────────────┴────────┬─────────────┴───────────────────────────┘
                             │  HTTP + WebSocket (wss://)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js + Express)                       │
│                                                                      │
│  ┌─────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
│  │  REST API        │  │  WebSocket Server  │  │  AI Proxy Route  │  │
│  │  /api/login      │  │  (ws library)      │  │  /api/bot        │  │
│  │  /api/register   │  │  activeUsers Map   │  │  → Gemini API    │  │
│  │  /api/users      │  │  broadcastUserList │  └──────────────────┘  │
│  │  /api/profile    │  │  broadcast()       │                        │
│  │  /api/messages   │  └────────┬───────────┘                        │
│  └────────┬─────────┘           │                                    │
└───────────┼─────────────────────┼────────────────────────────────────┘
            │                     │
            ▼                     ▼
┌───────────────────────────────────────┐
│         MongoDB Atlas (Free Tier)     │
│                                       │
│   Collection: users                   │
│   { username, password (hash),        │
│     bio, status, location,            │
│     avatarColor, createdAt }          │
│                                       │
│   Collection: messages                │
│   { username, recipient, message,     │
│     type (global_chat|private_chat),  │
│     timestamp }                       │
└───────────────────────────────────────┘
```

### 5.3 WebSocket Event Protocol

| Event (Client → Server) | Payload Fields | Description |
|---|---|---|
| `register` | `username` | Announces user on connect; triggers [broadcastUserList()](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/server/server.js#243-266) |
| `global_chat` | `sender`, [message](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#195-244) | Broadcasts to all clients; saved to DB |
| `private_chat` | `sender`, `recipient`, [message](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#195-244), `otr?` | Routed to recipient + sender; saved to DB unless `otr: true` |
| `get_private_history` | `partner` | Requests DM history with specified user |
| `typing` / `typing_wpm` | `sender`, `recipient?`, `wpm` | Ephemeral presence signal; never saved |
| `bot_query` | `sender`, `query` | Forwards user query to AI API; response returned as `bot_response` |

| Event (Server → Client) | Payload Fields | Description |
|---|---|---|
| `history` | `data[]` | Last 50 global messages on connection open |
| `userList` | `users[]`, `onlineCount` | All registered users with `isOnline` status |
| `global_chat` | `sender`, [message](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#195-244), `timestamp` | Incoming global message |
| `private_chat` | `sender`, `recipient`, [message](file:///c:/Users/rajku/Documents/2026/ChatApp/chat-app/client/src/App.jsx#195-244), `timestamp`, `otr?` | Incoming DM |
| `private_history` | `partner`, `data[]` | Historical DMs for selected contact |
| `typing` / `typing_wpm` | `sender`, `wpm` | Typing presence indicator |
| `bot_response` | `query`, `response`, `timestamp` | AI assistant reply |

---

## 6. Out of Scope — v1.0

The following features are explicitly excluded from v1.0 to maintain delivery focus. All items are candidates for v1.1+ planning.

| Feature | Reason for Exclusion |
|---|---|
| Group Chats / Channels | Requires multi-party presence, admin roles, and invite systems beyond current architecture |
| File / Image Uploads | Requires cloud storage (S3, Cloudinary); exceeds free-tier storage budget |
| Voice / Video Calls | Requires WebRTC signaling infrastructure; out of scope for text-first v1.0 |
| Message Reactions (Emoji) | Requires fine-grained message update events and UI; v1.1 candidate |
| Read Receipts | Requires per-user delivery tracking in DB; deferred to post-launch |
| Message Search | Full-text search requires MongoDB Atlas Search or ElasticSearch; free-tier limitation |
| Push Notifications (Mobile) | Requires Service Workers and FCM; beyond browser notification scope in v1.0 |
| User Blocking / Reporting | Requires moderation infrastructure; v1.2 candidate |
| Custom Emoji / Stickers | Out of scope for developer-centric v1.0 audience |
| End-to-End Encryption | Requires key exchange protocol (e.g., Signal Protocol); significant complexity; future milestone |

---

## 7. Success Metrics

### 7.1 Engagement Metrics (Post-Launch, 30-Day Baseline)

| Metric | Target |
|---|---|
| Daily Active Users (DAU) | ≥ 50 DAU within 30 days of launch |
| Messages Sent Per Day | ≥ 500 messages/day by Day 30 |
| User Retention (Day 7) | ≥ 40% of registered users return within 7 days |
| @PingBot Query Volume | ≥ 100 bot queries per week (measures AI feature adoption) |
| OTR Mode Usage | ≥ 10% of DM sessions have OTR toggled on (measures privacy feature resonance) |

### 7.2 Performance Metrics (Technical Baseline)

| Metric | Target |
|---|---|
| WebSocket P95 Latency | < 120ms round-trip |
| Page Load (First Contentful Paint) | < 1.8s on 4G mobile |
| Server Error Rate | < 0.5% of all API and WebSocket events |
| MongoDB Atlas Storage Utilization | < 400 MB at 90-day mark (within 512 MB free-tier limit) |
| Zero Downtime Events (30 days) | ≤ 2 cold-start induced connection drops |

### 7.3 Qualitative Success Signals

- Developer users are actively sharing code snippets using Markdown fences within 14 days of launch.
- @PingBot is referenced in Global Chat by multiple users without prompting.
- Zero reported data exposure incidents in v1.0 lifecycle.
- At least 3 unsolicited user feedback submissions praising UI quality or WPM indicator novelty.

---

## Appendix

### A. Open Questions for Engineering Review

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Which AI provider should power @PingBot — Gemini Flash or Groq Llama 3? Rate limit and token quota comparison needed. | Backend Lead | Before Sprint 2 |
| 2 | Should OTR mode be indicated to the recipient, or silently applied by the sender? Privacy vs. consent trade-off. | PM + UX | Before Sprint 1 |
| 3 | What is the reconnection strategy for WebSocket on Render.com cold starts? Exponential backoff with max 5 retries proposed. | Backend Lead | Sprint 1 |
| 4 | Should `react-markdown` + `remark-gfm` be added to the client bundle? Current gzip impact estimated at ~18 kB. | Frontend Lead | Sprint 1 |

### B. Glossary

| Term | Definition |
|---|---|
| WebSocket | Persistent, bidirectional TCP connection between client and server. Used for all real-time chat events. |
| OTR (Off-the-Record) | A chat mode where messages are delivered via WebSocket but not persisted to the database. |
| WPM (Words Per Minute) | Real-time typing speed metric calculated from keystroke cadence and broadcast as a presence signal. |
| @PingBot | An in-chat AI assistant triggered by the `@PingBot` mention prefix. Powered by a free-tier AI API. |
| Glassmorphism | A UI design style using frosted-glass translucency, backdrop blurs, and gradient surface layers. |
| broadcastUserList | Server-side function that queries MongoDB for all registered users, injects online status, and pushes as `userList` event to all connected WebSocket clients. |
