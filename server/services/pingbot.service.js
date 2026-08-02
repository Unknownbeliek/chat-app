import { broadcast } from './broadcast.service.js';

export async function handlePingBotQuery(query, channelOrUser, requestor, isGlobal, activeUsers) {
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
    } else if (activeUsers) {
      const user = activeUsers.get(requestor.toLowerCase());
      if (user && user.ws.readyState === 1) {
        user.ws.send(JSON.stringify(botMessageObj));
      }
    }
  }, 400);
}
