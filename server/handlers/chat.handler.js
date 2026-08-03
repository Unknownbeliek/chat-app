import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { activeUsers } from '../services/activeUsers.service.js';
import { broadcast } from '../services/broadcast.service.js';
import { handlePingBotQuery } from '../services/pingbot.service.js';

export async function handleChat(ws, data, currentUsername) {
  const { type, recipient, message: text, isOffTheRecord, enabled } = data;

  // 1. Private 1-to-1 Chat
  if (type === 'private_chat') {
    if (!recipient || !text) return;

    const senderName = currentUsername || data.sender || 'Anonymous';
    const targetKey = recipient.toLowerCase();
    const recipientUser = activeUsers.get(targetKey);
    const isoNow = new Date().toISOString();

    const payloadObj = {
      type: 'private_chat',
      sender: senderName,
      recipient: recipient,
      message: text,
      isOffTheRecord: !!isOffTheRecord,
      timestamp: isoNow
    };
    const payloadStr = JSON.stringify(payloadObj);

    let updatedUnread = 1;

    if (!isOffTheRecord) {
      try {
        const newDbMsg = new Message({
          username: senderName,
          recipient: recipient,
          message: text,
          type: 'private_chat',
          isOffTheRecord: false,
          timestamp: new Date()
        });
        await newDbMsg.save();

        // Upsert Conversation record for active chats & unread tracking
        const sortedParticipants = [senderName.toLowerCase(), recipient.toLowerCase()].sort();
        const updatedConvo = await Conversation.findOneAndUpdate(
          { participants: sortedParticipants },
          {
            $set: {
              lastMessage: text,
              lastMessageSender: senderName,
              lastMessageAt: new Date()
            },
            $inc: {
              [`unreadCount.${recipient.toLowerCase()}`]: 1
            },
            $setOnInsert: {
              participants: sortedParticipants
            }
          },
          { upsert: true, new: true, lean: true }
        );

        if (updatedConvo && updatedConvo.unreadCount) {
          const uMap = updatedConvo.unreadCount;
          updatedUnread = typeof uMap.get === 'function'
            ? (uMap.get(recipient.toLowerCase()) || 1)
            : (uMap[recipient.toLowerCase()] || 1);
        }
      } catch (err) {
        console.error('Error saving private message:', err);
      }
    }

    // Send message payload to recipient via WS
    if (recipientUser && recipientUser.ws.readyState === 1) {
      recipientUser.ws.send(payloadStr);

      // Also send unread count update
      recipientUser.ws.send(JSON.stringify({
        type: 'unread_update',
        partner: senderName,
        unreadCount: updatedUnread
      }));
    }

    if (ws.readyState === 1 && targetKey !== (currentUsername ? currentUsername.toLowerCase() : '')) {
      ws.send(payloadStr);
    }

    if (text.includes('@PingBot')) {
      const query = text.replace(/@PingBot/gi, '').trim();
      handlePingBotQuery(query, recipient, senderName, false, activeUsers);
    }
  }

  // 2. Global Public Chat
  else if (type === 'global_chat') {
    const senderName = currentUsername || data.sender || 'Anonymous';
    const isoNow = new Date().toISOString();

    try {
      const newDbMessage = new Message({
        username: senderName,
        message: text,
        type: 'global_chat',
        timestamp: new Date()
      });
      await newDbMessage.save();
    } catch (err) {
      console.error('Error saving global message:', err);
    }

    broadcast({
      type: 'global_chat',
      sender: senderName,
      message: text,
      timestamp: isoNow
    });

    if (text && text.includes('@PingBot')) {
      const query = text.replace(/@PingBot/gi, '').trim();
      handlePingBotQuery(query, "Global Chat", senderName, true, activeUsers);
    }
  }

  // 3. OTR Mode Toggle Sync
  else if (type === 'otr_toggle') {
    const senderName = currentUsername || data.sender;
    if (!recipient || !senderName) return;

    const targetUser = activeUsers.get(recipient.toLowerCase());
    if (targetUser && targetUser.ws.readyState === 1) {
      targetUser.ws.send(JSON.stringify({
        type: 'otr_toggle',
        sender: senderName,
        recipient: recipient,
        enabled: !!enabled
      }));
    }
  }

  // 4. Mark conversation as read
  else if (type === 'mark_read') {
    const readerName = currentUsername || data.sender;
    if (!recipient || !readerName) return;
    try {
      const sortedParticipants = [readerName.toLowerCase(), recipient.toLowerCase()].sort();
      await Conversation.findOneAndUpdate(
        { participants: sortedParticipants },
        { $set: { [`unreadCount.${readerName.toLowerCase()}`]: 0 } }
      );
    } catch (err) {
      console.error('Error resetting unread count:', err);
    }
  }
}
