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
app.use('/api/sidang', sidangRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bimbingan Online API OK' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

export const kavana = app;

if (!process.env.FUNCTION_TARGET) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to access the application`);
  });
}
