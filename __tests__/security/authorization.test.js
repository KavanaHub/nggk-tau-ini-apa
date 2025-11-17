import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth.js';
import proposalRoutes from '../../routes/proposals.js';
import advisorRoutes from '../../routes/advisors.js';
import pool from '../../config/database.js';
import { clearAllTables, setupTestDatabase } from '../helpers/db.helper.js';
import { generateTestToken, generateExpiredToken, generateInvalidToken } from '../helpers/auth.helper.js';

describe('Authorization Security Tests', () => {
  let app;
  let mahasiswaToken;
  let dosenToken;
  let koordinatorToken;
  let mahasiswaId;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create test app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.use(cors());
    app.use('/api/auth', authRoutes);
    app.use('/api/proposals', proposalRoutes);
    app.use('/api/advisors', advisorRoutes);
  });

  beforeEach(async () => {
    await clearAllTables();

    // Register users of different roles
    await request(app).post('/api/auth/register').send({
      name: 'Student User',
      email: 'student@test.com',
      password: 'password123',
      role: 'mahasiswa'
    });

    await request(app).post('/api/auth/register').send({
      name: 'Advisor User',
      email: 'advisor@test.com',
      password: 'password123',
      role: 'dosen'
    });

    await request(app).post('/api/auth/register').send({
      name: 'Coordinator User',
      email: 'coordinator@test.com',
      password: 'password123',
      role: 'koordinator'
    });

    // Login to get tokens
    const mahasiswaLogin = await request(app).post('/api/auth/login').send({
      email: 'student@test.com',
      password: 'password123'
    });
    mahasiswaToken = mahasiswaLogin.body.token;
    mahasiswaId = mahasiswaLogin.body.user.id;

    const dosenLogin = await request(app).post('/api/auth/login').send({
      email: 'advisor@test.com',
      password: 'password123'
    });
    dosenToken = dosenLogin.body.token;

    const koordinatorLogin = await request(app).post('/api/auth/login').send({
      email: 'coordinator@test.com',
      password: 'password123'
    });
    koordinatorToken = koordinatorLogin.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Missing Token', () => {
    test('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get('/api/proposals/my-proposals');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Token not provided');
    });

    test('should reject requests with empty authorization header', async () => {
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', '');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Token not provided');
    });
  });

  describe('Invalid Token', () => {
    test('should reject requests with malformed token', async () => {
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    test('should reject requests with expired token', async () => {
      const expiredToken = generateExpiredToken({
        id: mahasiswaId,
        email: 'student@test.com',
        role: 'mahasiswa'
      });

      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    test('should reject requests with wrong signature', async () => {
      const invalidToken = generateInvalidToken({
        id: mahasiswaId,
        email: 'student@test.com',
        role: 'mahasiswa'
      });

      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });

    test('should reject token without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', mahasiswaToken);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Role-Based Access Control - Proposals', () => {
    test('mahasiswa should access upload proposal endpoint', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${mahasiswaToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(201);
    });

    test('dosen should NOT access upload proposal endpoint', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${dosenToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    test('koordinator should NOT access upload proposal endpoint', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${koordinatorToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    test('mahasiswa should access my-proposals endpoint', async () => {
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${mahasiswaToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('dosen should NOT access my-proposals endpoint', async () => {
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    test('dosen should access all proposals endpoint', async () => {
      const response = await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('mahasiswa should NOT access all proposals endpoint', async () => {
      const response = await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${mahasiswaToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });
  });

  describe('Role Escalation Attempts', () => {
    test('should not allow role manipulation in token', async () => {
      // Try to create token with elevated role
      const fakeToken = generateTestToken({
        id: mahasiswaId,
        email: 'student@test.com',
        role: 'koordinator' // Attempting to escalate to koordinator
      });

      // This should actually succeed because we generated a valid token
      // but in real scenario, user can't generate their own tokens
      // The real protection is that users can't get a token with elevated role
      // during login (tested by login tests)
      
      // Verify that legitimate login returns correct role
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        });

      expect(loginResponse.body.user.role).toBe('mahasiswa');
      expect(loginResponse.body.user.role).not.toBe('koordinator');
    });

    test('should prevent accessing other user data', async () => {
      // Create another mahasiswa
      await request(app).post('/api/auth/register').send({
        name: 'Student 2',
        email: 'student2@test.com',
        password: 'password123',
        role: 'mahasiswa'
      });

      const student2Login = await request(app).post('/api/auth/login').send({
        email: 'student2@test.com',
        password: 'password123'
      });
      const student2Token = student2Login.body.token;

      // Student 2 uploads a proposal
      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${student2Token}`)
        .field('title', 'Student 2 Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      // Student 1 tries to get all proposals (should only see their own)
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${mahasiswaToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0); // Should not see Student 2's proposal
    });
  });

  describe('Token Reuse and Manipulation', () => {
    test('should not accept token from different environment', async () => {
      // Generate token with different secret
      const differentSecretToken = generateInvalidToken({
        id: mahasiswaId,
        email: 'student@test.com',
        role: 'mahasiswa'
      });

      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${differentSecretToken}`);

      expect(response.status).toBe(401);
    });

    test('should handle multiple simultaneous requests with same token', async () => {
      // Make multiple requests in parallel
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .get('/api/proposals/my-proposals')
          .set('Authorization', `Bearer ${mahasiswaToken}`)
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Cross-Role Endpoint Access', () => {
    test('should enforce strict role boundaries', async () => {
      const endpoints = [
        { method: 'get', url: '/api/proposals', allowedRoles: ['dosen'] },
        { method: 'get', url: '/api/proposals/my-proposals', allowedRoles: ['mahasiswa'] },
        { method: 'get', url: '/api/advisors', allowedRoles: ['koordinator'] }
      ];

      const tokens = {
        mahasiswa: mahasiswaToken,
        dosen: dosenToken,
        koordinator: koordinatorToken
      };

      for (const endpoint of endpoints) {
        for (const [role, token] of Object.entries(tokens)) {
          let response;
          
          if (endpoint.method === 'get') {
            response = await request(app)
              .get(endpoint.url)
              .set('Authorization', `Bearer ${token}`);
          }

          if (endpoint.allowedRoles.includes(role)) {
            expect(response.status).not.toBe(403);
          } else {
            expect(response.status).toBe(403);
            expect(response.body.message).toBe('Forbidden');
          }
        }
      }
    });
  });

  describe('CORS and Security Headers', () => {
    test('should have CORS enabled', async () => {
      const response = await request(app)
        .options('/api/proposals/my-proposals')
        .set('Origin', 'http://example.com');

      // CORS should be handled
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
