import request from 'supertest';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import authRoutes from '../../routes/auth.js';
import proposalRoutes from '../../routes/proposals.js';
import pool from '../../config/database.js';
import { clearAllTables, setupTestDatabase } from '../helpers/db.helper.js';
import { generateTestToken } from '../helpers/auth.helper.js';

describe('Proposal Workflow - Integration Tests', () => {
  let app;
  let studentToken;
  let dosenToken;
  let studentId;
  let dosenId;

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

    // Register and login a student
    const studentRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'student@test.com',
        password: 'password123',
        role: 'mahasiswa'
      });

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'password123'
      });

    studentToken = studentLogin.body.token;
    studentId = studentLogin.body.user.id;

    // Register and login a dosen
    const dosenRegister = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Advisor',
        email: 'advisor@test.com',
        password: 'password123',
        role: 'dosen'
      });

    const dosenLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'advisor@test.com',
        password: 'password123'
      });

    dosenToken = dosenLogin.body.token;
    dosenId = dosenLogin.body.user.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Proposal Upload', () => {
    test('should allow student to upload proposal with file', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal Title')
        .field('description', 'This is a test proposal description')
        .attach('file', Buffer.from('Mock PDF content'), 'proposal.pdf');

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Proposal uploaded successfully');

      // Verify proposal in database
      const conn = await pool.getConnection();
      const [proposals] = await conn.query('SELECT * FROM proposals WHERE student_id = ?', [studentId]);
      conn.release();

      expect(proposals).toHaveLength(1);
      expect(proposals[0].title).toBe('Test Proposal Title');
      expect(proposals[0].status).toBe('pending');
    });

    test('should reject proposal upload from non-mahasiswa', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${dosenToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });

    test('should reject proposal upload without authentication', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Token not provided');
    });
  });

  describe('Get Student Proposals', () => {
    test('should return student own proposals', async () => {
      // Upload two proposals
      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Proposal 1')
        .field('description', 'Description 1')
        .attach('file', Buffer.from('content1'), 'proposal1.pdf');

      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Proposal 2')
        .field('description', 'Description 2')
        .attach('file', Buffer.from('content2'), 'proposal2.pdf');

      // Get proposals
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBeDefined();
      expect(response.body[0].status).toBeDefined();
    });

    test('should return empty array when student has no proposals', async () => {
      const response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('Get All Proposals (Dosen)', () => {
    test('should allow dosen to view all proposals', async () => {
      // Student uploads proposal
      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      // Dosen gets all proposals
      const response = await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('student_name');
    });

    test('should reject student from viewing all proposals', async () => {
      const response = await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Forbidden');
    });
  });

  describe('Download Proposal', () => {
    test('should allow authenticated user to download proposal', async () => {
      // Upload proposal
      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('Test PDF Content'), 'proposal.pdf');

      // Get proposal ID
      const conn = await pool.getConnection();
      const [proposals] = await conn.query('SELECT id FROM proposals WHERE student_id = ?', [studentId]);
      conn.release();

      const proposalId = proposals[0].id;

      // Download proposal
      const response = await request(app)
        .get(`/api/proposals/${proposalId}/download`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    test('should return 404 for non-existent proposal', async () => {
      const response = await request(app)
        .get('/api/proposals/99999/download')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Proposal not found');
    });

    test('should reject unauthenticated download request', async () => {
      const response = await request(app)
        .get('/api/proposals/1/download');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Token not provided');
    });
  });

  describe('Multiple Students Workflow', () => {
    test('should isolate proposals between students', async () => {
      // Register second student
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Student 2',
          email: 'student2@test.com',
          password: 'password123',
          role: 'mahasiswa'
        });

      const student2Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student2@test.com',
          password: 'password123'
        });

      const student2Token = student2Login.body.token;

      // Student 1 uploads proposal
      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Student 1 Proposal')
        .field('description', 'Description 1')
        .attach('file', Buffer.from('content1'), 'proposal1.pdf');

      // Student 2 uploads proposal
      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${student2Token}`)
        .field('title', 'Student 2 Proposal')
        .field('description', 'Description 2')
        .attach('file', Buffer.from('content2'), 'proposal2.pdf');

      // Student 1 should only see their own proposal
      const student1Response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(student1Response.body).toHaveLength(1);
      expect(student1Response.body[0].title).toBe('Student 1 Proposal');

      // Student 2 should only see their own proposal
      const student2Response = await request(app)
        .get('/api/proposals/my-proposals')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(student2Response.body).toHaveLength(1);
      expect(student2Response.body[0].title).toBe('Student 2 Proposal');

      // Dosen should see both proposals
      const dosenResponse = await request(app)
        .get('/api/proposals')
        .set('Authorization', `Bearer ${dosenToken}`);

      expect(dosenResponse.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('File Upload Edge Cases', () => {
    test('should handle proposal with long title and description', async () => {
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(1000);

      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', longTitle)
        .field('description', longDescription)
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(201);
    });

    test('should handle special characters in file name', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal (final) [v2].pdf');

      expect(response.status).toBe(201);
    });
  });
});
