const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const proposalRoutes = require('./routes/proposals');
const advisorRoutes = require('./routes/advisors');
const guidanceRoutes = require('./routes/guidance');
const reportRoutes = require('./routes/reports');
const examRoutes = require('./routes/exams');
const { healthCheck } = require('./controllers/healthController');

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
  console.log(`Access the API at http://localhost:${PORT}`)
});
