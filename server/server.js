import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import cors from 'cors';

const PORT = process.env.PORT ?? 9000;
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-app-name.vercel.app']
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.log('MongoDB connection error:', err));

// Database Schema & Model
const messageSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Express HTTP Server wrapped for WebSocket support
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

// Broadcast online user count
function broadcastUserCount() {
  const count = wsServer.clients.size;
  const data = JSON.stringify({ type: 'userCount', count });
  wsServer.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

// WebSocket Connection Logic
wsServer.on('connection', async (websocket) => {
  broadcastUserCount();
  websocket.on('close', () => broadcastUserCount());

  console.log('WebSocket Client Connected');

  // Load chat history from DB
  try {
    const chatHistory = await Message.find()
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();

    const formattedHistory = chatHistory.map(msg => ({
      username: msg.username,
      message: msg.message,
      timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    websocket.send(
      JSON.stringify({
        type: 'history',
        data: formattedHistory
      })
    );
  } catch (err) {
    console.error('Error fetching History', err);
  }

  // Handle incoming messages
  websocket.on('message', async (data) => {
    const parsedData = JSON.parse(data.toString());

    // 1. Handle Typing Status
    if (parsedData.type === 'typing') {
      wsServer.clients.forEach(client => {
        if (client !== websocket && client.readyState === 1) {
          client.send(
            JSON.stringify({
              type: 'typing',
              username: parsedData.username
            })
          );
        }
      });
      return;
    }

    // 2. Handle Live Chat
    if (parsedData.type === 'chat') {
      try {
        const newDbMessage = new Message({
          username: parsedData.username || 'Anonymous',
          message: parsedData.message
        });
        await newDbMessage.save();
      } catch (err) {
        console.error('Error saving message:', err);
      }

      const broadcastMsg = JSON.stringify({
        type: 'chat',
        username: parsedData.username,
        message: parsedData.message,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      });

      wsServer.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(broadcastMsg);
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});