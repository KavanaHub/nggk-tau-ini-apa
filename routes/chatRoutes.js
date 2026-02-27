import express from 'express';
import { sendMessage, webhookFonnte } from '../controllers/chatController.js';

const router = express.Router();

// Endpoint Publik: Menerima pesan dari widget chat form (tidak diblokir oleh middleware Auth JWT)
router.post('/send', sendMessage);

// Endpoint Webhook: Fonnte akan menembak POST kesini setiap ada pesan masuk
router.post('/webhook', webhookFonnte);

export default router;
