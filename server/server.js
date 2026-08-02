import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

import { connectDB } from './config/db.js';
import { corsConfig } from './middleware/corsConfig.js';
import { activeUsers } from './services/activeUsers.service.js';
import { initBroadcastService } from './services/broadcast.service.js';

// REST Routes
import authRouter from './routes/auth.routes.js';
import usersRouter from './routes/users.routes.js';
import messagesRouter from './routes/messages.routes.js';

// WebSocket Handlers
import { handleRegister, handleDisconnect } from './handlers/register.handler.js';
import { handleChat } from './handlers/chat.handler.js';
import { handleHistory, sendInitialHistory } from './handlers/history.handler.js';
import { handleTyping } from './handlers/typing.handler.js';
import { handleCall } from './handlers/call.handler.js';

const PORT = process.env.PORT ?? 9000;
const app = express();

// Connect MongoDB
await connectDB();

// Express Middleware & API Routes
app.use(corsConfig);
app.use(express.json());
app.use('/api', authRouter);
app.use('/api', usersRouter);
app.use('/api', messagesRouter);

// HTTP & WebSocket Servers
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initialize Broadcast Service with WSS and activeUsers instance
initBroadcastService(wss, activeUsers);

// WebSocket Central Router
wss.on('connection', async (ws) => {
  let currentUsername = null;
  console.log('WebSocket Client Connected');

  // Send initial global history on connect
  await sendInitialHistory(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'register') {
        currentUsername = await handleRegister(ws, data);
      } else if (['call_invite', 'call_accepted', 'call_rejected', 'call_ended', 'sdp_offer', 'sdp_answer', 'ice_candidate'].includes(data.type)) {
        handleCall(ws, data, currentUsername);
      } else if (data.type === 'get_private_history' || data.type === 'load_older_history') {
        await handleHistory(ws, data, currentUsername);
      } else if (data.type === 'typing_wpm') {
        handleTyping(ws, data, currentUsername);
      } else {
        await handleChat(ws, data, currentUsername);
      }
    } catch (err) {
      console.error('WS Message Handler Error:', err);
    }
  });

  ws.on('close', async () => {
    await handleDisconnect(ws, currentUsername);
    console.log('WebSocket Client Disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});