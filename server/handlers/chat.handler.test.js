import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleChat } from './chat.handler.js';
import { activeUsers } from '../services/activeUsers.service.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

vi.mock('../models/Message.js', () => {
  function MockMessage(data) {
    Object.assign(this, data);
    this._id = 'msg_mock_123';
    this.save = vi.fn().mockResolvedValue(true);
  }
  MockMessage.updateMany = vi.fn().mockResolvedValue({});
  return { Message: MockMessage };
});

vi.mock('../models/Conversation.js', () => ({
  Conversation: {
    findOneAndUpdate: vi.fn().mockResolvedValue({
      unreadCount: new Map([['alice', 0], ['bob', 1]])
    })
  }
}));

vi.mock('../services/broadcast.service.js', () => ({
  broadcast: vi.fn(),
  sendPushToOfflineUser: vi.fn()
}));

vi.mock('../services/pingbot.service.js', () => ({
  handlePingBotQuery: vi.fn()
}));

describe('chat.handler.js', () => {
  let mockSenderWs;
  let mockRecipientWs;

  beforeEach(() => {
    vi.clearAllMocks();
    activeUsers.clear();

    mockSenderWs = { readyState: 1, send: vi.fn() };
    mockRecipientWs = { readyState: 1, send: vi.fn() };

    activeUsers.set('alice', { ws: mockSenderWs, originalName: 'Alice' });
    activeUsers.set('bob', { ws: mockRecipientWs, originalName: 'Bob' });
  });

  describe('private_chat', () => {
    it('delivers private message to recipient socket and echoes back to sender', async () => {
      const data = {
        type: 'private_chat',
        recipient: 'Bob',
        message: 'Hello Bob!'
      };

      await handleChat(mockSenderWs, data, 'Alice');

      expect(mockRecipientWs.send).toHaveBeenCalled();
      const recipientMsg = JSON.parse(mockRecipientWs.send.mock.calls[0][0]);
      expect(recipientMsg.type).toBe('private_chat');
      expect(recipientMsg.sender).toBe('Alice');
      expect(recipientMsg.message).toBe('Hello Bob!');
      expect(recipientMsg.status).toBe('delivered');

      expect(mockSenderWs.send).toHaveBeenCalled();
      const deliveryReceipt = JSON.parse(mockSenderWs.send.mock.calls[0][0]);
      expect(deliveryReceipt.type).toBe('message_delivered');
      expect(deliveryReceipt.partner).toBe('Bob');
    });
  });

  describe('mark_read', () => {
    it('resets unread count in DB, sends unread_cleared to reader socket, and notifies partner', async () => {
      const data = {
        type: 'mark_read',
        recipient: 'Bob'
      };

      await handleChat(mockSenderWs, data, 'Alice');

      expect(Conversation.findOneAndUpdate).toHaveBeenCalledWith(
        { participants: ['alice', 'bob'] },
        { $set: { 'unreadCount.alice': 0 } }
      );

      expect(Message.updateMany).toHaveBeenCalled();

      // Verify unread_cleared event sent back to Alice (reader)
      expect(mockSenderWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'unread_cleared',
        partner: 'Bob'
      }));

      // Verify messages_read event sent to Bob (partner)
      expect(mockRecipientWs.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'messages_read',
        by: 'Alice',
        partner: 'Alice'
      }));
    });
  });
});
