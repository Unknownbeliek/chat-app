import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import usersRoutes from './users.routes.js';
import { User } from '../models/User.js';
import { activeUsers } from '../services/activeUsers.service.js';
import * as broadcastService from '../services/broadcast.service.js';

vi.mock('../models/User.js', () => ({
  User: {
    find: vi.fn(),
    findOne: vi.fn(),
  }
}));

vi.mock('../services/broadcast.service.js', () => ({
  broadcastUserList: vi.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api', usersRoutes);

describe('users.routes.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeUsers.clear();
  });

  describe('GET /api/users', () => {
    it('returns all users with correct isOnline status', async () => {
      activeUsers.set('alice', { originalName: 'Alice' });

      const mockUsers = [
        { username: 'Alice', bio: 'Bio 1', status: 'Available', createdAt: new Date() },
        { username: 'Bob', bio: 'Bio 2', status: 'Busy', createdAt: new Date() }
      ];

      User.find.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockUsers) });

      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users.length).toBe(3);
      expect(res.body.users[0].username).toBe('PingBot');
      expect(res.body.users[1].isOnline).toBe(true);
      expect(res.body.users[2].isOnline).toBe(false);
      expect(res.body.onlineCount).toBe(2);
    });
  });

  describe('GET /api/profile/:username', () => {
    it('returns 404 if user is not found', async () => {
      User.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      const res = await request(app).get('/api/profile/unknown');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/);
    });

    it('returns user profile with isOnline indicator when found', async () => {
      activeUsers.set('raj', { originalName: 'raj' });
      User.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ username: 'raj', bio: 'Hey', status: 'Available' })
      });

      const res = await request(app).get('/api/profile/raj');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('raj');
      expect(res.body.user.isOnline).toBe(true);
    });
  });

  describe('PUT /api/profile & PATCH /api/users/me', () => {
    it('returns 400 if username is missing', async () => {
      const res = await request(app).put('/api/profile').send({ bio: 'New Bio' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Username is required/);
    });

    it('returns 404 if user to update is not found', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app).put('/api/profile').send({ username: 'nobody', bio: 'New Bio' });
      expect(res.status).toBe(404);
    });

    it('updates provided user profile fields and broadcasts user list', async () => {
      const userMock = {
        username: 'raj',
        bio: 'Old Bio',
        status: 'Old Status',
        save: vi.fn().mockResolvedValue(true)
      };
      User.findOne.mockResolvedValue(userMock);

      const res = await request(app)
        .put('/api/profile')
        .send({ username: 'raj', bio: 'New Bio', status: 'Coding' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(userMock.bio).toBe('New Bio');
      expect(userMock.status).toBe('Coding');
      expect(userMock.save).toHaveBeenCalled();
      expect(broadcastService.broadcastUserList).toHaveBeenCalled();
    });
  });
});
