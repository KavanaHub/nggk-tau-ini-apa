// Test utils to generate coverage
import { describe, it, expect } from '@jest/globals';

// Direct imports for coverage
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateToken } from '../../utils/jwt.js';

describe('Password Utils - Coverage', () => {
    describe('hashPassword', () => {
        it('should be a function', () => {
            expect(typeof hashPassword).toBe('function');
        });

        it('should hash a password', async () => {
            const password = 'testpassword123';
            const hash = await hashPassword(password);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });
    });

    describe('comparePassword', () => {
        it('should be a function', () => {
            expect(typeof comparePassword).toBe('function');
        });

        it('should return true for matching passwords', async () => {
            const password = 'testpassword123';
            const hash = await hashPassword(password);
            const isMatch = await comparePassword(password, hash);
            expect(isMatch).toBe(true);
        });

        it('should return false for non-matching passwords', async () => {
            const password = 'testpassword123';
            const hash = await hashPassword(password);
            const isMatch = await comparePassword('wrongpassword', hash);
            expect(isMatch).toBe(false);
        });
    });
});

describe('JWT Utils - Coverage', () => {
    describe('generateToken', () => {
        it('should be a function', () => {
            expect(typeof generateToken).toBe('function');
        });

        it('should generate a token', () => {
            const payload = { id: 1, role: 'mahasiswa' };
            const token = generateToken(payload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // JWT has 3 parts
        });

        it('should generate different tokens for different payloads', () => {
            const token1 = generateToken({ id: 1, role: 'mahasiswa' });
            const token2 = generateToken({ id: 2, role: 'dosen' });
            expect(token1).not.toBe(token2);
        });
    });
});
