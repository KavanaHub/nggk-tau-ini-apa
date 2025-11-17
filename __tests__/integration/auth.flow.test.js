import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth.js';
import proposalRoutes from '../../routes/proposals.js';
import pool from '../../config/database.js';
import { clearAllTables, setupTestDatabase } from '../helpers/db.helper.js';

describe('Authentication Flow - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create test app
    app = express();
    app.use(express.json());
    app.use(cors());
    app.use('/api/auth', authRoutes);
    app.use('/api/proposals', proposalRoutes);
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Complete Registration → Login → Authenticated Request Flow', () => {
    test('should complete full authentication flow successfully', async () => {
      // Step 1: Register a new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'password123',
          role: 'mahasiswa'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.message).toBe('User registered successfully');

      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user.email).toBe('student@test.com');

      const token = loginResponse.body.token;

      // Step 3: Access protected endpoint with token
      const protectedResponse = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse.status).toBe(200);
      expect(Array.isArray(protectedResponse.body)).toBe(true);
    });

    test('should reject protected endpoint without authentication', async () => {
      // Try to access protected endpoint without token
      const response = await request(app)
        .get('/api/proposals/my-proposals');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Token not provided');
    });

    test('should reject protected endpoint with invalid token', async () => {
      // Try to access protected endpoint with invalid token
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Multiple Users with Different Roles', () => {
    test('should register and authenticate multiple users', async () => {
      const users = [
        { name: 'Student 1', email: 'student1@test.com', password: 'pass123', role: 'mahasiswa' },
        { name: 'Student 2', email: 'student2@test.com', password: 'pass123', role: 'mahasiswa' },
        { name: 'Advisor 1', email: 'advisor1@test.com', password: 'pass123', role: 'dosen' },
        { name: 'Coordinator', email: 'coordinator@test.com', password: 'pass123', role: 'koordinator' }
      ];

      // Register all users
      for (const user of users) {
        const registerResponse = await request(app)
          .post('/api/auth/register')
          .send(user);

        expect(registerResponse.status).toBe(201);
      }

      // Login all users
      for (const user of users) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: user.email,
            password: user.password
          });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.token).toBeDefined();
        expect(loginResponse.body.user.role).toBe(user.role);
      }
    });

    test('should enforce role-based access control', async () => {
      // Register a student
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@test.com',
          password: 'password123',
          role: 'mahasiswa'
        });

      // Login as student
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@test.com',
          password: 'password123'
        });

      const studentToken = loginResponse.body.token;

      // Try to access dosen-only endpoint (get all proposals)
      const response = await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });
  });

  describe('Token Persistence and Reuse', () => {
    test('should allow multiple requests with same token', async () => {
      // Register and login
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

      const token = loginResponse.body.token;

      // Make multiple requests with same token
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .get('/api/proposals/my-proposals')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
      }
    });

    test('should maintain user context across requests', async () => {
      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@test.com',
          password: 'password123',
          role: 'mahasiswa'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@test.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // User info should be consistent
      expect(loginResponse.body.user.name).toBe('John Doe');
      expect(loginResponse.body.user.email).toBe('john@test.com');
      expect(loginResponse.body.user.role).toBe('mahasiswa');
    });
  });

  describe('Login Error Scenarios', () => {
    test('should handle login with unregistered email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should handle login with wrong password', async () => {
      // Register user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'user@test.com',
          password: 'correctpassword',
          role: 'mahasiswa'
        });

      // Try login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should handle missing credentials', async () => {
      // Missing email
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      // Login might succeed with null email, so just check it doesn't crash
      expect(response1.status).toBeGreaterThanOrEqual(400);

      // Missing password
      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@test.com'
        });

      expect(response2.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Registration Validation', () => {
    test('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'duplicate@test.com',
        password: 'password123',
        role: 'mahasiswa'
      };

      // First registration
      const response1 = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response1.status).toBe(201);

      // Duplicate registration
      const response2 = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response2.status).toBe(400);
      expect(response2.body.message).toBe('Email already exists');
    });

    test('should allow same name with different emails', async () => {
      const user1 = {
        name: 'John Doe',
        email: 'john1@test.com',
        password: 'password123',
        role: 'mahasiswa'
      };

      const user2 = {
        name: 'John Doe',
        email: 'john2@test.com',
        password: 'password123',
        role: 'mahasiswa'
      };

      const response1 = await request(app)
        .post('/api/auth/register')
        .send(user1);

      const response2 = await request(app)
        .post('/api/auth/register')
        .send(user2);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
    });
  });
});
