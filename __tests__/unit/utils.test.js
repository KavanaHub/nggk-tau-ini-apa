// Comprehensive Utils Tests for Coverage
import { describe, it, expect } from '@jest/globals';

// Direct imports for coverage
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';
import {
    STATUS_PROPOSAL,
    STATUS_BIMBINGAN,
    TRACK_OPTIONS,
    ROLE_MAHASISWA,
    ROLE_DOSEN,
    ROLE_KOORDINATOR,
    ROLE_KAPRODI,
    ROLE_ADMIN,
    getStatusLabel,
    getTrackLabel,
    isValidStatus,
    isValidTrack
} from '../../utils/constants.js';
import {
    successResponse,
    errorResponse,
    createdResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse,
    validationErrorResponse
} from '../../utils/httpResponses.js';

// ============================================
// PASSWORD UTILS
// ============================================
describe('Password Utils', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'testPassword123';
            const hash = await hashPassword(password);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'testPassword123';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);
            expect(hash1).not.toBe(hash2); // Different salts
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            const password = 'testPassword123';
            const hash = await hashPassword(password);
            const result = await comparePassword(password, hash);
            expect(result).toBe(true);
        });

        it('should return false for non-matching password', async () => {
            const password = 'testPassword123';
            const hash = await hashPassword(password);
            const result = await comparePassword('wrongPassword', hash);
            expect(result).toBe(false);
        });
    });
});

// ============================================
// JWT UTILS
// ============================================
describe('JWT Utils', () => {
    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const user = { id: 1, role: 'mahasiswa' };
            const token = generateToken(user);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // JWT format: header.payload.signature
        });

        it('should generate different tokens for different users', () => {
            const user1 = { id: 1, role: 'mahasiswa' };
            const user2 = { id: 2, role: 'dosen' };
            const token1 = generateToken(user1);
            const token2 = generateToken(user2);
            expect(token1).not.toBe(token2);
        });

        it('should generate token for admin role', () => {
            const user = { id: 0, role: 'admin' };
            const token = generateToken(user);
            expect(token).toBeDefined();
        });
    });
});

// ============================================
// CONSTANTS
// ============================================
describe('Constants', () => {
    describe('Status Constants', () => {
        it('should have STATUS_PROPOSAL defined', () => {
            expect(STATUS_PROPOSAL).toBeDefined();
            expect(typeof STATUS_PROPOSAL).toBe('object');
        });

        it('should have STATUS_BIMBINGAN defined', () => {
            expect(STATUS_BIMBINGAN).toBeDefined();
            expect(typeof STATUS_BIMBINGAN).toBe('object');
        });

        it('should have TRACK_OPTIONS defined', () => {
            expect(TRACK_OPTIONS).toBeDefined();
            expect(Array.isArray(TRACK_OPTIONS)).toBe(true);
        });
    });

    describe('Role Constants', () => {
        it('should have all role constants defined', () => {
            expect(ROLE_MAHASISWA).toBe('mahasiswa');
            expect(ROLE_DOSEN).toBe('dosen');
            expect(ROLE_KOORDINATOR).toBe('koordinator');
            expect(ROLE_KAPRODI).toBe('kaprodi');
            expect(ROLE_ADMIN).toBe('admin');
        });
    });

    describe('getStatusLabel', () => {
        it('should return label for valid status', () => {
            const label = getStatusLabel('pending');
            expect(label).toBeDefined();
        });

        it('should handle unknown status', () => {
            const label = getStatusLabel('unknown_status');
            expect(label).toBeDefined();
        });
    });

    describe('getTrackLabel', () => {
        it('should return label for valid track', () => {
            const label = getTrackLabel('skripsi');
            expect(label).toBeDefined();
        });

        it('should handle unknown track', () => {
            const label = getTrackLabel('unknown_track');
            expect(label).toBeDefined();
        });
    });

    describe('isValidStatus', () => {
        it('should return true for valid status', () => {
            expect(isValidStatus('pending')).toBe(true);
        });

        it('should return false for invalid status', () => {
            expect(isValidStatus('invalid_status_xyz')).toBe(false);
        });
    });

    describe('isValidTrack', () => {
        it('should return true for valid track', () => {
            expect(isValidTrack('skripsi')).toBe(true);
        });

        it('should return false for invalid track', () => {
            expect(isValidTrack('invalid_track_xyz')).toBe(false);
        });
    });
});

// ============================================
// HTTP RESPONSES
// ============================================
describe('HTTP Response Utils', () => {
    const mockRes = () => {
        const res = {
            statusCode: null,
            data: null,
            status: function (code) { this.statusCode = code; return this; },
            json: function (data) { this.data = data; return this; }
        };
        return res;
    };

    describe('successResponse', () => {
        it('should return 200 with data', () => {
            const res = mockRes();
            successResponse(res, { test: 'data' });
            expect(res.statusCode).toBe(200);
            expect(res.data).toHaveProperty('success', true);
        });

        it('should include message if provided', () => {
            const res = mockRes();
            successResponse(res, { test: 'data' }, 'Success message');
            expect(res.data).toHaveProperty('message', 'Success message');
        });
    });

    describe('errorResponse', () => {
        it('should return error with status code', () => {
            const res = mockRes();
            errorResponse(res, 'Error message', 500);
            expect(res.statusCode).toBe(500);
            expect(res.data).toHaveProperty('success', false);
            expect(res.data).toHaveProperty('message', 'Error message');
        });

        it('should default to 500 status', () => {
            const res = mockRes();
            errorResponse(res, 'Error message');
            expect(res.statusCode).toBe(500);
        });
    });

    describe('createdResponse', () => {
        it('should return 201 with data', () => {
            const res = mockRes();
            createdResponse(res, { id: 1 });
            expect(res.statusCode).toBe(201);
            expect(res.data).toHaveProperty('success', true);
        });
    });

    describe('notFoundResponse', () => {
        it('should return 404', () => {
            const res = mockRes();
            notFoundResponse(res, 'Not found');
            expect(res.statusCode).toBe(404);
            expect(res.data).toHaveProperty('success', false);
        });

        it('should use default message', () => {
            const res = mockRes();
            notFoundResponse(res);
            expect(res.statusCode).toBe(404);
        });
    });

    describe('unauthorizedResponse', () => {
        it('should return 401', () => {
            const res = mockRes();
            unauthorizedResponse(res, 'Unauthorized');
            expect(res.statusCode).toBe(401);
            expect(res.data).toHaveProperty('success', false);
        });

        it('should use default message', () => {
            const res = mockRes();
            unauthorizedResponse(res);
            expect(res.statusCode).toBe(401);
        });
    });

    describe('forbiddenResponse', () => {
        it('should return 403', () => {
            const res = mockRes();
            forbiddenResponse(res, 'Forbidden');
            expect(res.statusCode).toBe(403);
            expect(res.data).toHaveProperty('success', false);
        });

        it('should use default message', () => {
            const res = mockRes();
            forbiddenResponse(res);
            expect(res.statusCode).toBe(403);
        });
    });

    describe('validationErrorResponse', () => {
        it('should return 400 with errors', () => {
            const res = mockRes();
            validationErrorResponse(res, ['Error 1', 'Error 2']);
            expect(res.statusCode).toBe(400);
            expect(res.data).toHaveProperty('success', false);
            expect(res.data).toHaveProperty('errors');
        });
    });
});
