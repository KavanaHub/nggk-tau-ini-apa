import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// REGISTER
router.post('/register/mahasiswa', authController.registerMahasiswa);
router.post('/register/koordinator', authController.registerKoordinator);
router.post('/register/penguji', authController.registerPenguji);

// LOGIN (universal - cek semua role)
router.post('/login', authController.login);

export default router;
