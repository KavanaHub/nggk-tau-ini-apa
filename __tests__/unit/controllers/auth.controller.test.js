import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login } from '../../../controllers/authController.js';
import pool from '../../../config/database.js';
import { clearAllTables, setupTestDatabase } from '../../helpers/db.helper.js';

describe('Auth Controller - Unit Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('register', () => {
    test('should register a new user successfully', async () => {
      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'mahasiswa'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User registered successfully'
      });

      // Verify user was inserted into database
      const conn = await pool.getConnection();
      const [users] = await conn.query('SELECT * FROM users WHERE email = ?', [req.body.email]);
      conn.release();

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Test User');
      expect(users[0].email).toBe('test@example.com');
      expect(users[0].role).toBe('mahasiswa');
      
      // Verify password is hashed
      expect(users[0].password).not.toBe('password123');
      const isPasswordValid = await bcrypt.compare('password123', users[0].password);
      expect(isPasswordValid).toBe(true);
    });

    test('should fail with duplicate email', async () => {
      // Insert a user first
      const conn = await pool.getConnection();
      const hashedPassword = await bcrypt.hash('password123', 10);
      await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Existing User', 'test@example.com', hashedPassword, 'mahasiswa']
      );
      conn.release();

      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'mahasiswa'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email already exists'
      });
    });

    test('should hash password with bcrypt', async () => {
      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'mahasiswa'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      const conn = await pool.getConnection();
      const [users] = await conn.query('SELECT password FROM users WHERE email = ?', ['test@example.com']);
      conn.release();

      expect(users[0].password).not.toBe('password123');
      expect(users[0].password).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    test('should handle database errors gracefully', async () => {
      const req = {
        body: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          role: 'invalid_role' // Invalid enum value
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');
    });

    test('should accept valid user roles', async () => {
      const roles = ['mahasiswa', 'dosen', 'koordinator'];

      for (const role of roles) {
        const req = {
          body: {
            name: 'Test User',
            email: `test-${role}@example.com`,
            password: 'password123',
            role: role
          }
        };

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      }
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Insert a test user for login tests
      const conn = await pool.getConnection();
      const hashedPassword = await bcrypt.hash('password123', 10);
      await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Test User', 'test@example.com', hashedPassword, 'mahasiswa']
      );
      conn.release();
    });

    test('should login successfully with valid credentials', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      expect(res.status).not.toHaveBeenCalled(); // Success doesn't call status
      expect(res.json).toHaveBeenCalled();

      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('token');
      expect(response).toHaveProperty('user');
      expect(response.user.email).toBe('test@example.com');
      expect(response.user.role).toBe('mahasiswa');
      expect(response.user).not.toHaveProperty('password');
    });

    test('should return valid JWT token on login', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      const response = res.json.mock.calls[0][0];
      const decoded = jwt.verify(response.token, process.env.JWT_SECRET);

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded.email).toBe('test@example.com');
    });

    test('should fail with invalid email', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    test('should fail with invalid password', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid credentials'
      });
    });

    test('should include user data in JWT token', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      const response = res.json.mock.calls[0][0];
      const decoded = jwt.verify(response.token, process.env.JWT_SECRET);

      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('mahasiswa');
      expect(decoded.name).toBe('Test User');
      expect(decoded).toHaveProperty('id');
    });

    test('should not return password in response', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.user).not.toHaveProperty('password');
    });

    test('should handle database errors gracefully', async () => {
      // Close pool to simulate database error
      await pool.end();

      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('message');

      // Recreate pool for other tests
      await setupTestDatabase();
    });
  });
});
