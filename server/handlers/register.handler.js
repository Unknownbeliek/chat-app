import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { activeUsers } from '../services/activeUsers.service.js';
import { broadcastUserList, broadcast } from '../services/broadcast.service.js';

export async function handleRegister(ws, data) {
  if (!data.username) return null;
  const currentUsername = data.username.trim();
  const lowerKey = currentUsername.toLowerCase();

  activeUsers.set(lowerKey, {
    ws,
    originalName: currentUsername
  });

  // Update DB: set user online
  try {
    await User.findOneAndUpdate(
      { username: lowerKey },
      { isOnline: true, lastSeen: new Date() }
    );
  } catch (err) {
    console.error('Error updating user online status:', err);
  }

  // Flush any undelivered private messages from DB (missed while disconnected)
  try {
    const missedMessages = await Message.find({
      type: 'private_chat',
      recipient: new RegExp(`^${lowerKey}$`, 'i'),
      status: 'sent'
    }).sort({ timestamp: 1 }).lean();

    if (missedMessages.length > 0 && ws.readyState === 1) {
      for (const msg of missedMessages) {
        ws.send(JSON.stringify({
          type: 'private_chat',
          _id: msg._id.toString(),
          sender: msg.username,
          recipient: msg.recipient,
          message: msg.message,
          status: 'delivered',
          replyTo: msg.replyTo || null,
          timestamp: new Date(msg.timestamp).toISOString()
        }));
      }
      // Mark them as delivered in DB
      await Message.updateMany(
        { _id: { $in: missedMessages.map(m => m._id) } },
        { $set: { status: 'delivered' } }
      );
    }
  } catch (err) {
    console.error('Error flushing missed messages:', err);
  }

  // Broadcast updated user list (includes isOnline / lastSeen)
  await broadcastUserList();

  // Emit userStatusChanged to all connected clients
  broadcast({
    type: 'userStatusChanged',
    username: currentUsername,
    isOnline: true,
    lastSeen: new Date().toISOString()
  });

  return currentUsername;
}

export async function handleDisconnect(ws, currentUsername) {
  if (currentUsername) {
    const lowerKey = currentUsername.toLowerCase();
    const existing = activeUsers.get(lowerKey);
    if (existing && existing.ws === ws) {
      activeUsers.delete(lowerKey);

      // Update DB: set user offline with lastSeen timestamp
      const now = new Date();
      try {
        await User.findOneAndUpdate(
          { username: lowerKey },
          { isOnline: false, lastSeen: now }
        );
      } catch (err) {
        console.error('Error updating user offline status:', err);
      }

      await broadcastUserList();

      // Emit userStatusChanged to all connected clients
      broadcast({
        type: 'userStatusChanged',
        username: currentUsername,
        isOnline: false,
        lastSeen: now.toISOString()
      });
    }
  }
}
