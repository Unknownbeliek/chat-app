import { activeUsers } from '../services/activeUsers.service.js';
import { broadcast } from '../services/broadcast.service.js';

export function handleTyping(ws, data, currentUsername) {
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
