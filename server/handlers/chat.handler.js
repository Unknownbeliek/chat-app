import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { activeUsers } from '../services/activeUsers.service.js';
import { broadcast, sendPushToOfflineUser } from '../services/broadcast.service.js';
import { handlePingBotQuery } from '../services/pingbot.service.js';

export async function handleChat(ws, data, currentUsername) {
  const { type, recipient, message: text, isOffTheRecord, enabled, whisper, replyTo } = data;

  // 0. Whisper Ephemeral Private Message (never saved to DB)
  if (type === 'whisper' || whisper === true) {
    if (!recipient || !text) return;

    const senderName = currentUsername || data.sender || 'Anonymous';
    const targetKey = recipient.toLowerCase();
    const recipientUser = activeUsers.get(targetKey);
    const isoNow = new Date().toISOString();

    const whisperPayload = JSON.stringify({
      type: 'whisper',
      sender: senderName,
      recipient: recipient,
      message: text,
      whisper: true,
      replyTo: replyTo || null,
      ttl: data.ttl || 10,
      timestamp: isoNow
    });

    // Send only to recipient active socket
    if (recipientUser && recipientUser.ws.readyState === 1) {
      recipientUser.ws.send(whisperPayload);
    } else {
      // Offline recipient -> send Web Push Notification
      sendPushToOfflineUser(recipient, {
        title: `Secret Whisper from ${senderName}`,
        body: '🤫 You received a private whisper',
        data: { url: '/' }
      });
    }

    // Echo back to sender so sender sees their own sent whisper
    if (ws && ws.readyState === 1 && targetKey !== (currentUsername ? currentUsername.toLowerCase() : '')) {
      ws.send(whisperPayload);
    }
    return;
  }

  // 1. Private 1-to-1 Chat
  if (type === 'private_chat') {
    if (!recipient || !text) return;

    const senderName = currentUsername || data.sender || 'Anonymous';
    const targetKey = recipient.toLowerCase();
    const recipientUser = activeUsers.get(targetKey);
    const isRecipientOnline = !!(recipientUser && recipientUser.ws.readyState === 1);
    const initialStatus = isRecipientOnline ? 'delivered' : 'sent';
    const isoNow = new Date().toISOString();

    const payloadObj = {
      type: 'private_chat',
      sender: senderName,
      recipient: recipient,
      message: text,
      status: initialStatus,
      isOffTheRecord: !!isOffTheRecord,
      replyTo: replyTo || null,
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
          status: initialStatus,
          isOffTheRecord: false,
          replyTo: replyTo || null,
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
    if (isRecipientOnline) {
      recipientUser.ws.send(payloadStr);

      // Also send unread count update
      recipientUser.ws.send(JSON.stringify({
        type: 'unread_update',
        partner: senderName,
        unreadCount: updatedUnread
      }));

      // Notify sender that message was delivered!
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'message_delivered',
          partner: recipient,
          timestamp: isoNow
        }));
      }
    } else {
      // Recipient is offline -> deliver Push Notification
      sendPushToOfflineUser(recipient, {
        title: `New message from ${senderName}`,
        body: text.length > 100 ? text.substring(0, 97) + '...' : text,
        data: { url: '/' }
      });
    }

    // Echo message back to sender
    if (ws && ws.readyState === 1 && targetKey !== (currentUsername ? currentUsername.toLowerCase() : '')) {
      ws.send(payloadStr);
    }

    const isDirectToBot = recipient && recipient.toLowerCase() === 'pingbot';
    const isBotMention = text && text.includes('@PingBot');

    if (isDirectToBot || isBotMention) {
      const query = text.replace(/@PingBot/gi, '').trim() || text;
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
        replyTo: replyTo || null,
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
      replyTo: replyTo || null,
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

      // Update all private messages from partner (recipient) to reader in DB to 'read'
      await Message.updateMany(
        {
          type: 'private_chat',
          username: new RegExp(`^${recipient.toLowerCase()}$`, 'i'),
          recipient: new RegExp(`^${readerName.toLowerCase()}$`, 'i'),
          status: { $ne: 'read' }
        },
        { $set: { status: 'read' } }
      );

      // Send real-time WS event to partner that reader has read their messages!
      const partnerUser = activeUsers.get(recipient.toLowerCase());
      if (partnerUser && partnerUser.ws.readyState === 1) {
        partnerUser.ws.send(JSON.stringify({
          type: 'messages_read',
          by: readerName,
          partner: readerName
        }));
      }
    } catch (err) {
      console.error('Error resetting unread count:', err);
    }
  }
}
