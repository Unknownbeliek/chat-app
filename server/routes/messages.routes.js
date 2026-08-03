import express from 'express';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

const router = express.Router();

// REST Endpoint: Get 1-to-1 Private Chat History
router.get('/messages/private', async (req, res) => {
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
      .limit(200)
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

// REST Endpoint: Get Active Chats for a user (conversations with at least 1 message)
router.get('/chats/active', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'username query parameter is required.' });
    }
    const lowerUser = username.trim().toLowerCase();

    const conversations = await Conversation.find({
      participants: lowerUser
    })
      .sort({ lastMessageAt: -1 })
      .lean();

    const result = conversations.map(c => {
      const partner = c.participants.find(p => p !== lowerUser) || lowerUser;
      const unread = c.unreadCount instanceof Map
        ? (c.unreadCount.get(lowerUser) || 0)
        : (c.unreadCount?.[lowerUser] || 0);
      return {
        partner,
        lastMessage: c.lastMessage,
        lastMessageSender: c.lastMessageSender,
        lastMessageAt: c.lastMessageAt,
        unreadCount: unread
      };
    });

    res.json({ success: true, conversations: result });
  } catch (err) {
    console.error('Fetch active chats error:', err);
    res.status(500).json({ error: 'Server error fetching active chats.' });
  }
});

// REST Endpoint: Mark conversation as read
router.post('/chats/read', async (req, res) => {
  try {
    const { username, partner } = req.body;
    if (!username || !partner) {
      return res.status(400).json({ error: 'username and partner are required.' });
    }
    const sortedParticipants = [username.trim().toLowerCase(), partner.trim().toLowerCase()].sort();
    await Conversation.findOneAndUpdate(
      { participants: sortedParticipants },
      { $set: { [`unreadCount.${username.trim().toLowerCase()}`]: 0 } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error marking chat as read.' });
  }
});

export default router;
