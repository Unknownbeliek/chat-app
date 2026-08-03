import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username (min 2 chars) and password are required.' });
    }

    // Strong password validation: min 8 chars, 1 uppercase, 1 number, 1 special char
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters with one uppercase letter, one number, and one special character (@$!%*?&).'
      });
    }

    const cleanUsername = username.trim();
    const existingUser = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username: cleanUsername, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, username: newUser.username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') });
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please try again.' });
    }

    res.json({
      success: true,
      username: user.username,
      bio: user.bio || '',
      status: user.status || '',
      location: user.location || '',
      avatarColor: user.avatarColor || '',
      avatarUrl: user.avatarUrl || ''
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

export default router;
