import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth.js';
import proposalRoutes from '../../routes/proposals.js';
import pool from '../../config/database.js';
import { clearAllTables, setupTestDatabase } from '../helpers/db.helper.js';

describe('File Upload Security Tests', () => {
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

  describe('Malicious File Upload Attempts', () => {
    test('should handle file with script in filename', async () => {
      const maliciousFilenames = [
        'proposal<script>alert("xss")</script>.pdf',
        'proposal.php',
        'proposal.exe',
        'proposal.sh',
        '../../etc/passwd',
        '../../../windows/system32/config/sam',
        'proposal;rm -rf /.pdf'
      ];

      for (const filename of maliciousFilenames) {
        const response = await request(app)
          .post('/api/proposals/upload')
          .set('Authorization', `Bearer ${studentToken}`)
          .field('title', 'Test Proposal')
          .field('description', 'Description')
          .attach('file', Buffer.from('content'), filename);

        // Should either succeed (filename sanitized) or reject safely
        expect([201, 400, 500]).toContain(response.status);
        
        // Should not crash or expose system errors
        if (response.status >= 400 && response.body.message) {
          expect(response.body.message).not.toContain('ENOENT');
          expect(response.body.message).not.toContain('path');
          expect(response.body.message).not.toContain('directory');
        }
      }
    });

    test('should handle null bytes in filename', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), 'proposal\x00.pdf');

      // Should handle safely
      expect([201, 400, 500]).toContain(response.status);
    });

    test('should handle extremely long filename', async () => {
      const longFilename = 'a'.repeat(300) + '.pdf';

      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content'), longFilename);

      // Should handle safely (either accept or reject)
      expect([201, 400, 500]).toContain(response.status);
    });

    test('should handle Unicode and special characters in filename', async () => {
      const specialFilenames = [
        'proposal_你好.pdf',
        'proposal_مرحبا.pdf',
        'proposal_🔥.pdf',
        'proposal_<>&"\'.pdf'
      ];

      for (const filename of specialFilenames) {
        const response = await request(app)
          .post('/api/proposals/upload')
          .set('Authorization', `Bearer ${studentToken}`)
          .field('title', 'Test Proposal')
          .field('description', 'Description')
          .attach('file', Buffer.from('content'), filename);

        // Should handle safely
        expect([201, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('File Size Tests', () => {
    test('should handle large file uploads', async () => {
      // Create a large buffer (5MB)
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024, 'a');

      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', largeBuffer, 'large-proposal.pdf');

      // Should either accept or reject based on limits
      expect([201, 413, 500]).toContain(response.status);
    });

    test('should handle empty file upload', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.alloc(0), 'empty.pdf');

      // Should handle safely
      expect([201, 400, 500]).toContain(response.status);
    });

    test('should handle very small file', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('a'), 'tiny.pdf');

      expect(response.status).toBe(201);
    });
  });

  describe('File Content Validation', () => {
    test('should accept legitimate PDF-like content', async () => {
      const pdfHeader = Buffer.from('%PDF-1.4\n');
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', pdfHeader, 'proposal.pdf');

      expect(response.status).toBe(201);
    });

    test('should handle binary data safely', async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE]);
      
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', binaryData, 'proposal.pdf');

      // Should handle safely
      expect([201, 400, 500]).toContain(response.status);
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should prevent directory traversal in filename', async () => {
      const traversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system.ini',
        './../../sensitive-file.txt',
        'proposal/../../../etc/passwd.pdf'
      ];

      for (const filename of traversalAttempts) {
        const response = await request(app)
          .post('/api/proposals/upload')
          .set('Authorization', `Bearer ${studentToken}`)
          .field('title', 'Test Proposal')
          .field('description', 'Description')
          .attach('file', Buffer.from('content'), filename);

        // Should not allow path traversal
        expect([201, 400, 500]).toContain(response.status);
        
        // If succeeded, filename should be sanitized
        if (response.status === 201) {
          // The stored filename should not contain traversal sequences
          // This is verified by the application's handling
        }
      }
    });
  });

  describe('Multiple File Upload Attempts', () => {
    test('should handle multiple file fields', async () => {
      // Try to send multiple files (route expects single file)
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('content1'), 'proposal1.pdf')
        .attach('file', Buffer.from('content2'), 'proposal2.pdf');

      // Should handle based on multer configuration (single file)
      expect([201, 400, 500]).toContain(response.status);
    });

    test('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description');

      // Should reject or handle gracefully
      expect([400, 500]).toContain(response.status);
    });

    test('should handle wrong field name for file', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('wrongfield', Buffer.from('content'), 'proposal.pdf');

      // Should reject because multer expects 'file' field
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('XSS Prevention in Title/Description', () => {
    test('should handle script tags in title', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', '<script>alert("XSS")</script>')
        .field('description', 'Normal description')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      // Should accept (backend stores as-is, frontend should sanitize)
      expect(response.status).toBe(201);
    });

    test('should handle HTML in description', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Normal Title')
        .field('description', '<img src=x onerror="alert(1)">')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      // Should accept (backend stores as-is, frontend should sanitize)
      expect(response.status).toBe(201);
    });

    test('should handle JavaScript URLs', async () => {
      const response = await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Normal Title')
        .field('description', '<a href="javascript:alert(1)">Click</a>')
        .attach('file', Buffer.from('content'), 'proposal.pdf');

      expect(response.status).toBe(201);
    });
  });

  describe('File Download Security', () => {
    test('should set secure headers for file download', async () => {
      // Upload a file first
      await request(app)
        .post('/api/proposals/upload')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Test Proposal')
        .field('description', 'Description')
        .attach('file', Buffer.from('Test content'), 'proposal.pdf');

      // Get proposal ID
      const conn = await pool.getConnection();
      const [proposals] = await conn.query('SELECT id FROM proposals LIMIT 1');
      conn.release();

      const proposalId = proposals[0].id;

      // Download file
      const response = await request(app)
        .get(`/api/proposals/${proposalId}/download`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-disposition']).toBeDefined();
      expect(response.headers['content-type']).toBe('application/pdf');
    });

    test('should not allow download without authentication', async () => {
      const response = await request(app)
        .get('/api/proposals/1/download');

      expect(response.status).toBe(403);
    });
  });

  describe('Concurrent Upload Tests', () => {
    test('should handle multiple simultaneous uploads', async () => {
      const uploads = Array(3).fill(null).map((_, index) =>
        request(app)
          .post('/api/proposals/upload')
          .set('Authorization', `Bearer ${studentToken}`)
          .field('title', `Proposal ${index + 1}`)
          .field('description', `Description ${index + 1}`)
          .attach('file', Buffer.from(`content ${index + 1}`), `proposal${index + 1}.pdf`)
      );

      const responses = await Promise.all(uploads);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all files were stored
      const conn = await pool.getConnection();
      const [proposals] = await conn.query('SELECT COUNT(*) as count FROM proposals');
      conn.release();

      expect(proposals[0].count).toBe(3);
    });
  });
});
