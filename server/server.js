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
  type: { type: String, default: 'global_chat' },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Create HTTP and WebSocket Server (Defined BEFORE using it!)
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); 

const activeUsers = new Map(); // Tracks who is online

// Helper to broadcast to all connected clients
function broadcast(data) {
  const payload = JSON.stringify(data); // Fixed typo here
  wss.clients.forEach((clientWs) => {
    if (clientWs.readyState === 1) { // WebSocket.OPEN
      clientWs.send(payload); 
    }
  });
}

// SINGLE Consolidated WebSocket Connection Logic
wss.on('connection', async (ws) => {
  let currentUsername = null;
  console.log('WebSocket Client Connected');


  // Load Global Chat history from DB on connect
  try {
    const chatHistory = await Message.find()
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();

    const formattedHistory = chatHistory.map(msg => ({
      type: 'global_chat',
      sender: msg.username,
      message: msg.message,
      timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // Send history only to the newly connected user
    ws.send(JSON.stringify({ type: 'history', data: formattedHistory }));
  } catch (err) {
    console.error('Error fetching History:', err);
  }

  // Handle incoming messages
  ws.on('message', async (message) => {
    const data = JSON.parse(message.toString());

    // 1. User Registration (Login)
    if (data.type === 'register') {
      currentUsername = data.username;
      activeUsers.set(currentUsername, ws);
      
      // Tell everyone the new user list
      broadcast({
        type: 'userList',
        users: Array.from(activeUsers.keys())
      });
    }
    
    // 2. Private 1-to-1 Chat (Not saved to DB for privacy)
    else if (data.type === 'private_chat') {
      const { recipient, message: text } = data;
      const recipientWs = activeUsers.get(recipient);

      const payload = JSON.stringify({
        type: 'private_chat',
        sender: currentUsername,
        recipient: recipient,
        message: text, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Send to recipient
      if (recipientWs && recipientWs.readyState === ws.OPEN) {
        recipientWs.send(payload);
      }
      // Send back to sender so they can see their own message
      if (ws.readyState === ws.OPEN && recipient !== currentUsername) {
        ws.send(payload);
      }
    }
    
    // 3. Global Public Chat
    else if (data.type === 'global_chat') {
      // Save global message to MongoDB
      try {
        const newDbMessage = new Message({
          username: currentUsername || 'Anonymous',
          message: data.message, 
          type: 'global_chat'
        });
        await newDbMessage.save();
      } catch (err) {
        console.error('Error saving message:', err);
      }

      // Broadcast global message to everyone
      broadcast({
        type: 'global_chat',
        sender: currentUsername,
        message: data.message, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  });

  // Handle Disconnect
  ws.on('close', () => {
    if (currentUsername) {
      if(currentUsername){
          activeUsers.delete(currentUsername);
      }
     
      
      // Update everyone's sidebar when someone leaves
      broadcast({
        type: 'userList',
        users: Array.from(activeUsers.keys())
      });
    }
    console.log('WebSocket Client Disconnected');
  });
  try{
    const chatHistory = await Message.find()
    .sort({timestamp:1})
    .limit(50)
    .lean();
    const formattedHistory =chatHistory.map(msg=>({
      type:'global_chat',
      sender:msg.username,
      message:msg.message,
      timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    ws.send(JSON.stringify({ type: 'history', data: formattedHistory }));
  }catch(err){
    console.error('Error Fetching history',err);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});