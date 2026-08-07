import express from 'express';
import {
  getAllUsers,
  getUserProfile,
  updateUserProfile
} from '../controllers/users.controller.js';

const router = express.Router();

// REST Endpoint: Get All Registered Users with Online Status
router.get('/users', getAllUsers);

// REST Endpoint: Get Profile Details
router.get('/profile/:username', getUserProfile);

// REST Endpoint: Update User Profile (PUT /api/profile or PATCH /api/users/me)
router.put('/profile', updateUserProfile);
router.patch('/users/me', updateUserProfile);

export default router;
