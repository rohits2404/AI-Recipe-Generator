import express from 'express';
import { getCurrentUser, login, register, requestPasswordReset } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public Routes
router.post('/signup' , register);
router.post('/login' , login);
router.post('/reset-password' , requestPasswordReset);

// Protected Routes
router.get('/me' , protect , getCurrentUser);

export default router;
