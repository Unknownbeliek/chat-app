import { User } from '../models/User.js';

let wssInstance = null;
let activeUsersRef = null;

export function initBroadcastService(wss, activeUsersMap) {
  wssInstance = wss;
  activeUsersRef = activeUsersMap;
}

export function broadcast(data) {
  if (!wssInstance) return;
  const payload = JSON.stringify(data);
  wssInstance.clients.forEach((clientWs) => {
    if (clientWs.readyState === 1) { // WebSocket.OPEN
      clientWs.send(payload);
    }
  });
}

export async function broadcastUserList() {
  if (!activeUsersRef) return;
  try {
    const allDbUsers = await User.find({}, 'username bio status avatarColor').lean();
    const onlineKeys = Array.from(activeUsersRef.keys());

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
      onlineCount: activeUsersRef.size
    });
  } catch (err) {
    console.error('Error broadcasting user list:', err);
  }
}
