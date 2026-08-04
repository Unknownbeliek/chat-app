import { Message } from '../models/Message.js';

export async function sendInitialHistory(ws) {
  try {
    const globalHistory = await Message.find({ type: 'global_chat' })
      .sort({ timestamp: 1 })
      .limit(150)
      .lean();

    const formattedHistory = globalHistory.map(msg => ({
      type: 'global_chat',
      sender: msg.username,
      message: msg.message,
      timestamp: new Date(msg.timestamp).toISOString()
    }));

    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'history', data: formattedHistory }));
    }
  } catch (err) {
    console.error('Error fetching initial global history:', err);
  }
}

export async function handleHistory(ws, data, currentUsername) {
  if (data.type === 'get_private_history') {
    const { partner } = data;
    if (!partner || !currentUsername) return;

    try {
      const history = await Message.find({
        type: 'private_chat',
        $or: [
          { username: new RegExp(`^${currentUsername}$`, 'i'), recipient: new RegExp(`^${partner.trim()}$`, 'i') },
          { username: new RegExp(`^${partner.trim()}$`, 'i'), recipient: new RegExp(`^${currentUsername}$`, 'i') }
        ]
      })
        .sort({ timestamp: 1 })
        .limit(300)
        .lean();

      const formattedHistory = history.map(msg => ({
        type: 'private_chat',
        sender: msg.username,
        recipient: msg.recipient,
        message: msg.message,
        status: msg.status || 'sent',
        timestamp: new Date(msg.timestamp).toISOString()
      }));

      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'private_history',
          partner: partner.trim(),
          data: formattedHistory
        }));
      }
    } catch (err) {
      console.error('Error loading private history:', err);
    }
  } else if (data.type === 'load_older_history') {
    const { oldestTimestamp, recipient } = data;
    if (!oldestTimestamp) return;

    try {
      const cursorDate = new Date(oldestTimestamp);
      let query = { timestamp: { $lt: cursorDate } };

      if (recipient && recipient !== 'Global Chat') {
        query.type = 'private_chat';
        query.$or = [
          { username: new RegExp(`^${currentUsername}$`, 'i'), recipient: new RegExp(`^${recipient.trim()}$`, 'i') },
          { username: new RegExp(`^${recipient.trim()}$`, 'i'), recipient: new RegExp(`^${currentUsername}$`, 'i') }
        ];
      } else {
        query.type = 'global_chat';
      }

      const olderMessages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(50)
        .lean();

      olderMessages.reverse();

      const formattedHistory = olderMessages.map(msg => ({
        type: msg.type || (recipient && recipient !== 'Global Chat' ? 'private_chat' : 'global_chat'),
        sender: msg.username,
        recipient: msg.recipient,
        message: msg.message,
        timestamp: new Date(msg.timestamp).toISOString()
      }));

      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'older_history',
          recipient: recipient || 'Global Chat',
          data: formattedHistory,
          hasMore: olderMessages.length === 50
        }));
      }
    } catch (err) {
      console.error('Error loading older history:', err);
    }
  }
}
