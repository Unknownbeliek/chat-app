import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: {
    type: [String],
    required: true,
    validate: [arr => arr.length === 2, 'A conversation must have exactly 2 participants.']
  },
  lastMessage: { type: String, default: '' },
  lastMessageSender: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  }
});

// Compound index to enforce unique participant pairs and efficient lookups
conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
