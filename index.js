import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import proposalRoutes from './routes/proposals.js';
import advisorRoutes from './routes/advisors.js';
import guidanceRoutes from './routes/guidance.js';
import reportRoutes from './routes/reports.js';
import examRoutes from './routes/exams.js';
import { healthCheck } from './controllers/healthController.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/guidance', guidanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/exams', examRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'University Project Management API' });
});

app.get('/health', healthCheck);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at http://localhost:${PORT}`);
});
