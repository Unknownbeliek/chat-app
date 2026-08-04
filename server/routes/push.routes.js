import express from 'express';
import { PushSubscription } from '../models/PushSubscription.js';

const router = express.Router();

// GET VAPID Public Key
router.get('/vapid-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  res.json({ vapidPublicKey: publicKey });
});

// POST Subscribe to Push Notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { username, subscription } = req.body;
    if (!username || !subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Username and subscription object required' });
    }

    const { endpoint, keys } = subscription;

    // Upsert subscription for user/endpoint
    const updatedSub = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        username: username.toLowerCase().trim(),
        endpoint,
        keys,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, subscription: updatedSub });
  } catch (err) {
    console.error('Error saving push subscription:', err);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
});

// POST Unsubscribe from Push Notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { username, endpoint } = req.body;
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint });
    } else if (username) {
      await PushSubscription.deleteMany({ username: username.toLowerCase().trim() });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing push subscription:', err);
    res.status(500).json({ error: 'Failed to remove push subscription' });
  }
});

export default router;
