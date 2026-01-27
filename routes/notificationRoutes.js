import express from 'express';
import auth from '../middleware/auth.js';
import notificationController from '../controllers/notificationController.js';

const router = express.Router();

// GET Notification Stats (Counts)
router.get('/stats', auth, notificationController.getStats);

export default router;
