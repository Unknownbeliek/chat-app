import express from 'express';
import {
  getPrivateMessages,
  getChatHistory,
  getActiveChats,
  markChatAsRead
} from '../controllers/messages.controller.js';

const router = express.Router();

// REST Endpoint: Get 1-to-1 Private Chat History
router.get('/messages/private', getPrivateMessages);

// REST Endpoint: Get All Historical Chats for a user
router.get('/chats/history', getChatHistory);

// REST Endpoint: Get Active Chats for a user
router.get('/chats/active', getActiveChats);

// REST Endpoint: Mark conversation as read
router.post('/chats/read', markChatAsRead);

export default router;
