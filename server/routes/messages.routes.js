import express from 'express';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';

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

// REST Endpoint: Get All Historical Chats for a user (queries Message & Conversation DB)
router.get('/chats/history', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'username query parameter is required.' });
    }
    const lowerUser = username.trim().toLowerCase();

    // 1. Find all distinct private messages involving user
    const messages = await Message.find({
      type: 'private_chat',
      $or: [
        { username: new RegExp(`^${lowerUser}$`, 'i') },
        { recipient: new RegExp(`^${lowerUser}$`, 'i') }
      ]
    })
      .sort({ timestamp: -1 })
      .lean();

    const peerMap = new Map();

    messages.forEach(msg => {
      const sender = (msg.username || '').toLowerCase();
      const recipient = (msg.recipient || '').toLowerCase();
      const peer = sender === lowerUser ? recipient : sender;

      if (peer && peer !== lowerUser && !peerMap.has(peer)) {
        peerMap.set(peer, {
          partner: peer,
          lastMessage: msg.message || '',
          lastMessageSender: msg.username,
          lastMessageAt: msg.timestamp,
          unreadCount: 0
        });
      }
    });

    // 2. Combine with Conversation records for unread count and latest timestamps
    const conversations = await Conversation.find({
      participants: lowerUser
    }).lean();

    conversations.forEach(c => {
      const partner = c.participants.find(p => p !== lowerUser);
      if (partner) {
        const unread = c.unreadCount instanceof Map
          ? (c.unreadCount.get(lowerUser) || 0)
          : (c.unreadCount?.[lowerUser] || 0);

        if (peerMap.has(partner)) {
          const existing = peerMap.get(partner);
          existing.unreadCount = unread;
          if (new Date(c.lastMessageAt) > new Date(existing.lastMessageAt)) {
            existing.lastMessage = c.lastMessage;
            existing.lastMessageSender = c.lastMessageSender;
            existing.lastMessageAt = c.lastMessageAt;
          }
        } else {
          peerMap.set(partner, {
            partner,
            lastMessage: c.lastMessage,
            lastMessageSender: c.lastMessageSender,
            lastMessageAt: c.lastMessageAt,
            unreadCount: unread
          });
        }
      }
    });

    // 3. Fetch User profiles for all peers
    const peerNames = Array.from(peerMap.keys());
    const userProfiles = await User.find({
      username: { $in: peerNames.map(p => new RegExp(`^${p}$`, 'i')) }
    }, 'username bio status avatarColor avatarUrl isOnline lastSeen').lean();

    const profileMap = new Map();
    userProfiles.forEach(u => {
      profileMap.set(u.username.toLowerCase(), u);
    });

    // 4. Assemble output list sorted by lastMessageAt descending
    const chatHistory = Array.from(peerMap.values()).map(item => {
      const profile = profileMap.get(item.partner.toLowerCase()) || {};
      return {
        partner: profile.username || item.partner,
        username: profile.username || item.partner,
        bio: profile.bio || '',
        status: profile.status || '',
        avatarColor: profile.avatarColor || '#6366f1',
        avatarUrl: profile.avatarUrl || '',
        isOnline: !!profile.isOnline,
        lastSeen: profile.lastSeen,
        lastMessage: item.lastMessage,
        lastMessageSender: item.lastMessageSender,
        lastMessageAt: item.lastMessageAt,
        unreadCount: item.unreadCount || 0
      };
    });

    chatHistory.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json({ success: true, chats: chatHistory });
  } catch (err) {
    console.error('Fetch chats history error:', err);
    res.status(500).json({ error: 'Server error fetching chat history.' });
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
