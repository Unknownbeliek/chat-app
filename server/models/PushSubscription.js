import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
