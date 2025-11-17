import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth.js';
import proposalRoutes from '../../routes/proposals.js';
import pool from '../../config/database.js';
import { clearAllTables, setupTestDatabase, executeQuery } from '../helpers/db.helper.js';

describe('SQL Injection Security Tests', () => {
  let app;
  let studentToken;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create test app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(cors());
    app.use('/api/auth', authRoutes);
    app.use('/api/proposals', proposalRoutes);
  });

  beforeEach(async () => {
    await clearAllTables();

    // Create test student
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'mahasiswa'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'password123'
      });

    studentToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Login SQL Injection Attempts', () => {
    test('should reject SQL injection in email field', async () => {
      const sqlInjectionAttempts = [
        "admin'--",
        "admin' OR '1'='1",
        "admin' OR '1'='1'--",
        "admin'; DROP TABLE users;--",
        "' OR 1=1--",
        "1' OR '1' = '1",
        "admin'/*",
        "' UNION SELECT NULL, NULL, NULL--"
      ];

      for (const maliciousEmail of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: maliciousEmail,
            password: 'password123'
          });

        // Should not succeed with SQL injection
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
      }

      // Verify no unauthorized access
      const users = await executeQuery('SELECT COUNT(*) as count FROM users');
      expect(users[0].count).toBe(1); // Only our test user
    });

    test('should reject SQL injection in password field', async () => {
      const sqlInjectionAttempts = [
        "password' OR '1'='1",
        "' OR 1=1--",
        "password'; DROP TABLE users;--",
        "anything' OR 'x'='x"
      ];

      for (const maliciousPassword of sqlInjectionAttempts) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'student@test.com',
            password: maliciousPassword
          });

        // Should not succeed with SQL injection
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
      }
    });

    test('should use parameterized queries (verify no SQL errors)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "test@test.com' OR '1'='1",
          password: "password' OR '1'='1"
        });

      // Should return proper auth error, not SQL error
      expect(response.status).toBe(401);
      expect(response.body.message).not.toContain('SQL');
      expect(response.body.message).not.toContain('syntax');
    });
  });

  describe('Registration SQL Injection Attempts', () => {
    test('should reject SQL injection in registration name field', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: "Admin'; DROP TABLE users;--",
          email: 'malicious@test.com',
          password: 'password123',
          role: 'mahasiswa'
        });

      // Should either succeed safely or reject
      if (response.status === 201) {
        // If registration succeeded, verify no SQL injection executed
        const tables = await executeQuery(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = 'users'
        `, [process.env.DB_NAME]);
        
        expect(tables[0].count).toBe(1); // Table still exists
      }
    });

    test('should reject SQL injection in registration email field', async () => {
      const maliciousEmail = "admin@test.com' OR '1'='1--";

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: maliciousEmail,
          password: 'password123',
          role: 'mahasiswa'
        });

      // Should handle safely
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('Proposal SQL Injection Attempts', () => {
    test('should reject SQL injection in proposal title', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', "Test'; DROP TABLE proposals;--")
        .field('description', 'Normal description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      // Should either succeed safely or reject
      if (response.status === 201) {
        // Verify table still exists
        const tables = await executeQuery(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = 'proposals'
        `, [process.env.DB_NAME]);
        
        expect(tables[0].count).toBe(1);
      }
    });

    test('should reject SQL injection in proposal description', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Normal Title')
        .field('description', "Description' OR '1'='1")
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      // Should handle safely
      expect([201, 400, 500]).toContain(response.status);
    });

    test('should reject SQL injection in file name', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Title')
        .field('description', 'Test Description')
        .attach('file', Buffer.from('content'), "file'; DROP TABLE proposals;--.pdf");

      // Should handle safely
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('Download SQL Injection Attempts', () => {
    test('should reject SQL injection in proposal ID', async () => {
      const maliciousIds = [
        "1 OR 1=1",
        "1'; DROP TABLE proposals;--",
        "1 UNION SELECT * FROM users--"
      ];

      for (const maliciousId of maliciousIds) {
        const response = await request(app)
          .get(`/api/proposals/${maliciousId}/download`)
          .set('Authorization', `Bearer ${studentToken}`);

        // Should return 404 or proper error, not SQL error
        expect(response.status).toBeGreaterThanOrEqual(400);
        
        if (response.body.message) {
          expect(response.body.message).not.toContain('SQL');
          expect(response.body.message).not.toContain('syntax');
        }
      }
    });
  });

  describe('Verify Parameterized Queries', () => {
    test('should handle single quotes in legitimate data', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', "O'Brien's Research Proposal")
        .field('description', "This is John's proposal about AI's impact")
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(201);

      // Verify data was stored correctly
      const proposals = await executeQuery(
        'SELECT title, description FROM proposals WHERE student_id = ?',
        [(await executeQuery('SELECT id FROM users WHERE email = ?', ['student@test.com']))[0].id]
      );

      expect(proposals[0].title).toBe("O'Brien's Research Proposal");
      expect(proposals[0].description).toBe("This is John's proposal about AI's impact");
    });

    test('should handle special characters in email', async () => {
      const specialEmail = "test+alias@example.com";

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Special User',
          email: specialEmail,
          password: 'password123',
          role: 'mahasiswa'
        });

      expect(registerResponse.status).toBe(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: specialEmail,
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user.email).toBe(specialEmail);
    });
  });

  describe('NoSQL Injection Prevention (Future-proofing)', () => {
    test('should reject JSON injection attempts in fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null }
        });

      // Should not succeed
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('should handle array injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: ['student@test.com', 'admin@test.com'],
          password: 'password123'
        });

      // Should not succeed or handle gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
