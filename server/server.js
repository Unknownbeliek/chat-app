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
  bio: { type: String, default: "Hey there! I am using ping." },
  status: { type: String, default: "Available" },
  location: { type: String, default: "" },
  avatarColor: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  username: String,
  recipient: String,
  message: String,
  type: { type: String, enum: ['global_chat', 'private_chat', 'bot_response'], default: 'global_chat' },
  isOffTheRecord: { type: Boolean, default: false },
  isBotResponse: { type: Boolean, default: false },
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

    res.json({
      success: true,
      username: user.username,
      bio: user.bio || '',
      status: user.status || '',
      location: user.location || '',
      avatarColor: user.avatarColor || ''
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// REST Endpoint: Get All Registered Users with Online Status (Req 1 & Req 2)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username bio status location avatarColor createdAt').lean();
    const onlineList = Array.from(activeUsers.values()).map(u => u.originalName.toLowerCase());

    const result = users.map(u => ({
      username: u.username,
      bio: u.bio || 'Hey there! I am using ping.',
      status: u.status || 'Available',
      location: u.location || '',
      avatarColor: u.avatarColor || '',
      createdAt: u.createdAt,
      isOnline: onlineList.includes(u.username.toLowerCase())
    }));

    res.json({
      success: true,
      users: result,
      onlineCount: activeUsers.size
    });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// REST Endpoint: Get Profile Details (Req 5)
app.get('/api/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: new RegExp(`^${username.trim()}$`, 'i') }, 'username bio status location avatarColor createdAt').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const isOnline = activeUsers.has(user.username.toLowerCase());
    res.json({
      success: true,
      user: {
        ...user,
        isOnline
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// REST Endpoint: Update User Profile (Req 5)
app.put('/api/profile', async (req, res) => {
  try {
    const { username, bio, status, location, avatarColor } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (bio !== undefined) user.bio = bio.trim();
    if (status !== undefined) user.status = status.trim();
    if (location !== undefined) user.location = location.trim();
    if (avatarColor !== undefined) user.avatarColor = avatarColor.trim();

    await user.save();

    res.json({
      success: true,
      user: {
        username: user.username,
        bio: user.bio,
        status: user.status,
        location: user.location,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// REST Endpoint: Get 1-to-1 Private Chat History (Req 3)
app.get('/api/messages/private', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both user1 and user2 query parameters are required.' });
    }

    const u1 = user1.trim();
    const u2 = user2.trim();

    const history = await Message.find({
      type: 'private_chat',
      $or: [
        { username: new RegExp(`^${u1}$`, 'i'), recipient: new RegExp(`^${u2}$`, 'i') },
        { username: new RegExp(`^${u2}$`, 'i'), recipient: new RegExp(`^${u1}$`, 'i') }
      ]
    })
      .sort({ timestamp: 1 })
      .limit(100)
      .lean();

    const formattedHistory = history.map(msg => ({
      type: 'private_chat',
      sender: msg.username,
      recipient: msg.recipient,
      message: msg.message,
      timestamp: new Date(msg.timestamp).toISOString()
    }));

    res.json({ success: true, partner: u2, history: formattedHistory });
  } catch (err) {
    console.error('Fetch private history error:', err);
    res.status(500).json({ error: 'Server error fetching private history.' });
  }
});

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); 

// Map tracking active users by lowercase username -> { ws, originalName }
const activeUsers = new Map();

// Helper to broadcast payload to all connected WebSocket clients
function broadcast(data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((clientWs) => {
    if (clientWs.readyState === 1) { // WebSocket.OPEN
      clientWs.send(payload); 
    }
  });
}

// Helper to broadcast full user list & online status to all clients
async function broadcastUserList() {
  try {
    const allDbUsers = await User.find({}, 'username bio status avatarColor').lean();
    const onlineKeys = Array.from(activeUsers.keys());

    const usersData = allDbUsers.map(u => ({
      username: u.username,
      bio: u.bio || '',
      status: u.status || '',
      avatarColor: u.avatarColor || '',
      isOnline: onlineKeys.includes(u.username.toLowerCase())
    }));

    broadcast({
      type: 'userList',
      users: usersData,
      onlineCount: activeUsers.size
    });
  } catch (err) {
    console.error('Error broadcasting user list:', err);
  }
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
      timestamp: new Date(msg.timestamp).toISOString()
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
        
        // Broadcast updated online users list
        await broadcastUserList();
      }
      
      // 2. Fetch Private Chat History via WebSocket (Req 3)
      else if (data.type === 'get_private_history') {
        const { partner } = data;
        if (!partner || !currentUsername) return;

        const history = await Message.find({
          type: 'private_chat',
          $or: [
            { username: new RegExp(`^${currentUsername}$`, 'i'), recipient: new RegExp(`^${partner.trim()}$`, 'i') },
            { username: new RegExp(`^${partner.trim()}$`, 'i'), recipient: new RegExp(`^${currentUsername}$`, 'i') }
          ]
        })
          .sort({ timestamp: 1 })
          .limit(100)
          .lean();

        const formattedHistory = history.map(msg => ({
          type: 'private_chat',
          sender: msg.username,
          recipient: msg.recipient,
          message: msg.message,
          timestamp: new Date(msg.timestamp).toISOString()
        }));

        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'private_history',
            partner: partner.trim(),
            data: formattedHistory
          }));
        }
      }

      // 3. Typing WPM Presence Signal
      else if (data.type === 'typing_wpm') {
        const { recipient, wpm } = data;
        const senderName = currentUsername || data.sender;
        if (!senderName) return;

        const payload = JSON.stringify({
          type: 'typing_wpm',
          sender: senderName,
          recipient,
          wpm: wpm || 0
        });

        if (recipient && recipient !== "Global Chat") {
          const recipientUser = activeUsers.get(recipient.toLowerCase());
          if (recipientUser && recipientUser.ws.readyState === 1) {
            recipientUser.ws.send(payload);
          }
        } else {
          broadcast({
            type: 'typing_wpm',
            sender: senderName,
            wpm: wpm || 0
          });
        }
      }

      // 4. Private 1-to-1 Chat (with OTR Mode support)
      else if (data.type === 'private_chat') {
        const { recipient, message: text, isOffTheRecord } = data;
        if (!recipient || !text) return;

        const senderName = currentUsername || data.sender || 'Anonymous';
        const targetKey = recipient.toLowerCase();
        const recipientUser = activeUsers.get(targetKey);
        const isoNow = new Date().toISOString();

        const payloadObj = {
          type: 'private_chat',
          sender: senderName,
          recipient: recipient,
          message: text,
          isOffTheRecord: !!isOffTheRecord,
          timestamp: isoNow
        };
        const payloadStr = JSON.stringify(payloadObj);

        // Save Private Message to MongoDB ONLY IF NOT Off-the-Record (OTR)
        if (!isOffTheRecord) {
          try {
            const newDbMsg = new Message({
              username: senderName,
              recipient: recipient,
              message: text,
              type: 'private_chat',
              isOffTheRecord: false,
              timestamp: new Date()
            });
            await newDbMsg.save();
          } catch (err) {
            console.error('Error saving private message:', err);
          }
        }

        // Send to Recipient if connected
        if (recipientUser && recipientUser.ws.readyState === 1) {
          recipientUser.ws.send(payloadStr);
        }

        // Send confirmation back to Sender if connected & not sending to self
        if (ws.readyState === 1 && targetKey !== (currentUsername ? currentUsername.toLowerCase() : '')) {
          ws.send(payloadStr);
        }

        // Check for @PingBot mention in Private Chat
        if (text.includes('@PingBot')) {
          const query = text.replace(/@PingBot/gi, '').trim();
          handlePingBotQuery(query, recipient, senderName, false);
        }
      }
      
      // 5. Global Public Chat (with @PingBot support)
      else if (data.type === 'global_chat') {
        const senderName = currentUsername || data.sender || 'Anonymous';
        const isoNow = new Date().toISOString();

        try {
          const newDbMessage = new Message({
            username: senderName,
            message: data.message, 
            type: 'global_chat',
            timestamp: new Date()
          });
          await newDbMessage.save();
        } catch (err) {
          console.error('Error saving global message:', err);
        }

        broadcast({
          type: 'global_chat',
          sender: senderName,
          message: data.message, 
          timestamp: isoNow
        });

        // Check for @PingBot mention in Global Chat
        if (data.message && data.message.includes('@PingBot')) {
          const query = data.message.replace(/@PingBot/gi, '').trim();
          handlePingBotQuery(query, "Global Chat", senderName, true);
        }
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  // Handle Disconnect
  ws.on('close', async () => {
    if (currentUsername) {
      activeUsers.delete(currentUsername.toLowerCase());
      await broadcastUserList();
    }
    console.log('WebSocket Client Disconnected');
  });
});

// Helper for @PingBot AI Query handling
async function handlePingBotQuery(query, channelOrUser, requestor, isGlobal) {
  setTimeout(async () => {
    let botAnswer = "";
    const cleanQuery = query.toLowerCase();

    // Check for Gemini API key environment variable
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are @PingBot, an AI coding & chat assistant in the Ping app. Answer concise and helpful in Markdown: ${query}` }] }]
          })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          botAnswer = data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.error("Gemini API error:", err);
      }
    }

    // Fallback smart responses if API key is not configured or fails
    if (!botAnswer) {
      if (cleanQuery.includes("hello") || cleanQuery.includes("hi")) {
        botAnswer = `Hello @${requestor}! 🤖 I'm **@PingBot**, your AI chat assistant. You can ask me coding questions, math problems, or app info!`;
      } else if (cleanQuery.includes("websocket") || cleanQuery.includes("socket")) {
        botAnswer = `⚡ **WebSockets** are full-duplex, bidirectional communication channels over a single TCP connection. In **Ping**, WebSockets power real-time messages, presence indicators, and live WPM speeds!`;
      } else if (cleanQuery.includes("wpm") || cleanQuery.includes("typing")) {
        botAnswer = `⌨️ **WPM Typing Indicator** measures your typing speed in words-per-minute (1 word = 5 characters) over a 10-second rolling window and broadcasts it via WebSocket!`;
      } else if (cleanQuery.includes("otr") || cleanQuery.includes("off the record")) {
        botAnswer = `🕵️ **Off-the-Record (OTR) Mode** routes messages strictly through the WebSocket connection without saving them to the MongoDB database. Perfect for ephemeral chats!`;
      } else if (cleanQuery.includes("help") || cleanQuery.includes("code")) {
        botAnswer = "```javascript\n// Example Code Snippet\nconst pingBot = {\n  name: \"@PingBot\",\n  status: \"Online ⚡\",\n  features: [\"Markdown\", \"Syntax Highlighting\", \"OTR Mode\", \"Live WPM\"]\n};\nconsole.log(pingBot);\n```\nAsk me anything by typing `@PingBot <your question>`!";
      } else {
        botAnswer = `🤖 **@PingBot**: Thanks for your question about "*${query}*"! I am fully integrated into **Ping** to assist you with Markdown code formatting, real-time socket questions, and app guidance.`;
      }
    }

    const botMessageObj = {
      type: isGlobal ? 'global_chat' : 'private_chat',
      sender: 'PingBot',
      recipient: isGlobal ? undefined : requestor,
      message: botAnswer,
      isBotResponse: true,
      timestamp: new Date().toISOString()
    };

    if (isGlobal) {
      broadcast(botMessageObj);
    } else {
      const user = activeUsers.get(requestor.toLowerCase());
      if (user && user.ws.readyState === 1) {
        user.ws.send(JSON.stringify(botMessageObj));
      }
    }
  }, 400);
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});