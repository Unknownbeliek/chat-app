import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  bio: { type: String, default: "Hey there! I am using ping." },
  status: { type: String, default: "Available" },
  location: { type: String, default: "" },
  avatarColor: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
