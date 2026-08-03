import { User } from '../models/User.js';
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
      { username: new RegExp(`^${lowerKey}$`, 'i') },
      { isOnline: true, lastSeen: new Date() }
    );
  } catch (err) {
    console.error('Error updating user online status:', err);
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
          { username: new RegExp(`^${lowerKey}$`, 'i') },
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
