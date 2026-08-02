import { activeUsers } from '../services/activeUsers.service.js';
import { broadcastUserList } from '../services/broadcast.service.js';

export async function handleRegister(ws, data) {
  if (!data.username) return null;
  const currentUsername = data.username.trim();
  const lowerKey = currentUsername.toLowerCase();

  activeUsers.set(lowerKey, {
    ws,
    originalName: currentUsername
  });

  await broadcastUserList();
  return currentUsername;
}

export async function handleDisconnect(ws, currentUsername) {
  if (currentUsername) {
    const lowerKey = currentUsername.toLowerCase();
    const existing = activeUsers.get(lowerKey);
    if (existing && existing.ws === ws) {
      activeUsers.delete(lowerKey);
      await broadcastUserList();
    }
  }
}
