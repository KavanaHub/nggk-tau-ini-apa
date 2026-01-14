import { describe, it, expect, jest } from '@jest/globals';
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

describe('HTTP Response Helpers', () => {
    const mockRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    describe('ERROR_MESSAGES', () => {
        it('should have common error messages', () => {
            expect(ERROR_MESSAGES.MAHASISWA_NOT_FOUND).toBe('Mahasiswa tidak ditemukan');
            expect(ERROR_MESSAGES.DOSEN_NOT_FOUND).toBe('Dosen tidak ditemukan');
            expect(ERROR_MESSAGES.USER_NOT_FOUND).toBe('User not found');
        });
    });

    describe('notFound', () => {
        it('should return 404 with default message', () => {
            const res = mockRes();
            notFound(res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should return 404 with custom message', () => {
            const res = mockRes();
            notFound(res, 'Custom not found');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Custom not found' });
        });
    });

    describe('badRequest', () => {
        it('should return 400 with message', () => {
            const res = mockRes();
            badRequest(res, 'Invalid input');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
        });
    });

    describe('unauthorized', () => {
        it('should return 401 with message', () => {
            const res = mockRes();
            unauthorized(res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });
    });

    describe('forbidden', () => {
        it('should return 403 with message', () => {
            const res = mockRes();
            forbidden(res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
        });
    });

    describe('success', () => {
        it('should return data when provided', () => {
            const res = mockRes();
            success(res, { id: 1, name: 'Test' });
            expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Test' });
        });

        it('should return message when no data', () => {
            const res = mockRes();
            success(res, null, 'Operation successful');
            expect(res.json).toHaveBeenCalledWith({ message: 'Operation successful' });
        });
    });

    describe('validateRequired', () => {
        it('should return null when all fields present', () => {
            const res = mockRes();
            const result = validateRequired(res, ['name', 'email'], ['John', 'john@test.com']);
            expect(result).toBeNull();
        });

        it('should return 400 when fields missing', () => {
            const res = mockRes();
            validateRequired(res, ['name', 'email'], ['John', '']);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('VALID_SEMESTERS', () => {
        it('should contain all valid semesters', () => {
            expect(VALID_SEMESTERS).toEqual([2, 3, 5, 7, 8]);
        });
    });

    describe('isValidSemester', () => {
        it('should return true for valid semesters', () => {
            expect(isValidSemester(2)).toBe(true);
            expect(isValidSemester(3)).toBe(true);
            expect(isValidSemester(5)).toBe(true);
            expect(isValidSemester(7)).toBe(true);
            expect(isValidSemester(8)).toBe(true);
        });

        it('should return false for invalid semesters', () => {
            expect(isValidSemester(1)).toBe(false);
            expect(isValidSemester(4)).toBe(false);
            expect(isValidSemester(6)).toBe(false);
            expect(isValidSemester(99)).toBe(false);
        });
    });
});
