import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import functions from '@google-cloud/functions-framework';
import swaggerUi from 'swagger-ui-express';

import authRoutes from './routes/authRoutes.js';
import mahasiswaRoutes from './routes/mahasiswaRoutes.js';
import kaprodiRoutes from './routes/kaprodiRoutes.js';
import koordinatorRoutes from './routes/koordinatorRoutes.js';
import dosenRoutes from './routes/dosenRoutes.js';
import pengujiRoutes from './routes/pengujiRoutes.js';
import bimbinganRoutes from './routes/bimbinganRoutes.js';
import sidangRoutes from './routes/sidangRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import swaggerSpec from './swagger.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/kaprodi', kaprodiRoutes);
app.use('/api/koordinator', koordinatorRoutes);
app.use('/api/dosen', dosenRoutes);
app.use('/api/penguji', pengujiRoutes);
app.use('/api/bimbingan', bimbinganRoutes);
app.use('/api/proposal', proposalRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/sidang', sidangRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bimbingan Online API OK' });
});

// Ping endpoint
app.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

// EXPORT FOR GCF (Gen2)
functions.http('kavana', app);


// EXPORT FOR VERCEL
export default app;

export const kavana = app;
