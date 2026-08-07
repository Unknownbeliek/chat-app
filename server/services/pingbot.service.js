import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { broadcast } from './broadcast.service.js';

export async function handlePingBotQuery(query, channelOrUser, requestor, isGlobal, activeUsers, senderWs) {
  // Emit a thinking indicator to the client immediately
  if (isGlobal) {
    broadcast({ type: 'pingbot_thinking', sender: 'PingBot', recipient: undefined });
  } else if (senderWs && senderWs.readyState === 1) {
    senderWs.send(JSON.stringify({ type: 'pingbot_thinking', sender: 'PingBot' }));
  }

  setTimeout(async () => {
    let botAnswer = "";
    const cleanQuery = (query || '').toLowerCase().trim();

    // 1. Try Gemini Generative AI API if GEMINI_API_KEY environment variable is configured
    if (process.env.GEMINI_API_KEY) {
      const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-flash-latest'];
      for (const model of modelsToTry) {
        if (botAnswer) break;
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `You are @PingBot, an intelligent AI assistant built into Ping (a modern WebRTC & WebSocket chat app). Answer concisely and helpful in Markdown with emojis: ${query}`
                }]
              }]
            })
          });
          const data = await response.json();
          if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            botAnswer = data.candidates[0].content.parts[0].text.trim();
          } else if (data.error) {
            console.warn(`Gemini API Notice (${model}): [${data.error.code}] ${data.error.message}`);
          }
        } catch (err) {
          console.error(`Gemini API fetch error (${model}):`, err);
        }
      }
    }

    // 2. Try Free Real AI Engine (Pollinations LLM API) for dynamic real-time AI responses
    if (!botAnswer && process.env.NODE_ENV !== 'test') {
      try {
        const sysPrompt = "You are @PingBot, a friendly and intelligent AI coding & chat assistant in the Ping app. Answer concisely using clean Markdown with emojis.";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const aiResponse = await fetch(`https://text.pollinations.ai/${encodeURIComponent(query)}?system=${encodeURIComponent(sysPrompt)}`, {
          signal: controller.signal
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (aiResponse && aiResponse.ok) {
          const text = await aiResponse.text().catch(() => null);
          if (text && text.trim().length > 0 && !text.includes("Internal Server Error")) {
            botAnswer = text.trim();
          }
        }
      } catch (aiErr) {
        // Silently fall back to knowledge base on timeout or network error
      }
    }

    // 3. Fallback Knowledge Base if all AI generation services are unreachable
    if (!botAnswer) {
      if (cleanQuery.includes("what is ping") || cleanQuery === "ping" || cleanQuery.includes("about ping")) {
        botAnswer = `🚀 **Ping** is a high-performance, real-time messaging platform crafted with **React, Node.js, WebSockets, and MongoDB**!

### Key Highlights:
- 💬 **Global & 1-on-1 DMs**: Instant real-time messaging with delivered/read receipts.
- 📞 **WebRTC Voice & Video Calls**: Crystal clear P2P calling directly in your browser.
- ⚡ **Live WPM Typing Speed**: Broadcasts real-time typing speed indicators as you type.
- 🕵️ **OTR (Off-the-Record)**: Direct socket routing without database persistence.
- 🤫 **Ephemeral Whispers**: Secret auto-expiring messages with /whisper.
- 🤖 **AI Companion**: That's me! I'm here 24/7 to help you with code and chat.`;
      } else if (cleanQuery.includes("feature") || cleanQuery.includes("capabilities") || cleanQuery.includes("what can you do")) {
        botAnswer = `✨ **Ping Capabilities & Shortcuts**:
- /whisper <user> <message>: Send a secret message that self-destructs after 10s.
- /clear: Instantly clear your active chat screen locally.
- /me <action>: Format custom action messages.
- 📞 **Call Button**: Start high-definition WebRTC video or audio calls.
- 🎨 **Glassmorphic UI**: Theme customized with liquid glass blur & custom avatars.`;
      } else if (cleanQuery.includes("call") || cleanQuery.includes("video") || cleanQuery.includes("voice") || cleanQuery.includes("webrtc")) {
        botAnswer = `📞 **WebRTC Audio & Video Calling** in Ping allows zero-latency P2P communication!
To start a call, open a DM with any user and click the **Phone 📞** or **Video 🎥** icon in the chat header!`;
      } else if (cleanQuery.includes("who made") || cleanQuery.includes("creator") || cleanQuery.includes("author") || cleanQuery.includes("developer")) {
        botAnswer = `🛠️ **Ping** was built with passion using modern web technologies:
- **Frontend**: React 18, Vite, Tailwind CSS & Motion UI
- **Backend**: Node.js, Express, WebSockets (\`ws\`), and MongoDB
- **Real-time Protocol**: Native WebSockets & WebRTC Data Channels`;
      } else if (cleanQuery.includes("hello") || cleanQuery.includes("hi") || cleanQuery.includes("hey")) {
        botAnswer = `Hello @${requestor}! 👋 🤖 I'm **@PingBot**, your AI chat companion. Ask me anything about **Ping**, coding, or tech!`;
      } else if (cleanQuery.includes("websocket") || cleanQuery.includes("socket")) {
        botAnswer = `⚡ **WebSockets** provide full-duplex bidirectional channels over a single TCP connection. In **Ping**, WebSockets deliver sub-millisecond chat messages, live presence, and WPM speeds!`;
      } else if (cleanQuery.includes("wpm") || cleanQuery.includes("typing")) {
        botAnswer = `⌨️ **WPM Typing Indicator** tracks typing speed (words per minute) over a 10s sliding window and displays it live in the chat banner!`;
      } else if (cleanQuery.includes("otr") || cleanQuery.includes("off the record")) {
        botAnswer = `🕵️ **Off-the-Record (OTR) Mode** routes messages strictly through WebSockets without saving to the MongoDB database. Toggle it anytime via the top right lock icon!`;
      } else if (cleanQuery.includes("help") || cleanQuery.includes("code")) {
        botAnswer = "```javascript\n// PingBot Helper Code\nconst pingApp = {\n  status: \"Active ⚡\",\n  features: [\"WebSockets\", \"WebRTC\", \"OTR\", \"Gemini AI\"],\n  ask: (topic) => `@PingBot ${topic}`\n};\nconsole.log(pingApp);\n```\nAsk me any question by messaging me or typing `@PingBot <your question>`!";
      } else {
        botAnswer = `🤖 **@PingBot**: Great question about "*${query}*"!

I am **PingBot**, your AI assistant in **Ping**. You can ask me:
- *"What is Ping?"* — Overview of the application
- *"Features"* — Commands & shortcuts available
- *"WebRTC"* — How calling works
- Or ask any programming question!`;
      }
    }

    const isoNow = new Date().toISOString();
    const botMessageObj = {
      type: isGlobal ? 'global_chat' : 'private_chat',
      sender: 'PingBot',
      recipient: isGlobal ? undefined : requestor,
      message: botAnswer,
      isBotResponse: true,
      status: 'delivered',
      timestamp: isoNow
    };

    // Save PingBot message asynchronously to MongoDB database for history & active chat tracking
    if (isGlobal) {
      Message.create({
        username: 'PingBot',
        message: botAnswer,
        type: 'global_chat',
        timestamp: new Date()
      }).then(savedMsg => {
        if (savedMsg) botMessageObj._id = savedMsg._id.toString();
      }).catch(dbErr => console.error('Error persisting global PingBot message:', dbErr));
    } else if (requestor) {
      Message.create({
        username: 'PingBot',
        recipient: requestor,
        message: botAnswer,
        type: 'private_chat',
        status: 'delivered',
        isOffTheRecord: false,
        timestamp: new Date()
      }).then(savedMsg => {
        if (savedMsg) botMessageObj._id = savedMsg._id.toString();
      }).catch(dbErr => console.error('Error persisting private PingBot message:', dbErr));

      const sortedParticipants = ['pingbot', requestor.toLowerCase()].sort();
      Conversation.findOneAndUpdate(
        { participants: sortedParticipants },
        {
          $set: {
            lastMessage: botAnswer,
            lastMessageSender: 'PingBot',
            lastMessageAt: new Date()
          },
          $setOnInsert: {
            participants: sortedParticipants
          }
        },
        { upsert: true, new: true }
      ).catch(dbErr => console.error('Error updating PingBot conversation:', dbErr));
    }

    if (isGlobal) {
      broadcast(botMessageObj);
    } else {
      let sent = false;
      if (senderWs && senderWs.readyState === 1) {
        senderWs.send(JSON.stringify(botMessageObj));
        sent = true;
      }
      if (!sent && activeUsers && requestor) {
        const user = activeUsers.get(requestor.toLowerCase());
        if (user && user.ws && user.ws.readyState === 1) {
          user.ws.send(JSON.stringify(botMessageObj));
        }
      }
    }
  }, 400);
}

