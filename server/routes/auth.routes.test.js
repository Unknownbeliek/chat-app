import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRoutes from './auth.routes.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

vi.mock('../models/User.js', () => {
  class MockUser {
    constructor(data) {
      Object.assign(this, data);
    }
    save() {
      return Promise.resolve(this);
    }
  }
  MockUser.findOne = vi.fn();
  MockUser.find = vi.fn();
  return { User: MockUser };
});

const app = express();
app.use(express.json());
app.use('/api', authRoutes);

describe('auth.routes.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/register', () => {
    it('returns 400 if username or password is missing or username < 2 chars', async () => {
      const res1 = await request(app).post('/api/register').send({ username: 'a' });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toMatch(/required/);

      const res2 = await request(app).post('/api/register').send({ username: 'a', password: 'Password1!' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toMatch(/required/);
    });

    it('returns 400 if password does not meet strength requirements', async () => {
      const res = await request(app).post('/api/register').send({ username: 'raj', password: 'simplepassword' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Password must be at least 8 characters/);
    });

    it('returns 400 if username is already taken', async () => {
      User.findOne.mockResolvedValue({ username: 'raj' });
      const res = await request(app).post('/api/register').send({ username: 'raj', password: 'Password1!' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already taken/);
    });

    it('returns 201 and token on successful registration', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/register').send({ username: 'rajkumar', password: 'Password1!' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.username).toBe('rajkumar');
      expect(res.body.token).toBeDefined();
    });
  });

  describe('POST /api/login', () => {
    it('returns 400 if username or password missing', async () => {
      const res = await request(app).post('/api/login').send({ username: 'raj' });
      expect(res.status).toBe(400);
    });

    it('returns 400 if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app).post('/api/login').send({ username: 'unknown', password: 'Password1!' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/User not found/);
    });

    it('returns 401 if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('Password1!', 10);
      User.findOne.mockResolvedValue({ username: 'raj', password: hashedPassword });
      
      const res = await request(app).post('/api/login').send({ username: 'raj', password: 'WrongPassword1!' });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid password/);
    });

    it('returns 200 with token and user profile on successful login', async () => {
      const password = 'Password1!';
      const hashedPassword = await bcrypt.hash(password, 10);
      User.findOne.mockResolvedValue({
        username: 'raj',
        password: hashedPassword,
        bio: 'Hello world',
        status: 'Available',
        location: 'NYC',
        avatarColor: '#123456',
        avatarUrl: '/avatars/avatar01.jpg'
      });

      const res = await request(app).post('/api/login').send({ username: 'raj', password });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.username).toBe('raj');
      expect(res.body.token).toBeDefined();
      expect(res.body.bio).toBe('Hello world');
    });
  });
});
