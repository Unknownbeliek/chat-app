import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRegister, handleDisconnect } from './register.handler.js';
import { activeUsers } from '../services/activeUsers.service.js';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { broadcastUserList, broadcast } from '../services/broadcast.service.js';

vi.mock('../models/User.js', () => ({
  User: {
    findOneAndUpdate: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../models/Message.js', () => ({
  Message: {
    find: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../services/broadcast.service.js', () => ({
  broadcastUserList: vi.fn().mockResolvedValue(),
  broadcast: vi.fn()
}));

describe('register.handler.js', () => {
  let mockWs;

  beforeEach(() => {
    vi.clearAllMocks();
    activeUsers.clear();
    mockWs = {
      readyState: 1,
      send: vi.fn()
    };
  });

  describe('handleRegister', () => {
    it('registers user in activeUsers map and updates DB status', async () => {
      Message.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      const username = await handleRegister(mockWs, { username: 'Alice' });

      expect(username).toBe('Alice');
      expect(activeUsers.has('alice')).toBe(true);
      expect(activeUsers.get('alice')).toEqual({
        ws: mockWs,
        originalName: 'Alice'
      });
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { username: 'alice' },
        expect.objectContaining({ isOnline: true })
      );
      expect(broadcastUserList).toHaveBeenCalled();
      expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'userStatusChanged',
        username: 'Alice',
        isOnline: true
      }));
    });

    it('flushes missed offline messages on register', async () => {
      const mockMissedMsg = {
        _id: 'msg123',
        username: 'Bob',
        recipient: 'Alice',
        message: 'Hello while offline!',
        timestamp: new Date()
      };

      Message.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([mockMissedMsg])
        })
      });

      await handleRegister(mockWs, { username: 'Alice' });

      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('Hello while offline!'));
      expect(Message.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ['msg123'] } },
        { $set: { status: 'delivered' } }
      );
    });

    it('returns null if username is missing', async () => {
      const result = await handleRegister(mockWs, {});
      expect(result).toBeNull();
      expect(activeUsers.size).toBe(0);
    });
  });

  describe('handleDisconnect', () => {
    it('removes user from activeUsers map when socket matches', async () => {
      activeUsers.set('alice', { ws: mockWs, originalName: 'Alice' });

      await handleDisconnect(mockWs, 'Alice');

      expect(activeUsers.has('alice')).toBe(false);
      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { username: 'alice' },
        expect.objectContaining({ isOnline: false })
      );
      expect(broadcastUserList).toHaveBeenCalled();
      expect(broadcast).toHaveBeenCalledWith(expect.objectContaining({
        type: 'userStatusChanged',
        username: 'Alice',
        isOnline: false
      }));
    });

    it('does NOT remove user if disconnecting socket belongs to an older session', async () => {
      const newerWs = { readyState: 1, send: vi.fn() };
      activeUsers.set('alice', { ws: newerWs, originalName: 'Alice' });

      await handleDisconnect(mockWs, 'Alice');

      expect(activeUsers.has('alice')).toBe(true);
      expect(activeUsers.get('alice').ws).toBe(newerWs);
      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
