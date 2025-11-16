const pool = require('../config/database');

const healthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    
    const conn = await pool.getConnection();
    const [result] = await conn.query('SELECT 1');
    conn.release();
    
    const responseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      server: {
        status: 'running',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000
      },
      database: {
        status: 'connected',
        type: 'MySQL'
      },
      api: {
        version: '1.0.0',
        endpoints: {
          auth: '/api/auth',
          proposals: '/api/proposals',
          advisors: '/api/advisors',
          guidance: '/api/guidance',
          reports: '/api/reports',
          exams: '/api/exams'
        }
      }
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: error.message,
      server: {
        status: 'running'
      },
      database: {
        status: 'disconnected',
        error: error.message
      }
    });
  }
};

module.exports = { healthCheck };
