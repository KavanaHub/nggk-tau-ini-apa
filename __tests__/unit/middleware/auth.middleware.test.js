import { jest } from '@jest/globals';
import { verifyToken, verifyRole } from '../../../middleware/auth.js';
import { generateTestToken, generateExpiredToken, generateInvalidToken } from '../../helpers/auth.helper.js';

describe('Auth Middleware - Unit Tests', () => {
  describe('verifyToken', () => {
    test('should allow request with valid token', () => {
      const token = generateTestToken({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa'
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.email).toBe('test@example.com');
      expect(req.user.role).toBe('mahasiswa');
    });

    test('should reject request without token', () => {
      const req = {
        headers: {}
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token not provided'
      });
    });

    test('should reject request with malformed token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token-format'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token'
      });
    });

    test('should reject request with expired token', () => {
      const token = generateExpiredToken({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa'
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token'
      });
    });

    test('should reject request with invalid signature', () => {
      const token = generateInvalidToken({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa'
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token'
      });
    });

    test('should attach decoded user data to request', () => {
      const userData = {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'dosen'
      };

      const token = generateTestToken(userData);

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      verifyToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(userData.id);
      expect(req.user.name).toBe(userData.name);
      expect(req.user.email).toBe(userData.email);
      expect(req.user.role).toBe(userData.role);
    });

    test('should reject token without Bearer prefix', () => {
      const token = generateTestToken({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'mahasiswa'
      });

      const req = {
        headers: {
          authorization: token // Missing "Bearer " prefix
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('verifyRole', () => {
    test('should allow access for authorized role', () => {
      const middleware = verifyRole(['mahasiswa']);

      const req = {
        user: {
          id: 1,
          name: 'Test Student',
          email: 'student@example.com',
          role: 'mahasiswa'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject access for unauthorized role', () => {
      const middleware = verifyRole(['dosen']);

      const req = {
        user: {
          id: 1,
          name: 'Test Student',
          email: 'student@example.com',
          role: 'mahasiswa'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Forbidden'
      });
    });

    test('should allow access for multiple authorized roles', () => {
      const middleware = verifyRole(['mahasiswa', 'dosen', 'koordinator']);

      const roles = ['mahasiswa', 'dosen', 'koordinator'];

      roles.forEach(role => {
        const req = {
          user: {
            id: 1,
            name: 'Test User',
            email: 'user@example.com',
            role: role
          }
        };

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        const next = jest.fn();

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    test('should reject mahasiswa accessing dosen-only route', () => {
      const middleware = verifyRole(['dosen']);

      const req = {
        user: {
          id: 1,
          name: 'Test Student',
          email: 'student@example.com',
          role: 'mahasiswa'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should reject koordinator accessing mahasiswa-only route', () => {
      const middleware = verifyRole(['mahasiswa']);

      const req = {
        user: {
          id: 1,
          name: 'Test Coordinator',
          email: 'coordinator@example.com',
          role: 'koordinator'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should work with single role in array', () => {
      const middleware = verifyRole(['koordinator']);

      const req = {
        user: {
          id: 1,
          name: 'Test Coordinator',
          email: 'coordinator@example.com',
          role: 'koordinator'
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken and verifyRole integration', () => {
    test('should work together in middleware chain', () => {
      const token = generateTestToken({
        id: 1,
        name: 'Test Student',
        email: 'student@example.com',
        role: 'mahasiswa'
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      // First middleware: verifyToken
      verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();

      // Second middleware: verifyRole
      const roleMiddleware = verifyRole(['mahasiswa']);
      roleMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject when token is valid but role is unauthorized', () => {
      const token = generateTestToken({
        id: 1,
        name: 'Test Student',
        email: 'student@example.com',
        role: 'mahasiswa'
      });

      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      // First middleware: verifyToken
      verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();

      // Second middleware: verifyRole (dosen only)
      const roleMiddleware = verifyRole(['dosen']);
      roleMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledTimes(1); // Only called once by verifyToken
    });
  });
});
