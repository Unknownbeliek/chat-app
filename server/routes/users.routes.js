import express from 'express';
import { User } from '../models/User.js';
import { activeUsers } from '../services/activeUsers.service.js';

const router = express.Router();

// REST Endpoint: Get All Registered Users with Online Status
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username bio status location avatarColor createdAt').lean();
    const onlineList = Array.from(activeUsers.values()).map(u => u.originalName.toLowerCase());

    const result = users.map(u => ({
      username: u.username,
      bio: u.bio || 'Hey there! I am using ping.',
      status: u.status || 'Available',
      location: u.location || '',
      avatarColor: u.avatarColor || '',
      createdAt: u.createdAt,
      isOnline: onlineList.includes(u.username.toLowerCase())
    }));

    res.json({
      success: true,
      users: result,
      onlineCount: activeUsers.size
    });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Server error fetching users.' });
  }
});

// REST Endpoint: Get Profile Details
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: new RegExp(`^${username.trim()}$`, 'i') }, 'username bio status location avatarColor createdAt').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const isOnline = activeUsers.has(user.username.toLowerCase());
    res.json({
      success: true,
      user: {
        ...user,
        isOnline
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// REST Endpoint: Update User Profile
router.put('/profile', async (req, res) => {
  try {
    const { username, bio, status, location, avatarColor } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (bio !== undefined) user.bio = bio.trim();
    if (status !== undefined) user.status = status.trim();
    if (location !== undefined) user.location = location.trim();
    if (avatarColor !== undefined) user.avatarColor = avatarColor.trim();

    await user.save();

    res.json({
      success: true,
      user: {
        username: user.username,
        bio: user.bio,
        status: user.status,
        location: user.location,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

export default router;
