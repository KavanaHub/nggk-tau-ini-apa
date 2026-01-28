// Comprehensive Tests for httpResponses.js with full coverage
import { describe, it, expect } from '@jest/globals';

// Direct imports for coverage
import {
    ERROR_MESSAGES,
    notFound,
    badRequest,
    unauthorized,
    forbidden,
    success,
    validateRequired,
    VALID_SEMESTERS,
    isValidSemester
} from '../../utils/httpResponses.js';

describe('HTTP Responses Utils - Full Coverage', () => {
    // Mock response object
    const createMockRes = () => ({
        statusCode: null,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; }
    });

    // ============================================
    // ERROR_MESSAGES
    // ============================================
    describe('ERROR_MESSAGES', () => {
        it('should have MAHASISWA_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.MAHASISWA_NOT_FOUND).toBe('Mahasiswa tidak ditemukan');
        });

        it('should have DOSEN_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.DOSEN_NOT_FOUND).toBe('Dosen tidak ditemukan');
        });

        it('should have KOORDINATOR_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.KOORDINATOR_NOT_FOUND).toBe('Koordinator tidak ditemukan');
        });

        it('should have KAPRODI_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.KAPRODI_NOT_FOUND).toBe('Kaprodi tidak ditemukan');
        });

        it('should have KELOMPOK_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.KELOMPOK_NOT_FOUND).toBe('Kelompok tidak ditemukan');
        });

        it('should have JADWAL_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.JADWAL_NOT_FOUND).toBe('Jadwal tidak ditemukan');
        });

        it('should have BIMBINGAN_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.BIMBINGAN_NOT_FOUND).toBe('Bimbingan tidak ditemukan');
        });

        it('should have USER_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.USER_NOT_FOUND).toBe('User not found');
        });

        it('should have PENGUJI_NOT_FOUND message', () => {
            expect(ERROR_MESSAGES.PENGUJI_NOT_FOUND).toBe('Penguji tidak ditemukan');
        });

        it('should have UNAUTHORIZED message', () => {
            expect(ERROR_MESSAGES.UNAUTHORIZED).toBe('Unauthorized');
        });

        it('should have FORBIDDEN message', () => {
            expect(ERROR_MESSAGES.FORBIDDEN).toBe('Forbidden');
        });

        it('should have BAD_REQUEST message', () => {
            expect(ERROR_MESSAGES.BAD_REQUEST).toBe('Bad request');
        });
    });

    // ============================================
    // notFound
    // ============================================
    describe('notFound', () => {
        it('should return 404 with default message', () => {
            const res = createMockRes();
            notFound(res);
            expect(res.statusCode).toBe(404);
            expect(res.data).toEqual({ message: ERROR_MESSAGES.USER_NOT_FOUND });
        });

        it('should return 404 with custom message', () => {
            const res = createMockRes();
            notFound(res, 'Custom not found');
            expect(res.statusCode).toBe(404);
            expect(res.data).toEqual({ message: 'Custom not found' });
        });

        it('should return 404 with MAHASISWA_NOT_FOUND message', () => {
            const res = createMockRes();
            notFound(res, ERROR_MESSAGES.MAHASISWA_NOT_FOUND);
            expect(res.statusCode).toBe(404);
            expect(res.data).toEqual({ message: 'Mahasiswa tidak ditemukan' });
        });
    });

    // ============================================
    // badRequest
    // ============================================
    describe('badRequest', () => {
        it('should return 400 with default message', () => {
            const res = createMockRes();
            badRequest(res);
            expect(res.statusCode).toBe(400);
            expect(res.data).toEqual({ message: ERROR_MESSAGES.BAD_REQUEST });
        });

        it('should return 400 with custom message', () => {
            const res = createMockRes();
            badRequest(res, 'Invalid input');
            expect(res.statusCode).toBe(400);
            expect(res.data).toEqual({ message: 'Invalid input' });
        });
    });

    // ============================================
    // unauthorized
    // ============================================
    describe('unauthorized', () => {
        it('should return 401 with default message', () => {
            const res = createMockRes();
            unauthorized(res);
            expect(res.statusCode).toBe(401);
            expect(res.data).toEqual({ message: ERROR_MESSAGES.UNAUTHORIZED });
        });

        it('should return 401 with custom message', () => {
            const res = createMockRes();
            unauthorized(res, 'Token expired');
            expect(res.statusCode).toBe(401);
            expect(res.data).toEqual({ message: 'Token expired' });
        });
    });

    // ============================================
    // forbidden
    // ============================================
    describe('forbidden', () => {
        it('should return 403 with default message', () => {
            const res = createMockRes();
            forbidden(res);
            expect(res.statusCode).toBe(403);
            expect(res.data).toEqual({ message: ERROR_MESSAGES.FORBIDDEN });
        });

        it('should return 403 with custom message', () => {
            const res = createMockRes();
            forbidden(res, 'Access denied');
            expect(res.statusCode).toBe(403);
            expect(res.data).toEqual({ message: 'Access denied' });
        });
    });

    // ============================================
    // success
    // ============================================
    describe('success', () => {
        it('should return data when provided', () => {
            const res = createMockRes();
            const data = { id: 1, name: 'Test' };
            success(res, data);
            expect(res.data).toEqual(data);
        });

        it('should return message when data is null', () => {
            const res = createMockRes();
            success(res, null);
            expect(res.data).toEqual({ message: 'Success' });
        });

        it('should return message when data is undefined', () => {
            const res = createMockRes();
            success(res);
            expect(res.data).toEqual({ message: 'Success' });
        });

        it('should return array data', () => {
            const res = createMockRes();
            const data = [{ id: 1 }, { id: 2 }];
            success(res, data);
            expect(res.data).toEqual(data);
        });

        it('should return custom message when data is null', () => {
            const res = createMockRes();
            success(res, null, 'Operation completed');
            expect(res.data).toEqual({ message: 'Operation completed' });
        });
    });

    // ============================================
    // validateRequired
    // ============================================
    describe('validateRequired', () => {
        it('should return null when all fields are present', () => {
            const res = createMockRes();
            const result = validateRequired(res, ['nama', 'email'], ['John', 'john@email.com']);
            expect(result).toBeNull();
        });

        it('should return 400 when one field is missing', () => {
            const res = createMockRes();
            validateRequired(res, ['nama', 'email'], ['John', null]);
            expect(res.statusCode).toBe(400);
            expect(res.data.message).toContain('email');
        });

        it('should return 400 when multiple fields are missing', () => {
            const res = createMockRes();
            validateRequired(res, ['nama', 'email', 'npm'], [null, null, '123']);
            expect(res.statusCode).toBe(400);
            expect(res.data.message).toContain('nama');
            expect(res.data.message).toContain('email');
        });

        it('should return 400 when all fields are missing', () => {
            const res = createMockRes();
            validateRequired(res, ['nama', 'email'], [undefined, undefined]);
            expect(res.statusCode).toBe(400);
        });

        it('should return null for empty string (truthy check)', () => {
            const res = createMockRes();
            validateRequired(res, ['nama'], ['']);
            expect(res.statusCode).toBe(400);
        });

        it('should work with single field', () => {
            const res = createMockRes();
            const result = validateRequired(res, ['id'], [1]);
            expect(result).toBeNull();
        });
    });

    // ============================================
    // VALID_SEMESTERS
    // ============================================
    describe('VALID_SEMESTERS', () => {
        it('should contain 5 valid semesters', () => {
            expect(VALID_SEMESTERS.length).toBe(5);
        });

        it('should contain semester 2', () => {
            expect(VALID_SEMESTERS).toContain(2);
        });

        it('should contain semester 3', () => {
            expect(VALID_SEMESTERS).toContain(3);
        });

        it('should contain semester 5', () => {
            expect(VALID_SEMESTERS).toContain(5);
        });

        it('should contain semester 7', () => {
            expect(VALID_SEMESTERS).toContain(7);
        });

        it('should contain semester 8', () => {
            expect(VALID_SEMESTERS).toContain(8);
        });

        it('should not contain semester 1', () => {
            expect(VALID_SEMESTERS).not.toContain(1);
        });

        it('should not contain semester 4', () => {
            expect(VALID_SEMESTERS).not.toContain(4);
        });

        it('should not contain semester 6', () => {
            expect(VALID_SEMESTERS).not.toContain(6);
        });
    });

    // ============================================
    // isValidSemester
    // ============================================
    describe('isValidSemester', () => {
        it('should return true for semester 2', () => {
            expect(isValidSemester(2)).toBe(true);
        });

        it('should return true for semester 3', () => {
            expect(isValidSemester(3)).toBe(true);
        });

        it('should return true for semester 5', () => {
            expect(isValidSemester(5)).toBe(true);
        });

        it('should return true for semester 7', () => {
            expect(isValidSemester(7)).toBe(true);
        });

        it('should return true for semester 8', () => {
            expect(isValidSemester(8)).toBe(true);
        });

        it('should return false for semester 1', () => {
            expect(isValidSemester(1)).toBe(false);
        });

        it('should return false for semester 4', () => {
            expect(isValidSemester(4)).toBe(false);
        });

        it('should return false for semester 6', () => {
            expect(isValidSemester(6)).toBe(false);
        });

        it('should return false for semester 9', () => {
            expect(isValidSemester(9)).toBe(false);
        });

        it('should return false for null', () => {
            expect(isValidSemester(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isValidSemester(undefined)).toBe(false);
        });

        it('should return false for string', () => {
            expect(isValidSemester('2')).toBe(false);
        });
    });
});
