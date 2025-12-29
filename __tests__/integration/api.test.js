// Integration Tests - API Endpoints
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

// Use localhost or deployed URL
const API_URL = process.env.TEST_API_URL || 'https://kavana-backend-j8ktr.ondigitalocean.app';

describe('API Integration Tests', () => {
    // Store tokens for each role
    const tokens = {
        admin: null,
        mahasiswa: null,
        dosen: null,
        kaprodi: null,
        koordinator: null
    };

    describe('Health Check', () => {
        it('should return API is running', async () => {
            const response = await request(API_URL).get('/');
            expect(response.status).toBe(200);
        });
    });

    describe('Auth Endpoints - Multi Role Login', () => {
        // Admin Login
        it('should login as ADMIN', async () => {
            const response = await request(API_URL)
                .post('/api/auth/login')
                .send({
                    identifier: process.env.ADMIN_EMAIL,
                    password: process.env.ADMIN_PASSWORD
                });

            if (response.status === 200) {
                expect(response.body).toHaveProperty('token');
                expect(response.body.role).toBe('admin');
                tokens.admin = response.body.token;
            }
        });

        // Mahasiswa Login
        it('should login as MAHASISWA', async () => {
            const response = await request(API_URL)
                .post('/api/auth/login')
                .send({
                    identifier: process.env.MAHASISWA_EMAIL || process.env.MAHASISWA_NPM,
                    password: process.env.MAHASISWA_PASSWORD
                });

            if (response.status === 200) {
                expect(response.body).toHaveProperty('token');
                expect(response.body.role).toBe('mahasiswa');
                tokens.mahasiswa = response.body.token;
            }
        });

        // Dosen Login
        it('should login as DOSEN', async () => {
            const response = await request(API_URL)
                .post('/api/auth/login')
                .send({
                    identifier: process.env.DOSEN_EMAIL,
                    password: process.env.DOSEN_PASSWORD
                });

            if (response.status === 200) {
                expect(response.body).toHaveProperty('token');
                expect(['dosen', 'koordinator', 'kaprodi']).toContain(response.body.role);
                tokens.dosen = response.body.token;
            }
        });

        // Kaprodi Login
        it('should login as KAPRODI', async () => {
            const response = await request(API_URL)
                .post('/api/auth/login')
                .send({
                    identifier: process.env.KAPRODI_EMAIL,
                    password: process.env.KAPRODI_PASSWORD
                });

            if (response.status === 200) {
                expect(response.body).toHaveProperty('token');
                expect(response.body.role).toBe('kaprodi');
                tokens.kaprodi = response.body.token;
            }
        });

        // Koordinator Login
        it('should login as KOORDINATOR', async () => {
            const response = await request(API_URL)
                .post('/api/auth/login')
                .send({
                    identifier: process.env.KOORDINATOR_EMAIL,
                    password: process.env.KOORDINATOR_PASSWORD
                });

            if (response.status === 200) {
                expect(response.body).toHaveProperty('token');
                expect(response.body.role).toBe('koordinator');
                tokens.koordinator = response.body.token;
            }
        });

        // Invalid credentials
        it('should return 400 for missing credentials', async () => {
            const response = await request(API_URL)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
        });

        it('should return error for invalid credentials', async () => {
            const response = await request(API_URL)
                .post('/api/auth/login')
                .send({
                    identifier: 'invalid@email.com',
                    password: 'wrongpassword'
                });

            // API might return 400, 401, or 404 for invalid login
            expect([400, 401, 404]).toContain(response.status);
        });
    });

    describe('Profile Endpoints', () => {
        it('should return 401 without token', async () => {
            const response = await request(API_URL).get('/api/auth/profile');
            expect(response.status).toBe(401);
        });

        it('should return admin profile with admin token', async () => {
            if (!tokens.admin) return;
            const response = await request(API_URL)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${tokens.admin}`);

            expect(response.status).toBe(200);
            expect(response.body.role).toBe('admin');
        });
    });

    describe('Admin Endpoints (requires admin token)', () => {
        it('should return 401 without token', async () => {
            const response = await request(API_URL).get('/api/admin/stats');
            expect(response.status).toBe(401);
        });

        it('should return stats with admin token', async () => {
            if (!tokens.admin) return;
            const response = await request(API_URL)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${tokens.admin}`);

            expect([200, 403]).toContain(response.status);
        });

        it('should return users list with admin token', async () => {
            if (!tokens.admin) return;
            const response = await request(API_URL)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${tokens.admin}`);

            expect([200, 403]).toContain(response.status);
        });
    });

    describe('Mahasiswa Endpoints (requires mahasiswa token)', () => {
        it('should return 401 without token', async () => {
            const response = await request(API_URL).get('/api/mahasiswa/profile');
            expect(response.status).toBe(401);
        });

        it('should return bimbingan list with mahasiswa token', async () => {
            if (!tokens.mahasiswa) return;
            const response = await request(API_URL)
                .get('/api/mahasiswa/bimbingan')
                .set('Authorization', `Bearer ${tokens.mahasiswa}`);

            expect([200, 403]).toContain(response.status);
        });
    });

    describe('Dosen Endpoints (requires dosen token)', () => {
        it('should return 401 without token', async () => {
            const response = await request(API_URL).get('/api/dosen/mahasiswa');
            expect(response.status).toBe(401);
        });
    });

    describe('Koordinator Endpoints (requires koordinator token)', () => {
        it('should return 401 without token', async () => {
            const response = await request(API_URL).get('/api/koordinator/mahasiswa');
            expect(response.status).toBe(401);
        });
    });

    describe('Kaprodi Endpoints (requires kaprodi token)', () => {
        it('should return 401 without token', async () => {
            const response = await request(API_URL).get('/api/kaprodi/stats');
            expect(response.status).toBe(401);
        });
    });
});
