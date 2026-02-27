import express from 'express';
import { sendMessage, webhookFonnte, syncMessages } from '../controllers/chatController.js';

const router = express.Router();

// Endpoint Publik: Menerima pesan dari widget chat form
router.post('/send', sendMessage);

// Endpoint Webhook: Fonnte akan menembak POST kesini setiap ada pesan masuk
router.post('/webhook', webhookFonnte);

// Endpoint Sync: Frontend Next.js melakukan polling kesini
router.get('/sync', syncMessages);

export default router;
