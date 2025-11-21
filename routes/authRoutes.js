import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register/mahasiswa', authController.registerMahasiswa);
router.post('/login', authController.login);

export default router;
