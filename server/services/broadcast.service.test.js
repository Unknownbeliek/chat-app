import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initBroadcastService, broadcast, broadcastUserList, sendPushToOfflineUser } from './broadcast.service.js';
import { User } from '../models/User.js';
import { PushSubscription } from '../models/PushSubscription.js';
import webpush from 'web-push';

vi.mock('../models/User.js', () => ({
  User: {
    find: vi.fn(),
  }
}));

vi.mock('../models/PushSubscription.js', () => ({
  PushSubscription: {
    find: vi.fn(),
    deleteOne: vi.fn(),
  }
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  }
}));

describe('broadcast.service.js', () => {
  let mockWss;
  let mockActiveUsersMap;

  beforeEach(() => {
    vi.clearAllMocks();
    mockWss = {
      clients: new Set()
    };
    mockActiveUsersMap = new Map();
    initBroadcastService(mockWss, mockActiveUsersMap);
  });

  describe('broadcast', () => {
    it('sends JSON stringified data only to clients with readyState === 1 (OPEN)', () => {
      const openClient = { readyState: 1, send: vi.fn() };
      const closedClient = { readyState: 3, send: vi.fn() };

      mockWss.clients.add(openClient);
      mockWss.clients.add(closedClient);

      const payload = { type: 'test', message: 'hello' };
      broadcast(payload);

      expect(openClient.send).toHaveBeenCalledWith(JSON.stringify(payload));
      expect(closedClient.send).not.toHaveBeenCalled();
    });
  });

  describe('broadcastUserList', () => {
    it('fetches users from DB and broadcasts user list to connected clients', async () => {
      const openClient = { readyState: 1, send: vi.fn() };
      mockWss.clients.add(openClient);
      mockActiveUsersMap.set('alice', { originalName: 'Alice' });

      User.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { username: 'Alice', bio: 'Bio 1', status: 'Online', avatarColor: '#fff', avatarUrl: '', lastSeen: null },
          { username: 'Bob', bio: 'Bio 2', status: 'Offline', avatarColor: '#000', avatarUrl: '', lastSeen: new Date() }
        ])
      });

      await broadcastUserList();

      expect(openClient.send).toHaveBeenCalled();
      const callArg = JSON.parse(openClient.send.mock.calls[0][0]);
      expect(callArg.type).toBe('userList');
      expect(callArg.onlineCount).toBe(2);
      expect(callArg.users.length).toBe(3);
      expect(callArg.users[0].username).toBe('PingBot');
      expect(callArg.users[1].isOnline).toBe(true);
      expect(callArg.users[2].isOnline).toBe(false);
    });
  });

  describe('sendPushToOfflineUser', () => {
    it('skips push notification if user is currently online', async () => {
      mockActiveUsersMap.set('alice', { originalName: 'Alice' });
      await sendPushToOfflineUser('alice', { title: 'New Message' });
      expect(PushSubscription.find).not.toHaveBeenCalled();
    });

    it('sends web push notification to offline user with subscriptions', async () => {
      PushSubscription.find.mockResolvedValue([
        { _id: 'sub1', endpoint: 'https://push.example.com', keys: { p256dh: 'k', auth: 'a' } }
      ]);
      webpush.sendNotification.mockResolvedValue({});

      await sendPushToOfflineUser('bob', { title: 'New Message' });

      expect(PushSubscription.find).toHaveBeenCalledWith({ username: 'bob' });
      expect(webpush.sendNotification).toHaveBeenCalled();
    });

    it('deletes subscription if push server returns 410 or 404 expired error', async () => {
      PushSubscription.find.mockResolvedValue([
        { _id: 'sub_expired', endpoint: 'https://push.example.com', keys: { p256dh: 'k', auth: 'a' } }
      ]);
      const err = new Error('Expired');
      err.statusCode = 410;
      webpush.sendNotification.mockRejectedValue(err);

      await sendPushToOfflineUser('bob', { title: 'New Message' });

      expect(PushSubscription.deleteOne).toHaveBeenCalledWith({ _id: 'sub_expired' });
    });
  });
});
