import { describe, it, expect, jest } from '@jest/globals';
import {
    ERROR_MESSAGES,
    notFound,
    badRequest,
    unauthorized,
    forbidden,
    success
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
});
