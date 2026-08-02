import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  username: String,
  recipient: String,
  message: String,
  type: { type: String, enum: ['global_chat', 'private_chat', 'bot_response'], default: 'global_chat' },
  isOffTheRecord: { type: Boolean, default: false },
  isBotResponse: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export const Message = mongoose.model('Message', messageSchema);
