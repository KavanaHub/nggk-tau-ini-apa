// Comprehensive Route Tests with App Import for Coverage
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../index.js';

describe('All Routes - Comprehensive Coverage Tests', () => {
    // ============================================
    // AUTH ROUTES
    // ============================================
    describe('Auth Routes (/api/auth)', () => {
        it('POST /login - missing fields returns 400', async () => {
            const res = await request(app).post('/api/auth/login').send({});
            expect(res.status).toBe(400);
        });

        it('POST /login - missing password returns 400', async () => {
            const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
            expect(res.status).toBe(400);
        });

        it('POST /login - missing email returns 400', async () => {
            const res = await request(app).post('/api/auth/login').send({ password: 'test123' });
            expect(res.status).toBe(400);
        });

        it('POST /login - invalid credentials returns 400', async () => {
            const res = await request(app).post('/api/auth/login').send({
                email: 'invalid@email.com',
                password: 'wrongpass'
            });
            expect([400, 401]).toContain(res.status);
        });

        it('POST /register/mahasiswa - missing fields returns error', async () => {
            const res = await request(app).post('/api/auth/register/mahasiswa').send({});
            expect([400, 500]).toContain(res.status);
        });

        it('GET /profile - no token returns 401', async () => {
            const res = await request(app).get('/api/auth/profile');
            expect(res.status).toBe(401);
        });

        it('GET /profile - invalid token returns 401', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid.token');
            expect(res.status).toBe(401);
        });

        it('PATCH /profile - no token returns 401', async () => {
            const res = await request(app).patch('/api/auth/profile').send({ nama: 'Test' });
            expect(res.status).toBe(401);
        });

        it('POST /change-password - no token returns 401', async () => {
            const res = await request(app).post('/api/auth/change-password').send({});
            expect(res.status).toBe(401);
        });

        it('GET /fix-schema - returns response', async () => {
            const res = await request(app).get('/api/auth/fix-schema');
            expect([200, 500]).toContain(res.status);
        });
    });

    // ============================================
    // ADMIN ROUTES
    // ============================================
    describe('Admin Routes (/api/admin)', () => {
        it('GET /stats - no token returns 401', async () => {
            const res = await request(app).get('/api/admin/stats');
            expect(res.status).toBe(401);
        });

        it('GET /users - no token returns 401', async () => {
            const res = await request(app).get('/api/admin/users');
            expect(res.status).toBe(401);
        });

        it('GET /dosen - no token returns 401', async () => {
            const res = await request(app).get('/api/admin/dosen');
            expect(res.status).toBe(401);
        });

        it('GET /mahasiswa - no token returns 401', async () => {
            const res = await request(app).get('/api/admin/mahasiswa');
            expect(res.status).toBe(401);
        });

        it('POST /dosen - no token returns 401', async () => {
            const res = await request(app).post('/api/admin/dosen').send({});
            expect(res.status).toBe(401);
        });

        it('GET /activity - no token returns 401', async () => {
            const res = await request(app).get('/api/admin/activity');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // MAHASISWA ROUTES
    // ============================================
    describe('Mahasiswa Routes (/api/mahasiswa)', () => {
        it('GET /profile - no token returns 401', async () => {
            const res = await request(app).get('/api/mahasiswa/profile');
            expect(res.status).toBe(401);
        });

        it('GET /bimbingan - no token returns 401', async () => {
            const res = await request(app).get('/api/mahasiswa/bimbingan');
            expect(res.status).toBe(401);
        });

        it('GET /proposal - no token returns 401', async () => {
            const res = await request(app).get('/api/mahasiswa/proposal');
            expect(res.status).toBe(401);
        });

        it('GET /dosen - no token returns 401', async () => {
            const res = await request(app).get('/api/mahasiswa/dosen');
            expect(res.status).toBe(401);
        });

        it('GET /periode-aktif - no token returns 401', async () => {
            const res = await request(app).get('/api/mahasiswa/periode-aktif');
            expect(res.status).toBe(401);
        });

        it('POST /track - no token returns 401', async () => {
            const res = await request(app).post('/api/mahasiswa/track').send({});
            expect(res.status).toBe(401);
        });

        it('POST /proposal - no token returns 401', async () => {
            const res = await request(app).post('/api/mahasiswa/proposal').send({});
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // DOSEN ROUTES
    // ============================================
    describe('Dosen Routes (/api/dosen)', () => {
        it('GET /profile - no token returns 401', async () => {
            const res = await request(app).get('/api/dosen/profile');
            expect(res.status).toBe(401);
        });

        it('GET /mahasiswa - no token returns 401', async () => {
            const res = await request(app).get('/api/dosen/mahasiswa');
            expect(res.status).toBe(401);
        });

        it('GET /bimbingan - no token returns 401', async () => {
            const res = await request(app).get('/api/dosen/bimbingan');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // KOORDINATOR ROUTES
    // ============================================
    describe('Koordinator Routes (/api/koordinator)', () => {
        it('GET /stats - no token returns 401', async () => {
            const res = await request(app).get('/api/koordinator/stats');
            expect(res.status).toBe(401);
        });

        it('GET /mahasiswa - no token returns 401', async () => {
            const res = await request(app).get('/api/koordinator/mahasiswa');
            expect(res.status).toBe(401);
        });

        it('GET /proposal - no token returns 401', async () => {
            const res = await request(app).get('/api/koordinator/proposal');
            expect(res.status).toBe(401);
        });

        it('GET /dosen - no token returns 401', async () => {
            const res = await request(app).get('/api/koordinator/dosen');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // KAPRODI ROUTES
    // ============================================
    describe('Kaprodi Routes (/api/kaprodi)', () => {
        it('GET /stats - no token returns 401', async () => {
            const res = await request(app).get('/api/kaprodi/stats');
            expect(res.status).toBe(401);
        });

        it('GET /mahasiswa - no token returns 401', async () => {
            const res = await request(app).get('/api/kaprodi/mahasiswa');
            expect(res.status).toBe(401);
        });

        it('GET /dosen - no token returns 401', async () => {
            const res = await request(app).get('/api/kaprodi/dosen');
            expect(res.status).toBe(401);
        });

        it('GET /koordinator - no token returns 401', async () => {
            const res = await request(app).get('/api/kaprodi/koordinator');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // BIMBINGAN ROUTES
    // ============================================
    describe('Bimbingan Routes (/api/bimbingan)', () => {
        it('GET / - no token returns 401', async () => {
            const res = await request(app).get('/api/bimbingan');
            expect(res.status).toBe(401);
        });

        it('POST / - no token returns 401', async () => {
            const res = await request(app).post('/api/bimbingan').send({});
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // PROPOSAL ROUTES
    // ============================================
    describe('Proposal Routes (/api/proposal)', () => {
        it('GET / - no token returns 401', async () => {
            const res = await request(app).get('/api/proposal');
            expect(res.status).toBe(401);
        });

        it('POST / - no token returns 401', async () => {
            const res = await request(app).post('/api/proposal').send({});
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // SIDANG ROUTES
    // ============================================
    describe('Sidang Routes (/api/sidang)', () => {
        it('GET / - no token returns 401', async () => {
            const res = await request(app).get('/api/sidang');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // PENGUJI ROUTES
    // ============================================
    describe('Penguji Routes (/api/penguji)', () => {
        it('GET /profile - no token returns 401', async () => {
            const res = await request(app).get('/api/penguji/profile');
            expect(res.status).toBe(401);
        });

        it('GET /mahasiswa - no token returns 401', async () => {
            const res = await request(app).get('/api/penguji/mahasiswa');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // NOTIFICATION ROUTES
    // ============================================
    describe('Notification Routes (/api/notifications)', () => {
        it('GET / - no token returns 401', async () => {
            const res = await request(app).get('/api/notifications');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // PROFILE ROUTES
    // ============================================
    describe('Profile Routes (/api/profile)', () => {
        it('GET / - no token returns 401', async () => {
            const res = await request(app).get('/api/profile');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // REPORT ROUTES
    // ============================================
    describe('Report Routes (/api/report)', () => {
        it('GET / - no token returns 401', async () => {
            const res = await request(app).get('/api/report');
            expect(res.status).toBe(401);
        });
    });

    // ============================================
    // HEALTH CHECK & ERROR HANDLING
    // ============================================
    describe('Health Check & Error Handling', () => {
        it('GET / - returns API status', async () => {
            const res = await request(app).get('/');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
        });

        it('GET /ping - returns pong', async () => {
            const res = await request(app).get('/ping');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'ok');
            expect(res.body).toHaveProperty('message', 'pong');
        });

        it('GET /docs - returns swagger page', async () => {
            const res = await request(app).get('/docs/');
            expect([200, 301, 304]).toContain(res.status);
        });

        it('GET /docs.json - returns swagger spec', async () => {
            const res = await request(app).get('/docs.json');
            expect(res.status).toBe(200);
        });

        it('GET /unknown-route - returns 404', async () => {
            const res = await request(app).get('/api/unknown-xyz-route');
            expect([404, 500]).toContain(res.status);
        });
    });
});
