import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';

const PORT = process.env.PORT ?? 9000;
const app = express();

// Middleware
app.use(cors({
  origin: '*'
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.log('MongoDB connection error:', err));

// Database Schemas & Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  username: String,
  recipient: String,
  message: String,
  type: { type: String, default: 'global_chat' },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// REST Auth Endpoints
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.trim().length < 2 || password.trim().length < 4) {
      return res.status(400).json({ error: 'Username (min 2 chars) and password (min 4 chars) are required.' });
    }

    const cleanUsername = username.trim();
    const existingUser = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username: cleanUsername, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, username: newUser.username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please try again.' });
    }

    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); 

// Map tracking active users by lowercase username -> { ws, originalName }
const activeUsers = new Map();

// Helper to broadcast to all connected clients
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((clientWs) => {
    if (clientWs.readyState === 1) { // WebSocket.OPEN
      clientWs.send(payload); 
    }
  });
}

// WebSocket Connection Logic
wss.on('connection', async (ws) => {
  let currentUsername = null;
  console.log('WebSocket Client Connected');

  // Load Global Chat history from DB on connect
  try {
    const globalHistory = await Message.find({ type: 'global_chat' })
      .sort({ timestamp: 1 })
      .limit(50)
      .lean();

    const formattedHistory = globalHistory.map(msg => ({
      type: 'global_chat',
      sender: msg.username,
      message: msg.message,
      timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    // Send history to newly connected user
    ws.send(JSON.stringify({ type: 'history', data: formattedHistory }));
  } catch (err) {
    console.error('Error fetching History:', err);
  }

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      // 1. User Registration (Login to WebSocket stream)
      if (data.type === 'register') {
        currentUsername = data.username.trim();
        const lowerKey = currentUsername.toLowerCase();
        
        activeUsers.set(lowerKey, {
          ws,
          originalName: currentUsername
        });
        
        // Broadcast online users list
        const onlineList = Array.from(activeUsers.values()).map(u => u.originalName);
        broadcast({
          type: 'userList',
          users: onlineList
        });
      }
      
      // 2. Private 1-to-1 Chat
      else if (data.type === 'private_chat') {
        const { recipient, message: text } = data;
        if (!recipient || !text) return;

        const senderName = currentUsername || data.sender || 'Anonymous';
        const targetKey = recipient.toLowerCase();
        const recipientUser = activeUsers.get(targetKey);

        const payloadObj = {
          type: 'private_chat',
          sender: senderName,
          recipient: recipient,
          message: text, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const payloadStr = JSON.stringify(payloadObj);

        // Save Private Message to MongoDB for history persistence
        try {
          const newDbMsg = new Message({
            username: senderName,
            recipient: recipient,
            message: text,
            type: 'private_chat'
          });
          await newDbMsg.save();
        } catch (err) {
          console.error('Error saving private message:', err);
        }

        // Send to Recipient if connected
        if (recipientUser && recipientUser.ws.readyState === ws.OPEN) {
          recipientUser.ws.send(payloadStr);
        }

        // Send confirmation back to Sender if connected & not sending to self
        if (ws.readyState === ws.OPEN && targetKey !== (currentUsername ? currentUsername.toLowerCase() : '')) {
          ws.send(payloadStr);
        }
      }
      
      // 3. Global Public Chat
      else if (data.type === 'global_chat') {
        const senderName = currentUsername || data.sender || 'Anonymous';
        try {
          const newDbMessage = new Message({
            username: senderName,
            message: data.message, 
            type: 'global_chat'
          });
          await newDbMessage.save();
        } catch (err) {
          console.error('Error saving global message:', err);
        }

        broadcast({
          type: 'global_chat',
          sender: senderName,
          message: data.message, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  // Handle Disconnect
  ws.on('close', () => {
    if (currentUsername) {
      activeUsers.delete(currentUsername.toLowerCase());
      const onlineList = Array.from(activeUsers.values()).map(u => u.originalName);
      broadcast({
        type: 'userList',
        users: onlineList
      });
    }
    console.log('WebSocket Client Disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});