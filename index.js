import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import mahasiswaRoutes from './routes/mahasiswaRoutes.js';
import kaprodiRoutes from './routes/kaprodiRoutes.js';
import koordinatorRoutes from './routes/koordinatorRoutes.js';
import dosenRoutes from './routes/dosenRoutes.js';
import bimbinganRoutes from './routes/bimbinganRoutes.js';
import sidangRoutes from './routes/sidangRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/kaprodi', kaprodiRoutes);
app.use('/api/koordinator', koordinatorRoutes);
app.use('/api/dosen', dosenRoutes);
app.use('/api/bimbingan', bimbinganRoutes);
app.use('/api/proposal', proposalRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/sidang', sidangRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bimbingan Online API OK' });
});

// Ping endpoint for testing
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export const kavana = app;
