import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import messagesRoutes from './messages.routes.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';

vi.mock('../models/Message.js', () => ({
  Message: {
    find: vi.fn(),
    updateMany: vi.fn(),
  }
}));

vi.mock('../models/Conversation.js', () => ({
  Conversation: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  }
}));

vi.mock('../models/User.js', () => ({
  User: {
    find: vi.fn(),
  }
}));

const app = express();
app.use(express.json());
app.use('/api', messagesRoutes);

describe('messages.routes.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/messages/private', () => {
    it('returns 400 if user1 or user2 query parameters are missing', async () => {
      const res = await request(app).get('/api/messages/private?user1=alice');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/);
    });

    it('returns private chat history formatted correctly', async () => {
      const mockHistory = [
        {
          type: 'private_chat',
          username: 'alice',
          recipient: 'bob',
          message: 'Hello Bob',
          status: 'read',
          timestamp: new Date('2026-08-01T12:00:00Z')
        }
      ];

      const chain = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockHistory)
      };
      Message.find.mockReturnValue(chain);

      const res = await request(app).get('/api/messages/private?user1=alice&user2=bob');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.partner).toBe('bob');
      expect(res.body.history.length).toBe(1);
      expect(res.body.history[0].sender).toBe('alice');
      expect(res.body.history[0].message).toBe('Hello Bob');
    });
  });

  describe('GET /api/chats/history', () => {
    it('returns 400 if username is missing', async () => {
      const res = await request(app).get('/api/chats/history');
      expect(res.status).toBe(400);
    });

    it('returns historical chats merged with user profiles', async () => {
      const mockMessages = [
        {
          type: 'private_chat',
          username: 'alice',
          recipient: 'bob',
          message: 'Hey!',
          timestamp: new Date('2026-08-01T10:00:00Z')
        }
      ];
      const msgChain = {
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockMessages)
      };
      Message.find.mockReturnValue(msgChain);

      const mockConversations = [
        {
          participants: ['alice', 'bob'],
          lastMessage: 'Hey!',
          lastMessageSender: 'alice',
          lastMessageAt: new Date('2026-08-01T10:00:00Z'),
          unreadCount: new Map([['alice', 0], ['bob', 1]])
        }
      ];
      Conversation.find.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockConversations) });

      const mockUsers = [
        {
          username: 'bob',
          bio: 'Bob bio',
          status: 'Online',
          avatarColor: '#ff0000',
          avatarUrl: '',
          isOnline: true,
          lastSeen: null
        }
      ];
      User.find.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockUsers) });

      const res = await request(app).get('/api/chats/history?username=alice');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.chats.length).toBe(1);
      expect(res.body.chats[0].partner).toBe('bob');
    });
  });

  describe('POST /api/chats/read', () => {
    it('returns 400 if username or partner missing', async () => {
      const res = await request(app).post('/api/chats/read').send({ username: 'alice' });
      expect(res.status).toBe(400);
    });

    it('resets unread count and marks messages read', async () => {
      Conversation.findOneAndUpdate.mockResolvedValue({});
      Message.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const res = await request(app).post('/api/chats/read').send({ username: 'alice', partner: 'bob' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Conversation.findOneAndUpdate).toHaveBeenCalled();
      expect(Message.updateMany).toHaveBeenCalled();
    });
  });
});
