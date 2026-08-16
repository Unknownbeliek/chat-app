import { User } from '../models/User.js';
import { activeUsers } from '../services/activeUsers.service.js';
import { broadcastUserList } from '../services/broadcast.service.js';

const PINGBOT_USER = {
  username: 'PingBot',
  bio: 'AI Assistant & Coding Companion 🤖',
  status: 'Online ⚡',
  location: 'Cloud',
  avatarColor: '#8b5cf6',
  avatarUrl: process.env.PINGBOT_AVATAR_URL || 'https://api.dicebear.com/7.x/bottts/svg?seed=PingBot',
  isOnline: true,
  lastSeen: null
};

export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({}, 'username bio status location avatarColor avatarUrl lastSeen createdAt').lean();
    const onlineList = Array.from(activeUsers.values()).map(u => u.originalName.toLowerCase());

    const result = users.map(u => ({
      username: u.username,
      bio: u.bio || 'Hey there! I am using ping.',
      status: u.status || 'Available',
      location: u.location || '',
      avatarColor: u.avatarColor || '',
      avatarUrl: u.avatarUrl || '',
      createdAt: u.createdAt,
      isOnline: u.username.toLowerCase() === 'pingbot' ? true : onlineList.includes(u.username.toLowerCase()),
      lastSeen: u.lastSeen ? new Date(u.lastSeen).toISOString() : null
    }));

    if (!result.some(u => u.username.toLowerCase() === 'pingbot')) {
      result.unshift(PINGBOT_USER);
    }

    res.json({
      success: true,
      users: result,
      onlineCount: activeUsers.size + 1
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserProfile(req, res, next) {
  try {
    const { username } = req.params;
    const cleanName = username.trim().toLowerCase();

    if (cleanName === 'pingbot') {
      return res.json({
        success: true,
        user: PINGBOT_USER
      });
    }

    const user = await User.findOne({ username: new RegExp(`^${cleanName}$`, 'i') }, 'username bio status location avatarColor avatarUrl createdAt').lean();
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
    next(err);
  }
}

export async function updateUserProfile(req, res, next) {
  try {
    const username = req.body.username || req.headers['x-username'];
    const { bio, status, location, avatarColor, avatarUrl } = req.body;
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
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

    await user.save();

    // Broadcast updated user list to all online clients
    broadcastUserList();

    res.json({
      success: true,
      user: {
        username: user.username,
        bio: user.bio,
        status: user.status,
        location: user.location,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}
