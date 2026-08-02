import express from 'express';
import { Message } from '../models/Message.js';

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

export default router;
