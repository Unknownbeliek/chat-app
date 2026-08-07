import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ping_fallback_jwt_secret_key_2026';

export async function registerUser(req, res, next) {
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
    const existingUser = await User.findOne({ username: cleanUsername.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username: cleanUsername, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      username: newUser.username,
      token,
      bio: newUser.bio || 'Hey there! I am using ping.',
      status: newUser.status || 'Available',
      location: newUser.location || '',
      avatarColor: newUser.avatarColor || '#6366f1',
      avatarUrl: newUser.avatarUrl || ''
    });
  } catch (err) {
    next(err);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim();
    const user = await User.findOne({ username: cleanUsername.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'User not found. Please register first.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please try again.' });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      username: user.username,
      token,
      bio: user.bio || '',
      status: user.status || '',
      location: user.location || '',
      avatarColor: user.avatarColor || '',
      avatarUrl: user.avatarUrl || ''
    });
  } catch (err) {
    next(err);
  }
}
