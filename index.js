import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import proposalRoutes from './routes/proposals.js';
import advisorRoutes from './routes/advisors.js';
import guidanceRoutes from './routes/guidance.js';
import reportRoutes from './routes/reports.js';
import examRoutes from './routes/exams.js';
import projectRoutes from './routes/projects.js';
import { healthCheck } from './controllers/healthController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { httpLogger } from './docs/utils/logger.js';
import logger from './docs/utils/logger.js';

dotenv.config();

const app = express();

// Request logging middleware (before routes)
app.use(httpLogger);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/advisors', advisorRoutes);
app.use('/api/guidance', guidanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/projects', projectRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Bimbingan Online API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Health check endpoint
app.get('/health', healthCheck);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Access the API at http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
