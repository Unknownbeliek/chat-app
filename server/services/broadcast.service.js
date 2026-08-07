import webpush from 'web-push';
import { User } from '../models/User.js';
import { PushSubscription } from '../models/PushSubscription.js';

let wssInstance = null;
let activeUsersRef = null;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@pingchatapp.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('Web Push VAPID initialized successfully');
  } catch (err) {
    console.error('Failed to set VAPID details:', err);
  }
}

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
    const allDbUsers = await User.find({}, 'username bio status avatarColor avatarUrl lastSeen').lean();
    // Build a Set of usernames that have an active WebSocket connection
    const onlineUserSet = new Set(Array.from(activeUsersRef.keys()));
    const usersData = allDbUsers.map(u => ({
      username: u.username,
      bio: u.bio || '',
      status: u.status || '',
      avatarColor: u.avatarColor || '',
      avatarUrl: u.avatarUrl || '',
      // PingBot is always online; otherwise rely on the in‑memory Set
      isOnline: u.username.toLowerCase() === 'pingbot' ? true : onlineUserSet.has(u.username.toLowerCase()),
      lastSeen: u.lastSeen ? new Date(u.lastSeen).toISOString() : null
    }));

    if (!usersData.some(u => u.username.toLowerCase() === 'pingbot')) {
      usersData.unshift({
        username: 'PingBot',
        bio: 'AI Assistant & Coding Companion 🤖',
        status: 'Online ⚡',
        avatarColor: '#8b5cf6',
        avatarUrl: process.env.PINGBOT_AVATAR_URL || 'https://api.dicebear.com/7.x/bottts/svg?seed=PingBot',
        isOnline: true,
        lastSeen: null
      });
    }

    broadcast({
      type: 'userList',
      users: usersData,
      onlineCount: activeUsersRef.size
    });
  } catch (err) {
    console.error('Error broadcasting user list:', err);
  }
}

export async function sendPushToOfflineUser(recipientUsername, payloadData) {
  try {
    if (!recipientUsername) return;
    const usernameClean = recipientUsername.toLowerCase().trim();

    // Check if user has an active connected socket
    const isOnline = activeUsersRef && activeUsersRef.has(usernameClean);
    if (isOnline) {
      return; // Skip push notification if user is online via socket
    }

    const subscriptions = await PushSubscription.find({ username: usernameClean });
    if (!subscriptions || subscriptions.length === 0) return;

    const payloadStr = JSON.stringify(payloadData);

    for (const subRecord of subscriptions) {
      const pushSubscription = {
        endpoint: subRecord.endpoint,
        keys: subRecord.keys
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadStr);
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Deleting expired push subscription for ${usernameClean}`);
          await PushSubscription.deleteOne({ _id: subRecord._id });
        } else {
          console.error(`Error sending push to ${usernameClean}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('sendPushToOfflineUser error:', err);
  }
}
