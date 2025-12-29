// Comprehensive Middleware Tests for high coverage
import { describe, it, expect } from '@jest/globals';

// Direct imports for coverage
import authMiddleware from '../../middleware/auth.js';
import requireRole, { kaprodiOnly } from '../../middleware/role.js';
import { upload, parseMultipart } from '../../middleware/upload.js';

describe('Auth Middleware - Full Coverage', () => {
    const createMockRes = () => ({
        statusCode: null,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; }
    });

    it('should be a function', () => {
        expect(typeof authMiddleware).toBe('function');
    });

    it('should return 401 when no authorization header', () => {
        const req = { headers: {} };
        const res = createMockRes();
        const next = () => { };
        authMiddleware(req, res, next);
        expect(res.statusCode).toBe(401);
    });

    it('should return 401 when authorization has no Bearer prefix', () => {
        const req = { headers: { authorization: 'InvalidFormat token' } };
        const res = createMockRes();
        const next = () => { };
        authMiddleware(req, res, next);
        expect(res.statusCode).toBe(401);
    });

    it('should return 401 for invalid JWT token', () => {
        const req = { headers: { authorization: 'Bearer invalid.token.here' } };
        const res = createMockRes();
        const next = () => { };
        authMiddleware(req, res, next);
        expect(res.statusCode).toBe(401);
    });

    it('should return 401 for empty Bearer token', () => {
        const req = { headers: { authorization: 'Bearer ' } };
        const res = createMockRes();
        const next = () => { };
        authMiddleware(req, res, next);
        expect(res.statusCode).toBe(401);
    });
});

describe('Role Middleware - Full Coverage', () => {
    const createMockRes = () => ({
        statusCode: null,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; }
    });

    describe('requireRole', () => {
        it('should be a function', () => {
            expect(typeof requireRole).toBe('function');
        });

        it('should return 403 when no user in request', () => {
            const middleware = requireRole('admin');
            const req = {};
            const res = createMockRes();
            const next = () => { };
            middleware(req, res, next);
            expect(res.statusCode).toBe(403);
        });

        it('should allow admin to access any route', () => {
            const middleware = requireRole('mahasiswa');
            const req = { user: { role: 'admin' } };
            const res = createMockRes();
            let nextCalled = false;
            const next = () => { nextCalled = true; };
            middleware(req, res, next);
            expect(nextCalled).toBe(true);
        });

        it('should allow koordinator to access dosen routes', () => {
            const middleware = requireRole('dosen');
            const req = { user: { role: 'koordinator' } };
            const res = createMockRes();
            let nextCalled = false;
            const next = () => { nextCalled = true; };
            middleware(req, res, next);
            expect(nextCalled).toBe(true);
        });

        it('should allow user with matching role', () => {
            const middleware = requireRole('mahasiswa');
            const req = { user: { role: 'mahasiswa' } };
            const res = createMockRes();
            let nextCalled = false;
            const next = () => { nextCalled = true; };
            middleware(req, res, next);
            expect(nextCalled).toBe(true);
        });

        it('should return 403 for wrong role', () => {
            const middleware = requireRole('admin');
            const req = { user: { role: 'mahasiswa' } };
            const res = createMockRes();
            const next = () => { };
            middleware(req, res, next);
            expect(res.statusCode).toBe(403);
        });

        it('should work with multiple roles', () => {
            const middleware = requireRole('mahasiswa', 'dosen');
            const req = { user: { role: 'dosen' } };
            const res = createMockRes();
            let nextCalled = false;
            const next = () => { nextCalled = true; };
            middleware(req, res, next);
            expect(nextCalled).toBe(true);
        });
    });

    describe('kaprodiOnly', () => {
        it('should be a function', () => {
            expect(typeof kaprodiOnly).toBe('function');
        });

        it('should return 403 when no user', () => {
            const middleware = kaprodiOnly();
            const req = {};
            const res = createMockRes();
            const next = () => { };
            middleware(req, res, next);
            expect(res.statusCode).toBe(403);
        });

        it('should return 403 for non-kaprodi users', () => {
            const middleware = kaprodiOnly();
            const req = { user: { role: 'admin' } };
            const res = createMockRes();
            const next = () => { };
            middleware(req, res, next);
            expect(res.statusCode).toBe(403);
        });

        it('should allow kaprodi', () => {
            const middleware = kaprodiOnly();
            const req = { user: { role: 'kaprodi' } };
            const res = createMockRes();
            let nextCalled = false;
            const next = () => { nextCalled = true; };
            middleware(req, res, next);
            expect(nextCalled).toBe(true);
        });
    });
});

describe('Upload Middleware - Coverage', () => {
    it('should export upload function', () => {
        expect(upload).toBeDefined();
        expect(upload.single).toBeDefined();
        expect(upload.array).toBeDefined();
    });

    it('should export parseMultipart function', () => {
        expect(typeof parseMultipart).toBe('function');
    });

    it('parseMultipart should skip if file already exists', () => {
        const req = { file: { name: 'test.pdf' }, headers: {} };
        const res = {};
        let nextCalled = false;
        const next = () => { nextCalled = true; };
        parseMultipart(req, res, next);
        expect(nextCalled).toBe(true);
    });

    it('parseMultipart should skip if not multipart', () => {
        const req = { headers: { 'content-type': 'application/json' } };
        const res = {};
        let nextCalled = false;
        const next = () => { nextCalled = true; };
        parseMultipart(req, res, next);
        expect(nextCalled).toBe(true);
    });
});
