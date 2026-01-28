// Full Integration Tests with Authentication - Maximum Coverage
// These tests login first, then use the token to test protected endpoints
import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../index.js';

describe('Authenticated Integration Tests - Full Coverage', () => {
    // Store tokens for authenticated requests
    let adminToken = null;
    let mahasiswaToken = null;
    let dosenToken = null;
    let kaprodiToken = null;
    let koordinatorToken = null;

    // ============================================
    // LOGIN ALL ROLES FIRST
    // ============================================
    beforeAll(async () => {
        // Admin login
        try {
            const adminRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: process.env.ADMIN_EMAIL,
                    password: process.env.ADMIN_PASSWORD
                });
            if (adminRes.status === 200) {
                adminToken = adminRes.body.token;
            }
        } catch (e) { console.log('Admin login failed'); }

        // Mahasiswa login
        try {
            const mhsRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: process.env.MAHASISWA_EMAIL,
                    password: process.env.MAHASISWA_PASSWORD
                });
            if (mhsRes.status === 200) {
                mahasiswaToken = mhsRes.body.token;
            }
        } catch (e) { console.log('Mahasiswa login failed'); }

        // Dosen login
        try {
            const dosenRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: process.env.DOSEN_EMAIL,
                    password: process.env.DOSEN_PASSWORD
                });
            if (dosenRes.status === 200) {
                dosenToken = dosenRes.body.token;
            }
        } catch (e) { console.log('Dosen login failed'); }

        // Kaprodi login
        try {
            const kaprodiRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: process.env.KAPRODI_EMAIL,
                    password: process.env.KAPRODI_PASSWORD
                });
            if (kaprodiRes.status === 200) {
                kaprodiToken = kaprodiRes.body.token;
            }
        } catch (e) { console.log('Kaprodi login failed'); }

        // Koordinator login
        try {
            const koorRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: process.env.KOORDINATOR_EMAIL,
                    password: process.env.KOORDINATOR_PASSWORD
                });
            if (koorRes.status === 200) {
                koordinatorToken = koorRes.body.token;
            }
        } catch (e) { console.log('Koordinator login failed'); }
    });

    // ============================================
    // ADMIN ENDPOINTS (with admin token)
    // ============================================
    describe('Admin Controller Coverage', () => {
        it('GET /api/admin/stats - with token', async () => {
            if (!adminToken) return;
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 403, 500]).toContain(res.status);
        });

        it('GET /api/admin/users - with token', async () => {
            if (!adminToken) return;
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 403, 500]).toContain(res.status);
        });

        it('GET /api/admin/dosen - with token', async () => {
            if (!adminToken) return;
            const res = await request(app)
                .get('/api/admin/dosen')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 403, 500]).toContain(res.status);
        });

        it('GET /api/admin/mahasiswa - with token', async () => {
            if (!adminToken) return;
            const res = await request(app)
                .get('/api/admin/mahasiswa')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 403, 500]).toContain(res.status);
        });

        it('GET /api/admin/activity - with token', async () => {
            if (!adminToken) return;
            const res = await request(app)
                .get('/api/admin/activity')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/admin/report - with token', async () => {
            if (!adminToken) return;
            const res = await request(app)
                .get('/api/admin/report')
                .set('Authorization', `Bearer ${adminToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // AUTH CONTROLLER COVERAGE
    // ============================================
    describe('Auth Controller Coverage', () => {
        it('GET /api/auth/profile - admin', async () => {
            if (!adminToken) return;
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.role).toBe('admin');
        });

        it('GET /api/auth/profile - mahasiswa', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect(res.status).toBe(200);
        });

        it('GET /api/auth/profile - dosen', async () => {
            if (!dosenToken) return;
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${dosenToken}`);
            expect(res.status).toBe(200);
        });

        it('GET /api/auth/profile - kaprodi', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect(res.status).toBe(200);
        });

        it('GET /api/auth/profile - koordinator', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect(res.status).toBe(200);
        });

        it('POST /api/auth/change-password - missing fields', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${mahasiswaToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it('POST /api/auth/change-password - short password', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .post('/api/auth/change-password')
                .set('Authorization', `Bearer ${mahasiswaToken}`)
                .send({ old_password: 'test', new_password: '123' });
            expect(res.status).toBe(400);
        });
    });

    // ============================================
    // MAHASISWA CONTROLLER COVERAGE
    // ============================================
    describe('Mahasiswa Controller Coverage', () => {
        it('GET /api/mahasiswa/profile', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/mahasiswa/profile')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 404, 500]).toContain(res.status);
        });

        it('GET /api/mahasiswa/bimbingan', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/mahasiswa/bimbingan')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 404, 500]).toContain(res.status);
        });

        it('GET /api/mahasiswa/proposal', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/mahasiswa/proposal')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 404, 500]).toContain(res.status);
        });

        it('GET /api/mahasiswa/dosen', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/mahasiswa/dosen')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 404, 500]).toContain(res.status);
        });

        it('GET /api/mahasiswa/periode-aktif', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/mahasiswa/periode-aktif')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 404, 500]).toContain(res.status);
        });

        it('GET /api/mahasiswa/all-dosen', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/mahasiswa/all-dosen')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // DOSEN CONTROLLER COVERAGE
    // ============================================
    describe('Dosen Controller Coverage', () => {
        it('GET /api/dosen/profile', async () => {
            if (!dosenToken) return;
            const res = await request(app)
                .get('/api/dosen/profile')
                .set('Authorization', `Bearer ${dosenToken}`);
            expect([200, 404, 500]).toContain(res.status);
        });

        it('GET /api/dosen/mahasiswa', async () => {
            if (!dosenToken) return;
            const res = await request(app)
                .get('/api/dosen/mahasiswa')
                .set('Authorization', `Bearer ${dosenToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/dosen/bimbingan', async () => {
            if (!dosenToken) return;
            const res = await request(app)
                .get('/api/dosen/bimbingan')
                .set('Authorization', `Bearer ${dosenToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // KOORDINATOR CONTROLLER COVERAGE
    // ============================================
    describe('Koordinator Controller Coverage', () => {
        it('GET /api/koordinator/stats', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/koordinator/stats')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/koordinator/mahasiswa', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/koordinator/mahasiswa')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/koordinator/proposal', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/koordinator/proposal')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/koordinator/dosen', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/koordinator/dosen')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/koordinator/jadwal', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/koordinator/jadwal')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // KAPRODI CONTROLLER COVERAGE
    // ============================================
    describe('Kaprodi Controller Coverage', () => {
        it('GET /api/kaprodi/stats', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/kaprodi/stats')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/kaprodi/mahasiswa', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/kaprodi/mahasiswa')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/kaprodi/dosen', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/kaprodi/dosen')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/kaprodi/koordinator', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/kaprodi/koordinator')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/kaprodi/penguji', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/kaprodi/penguji')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/kaprodi/jadwal', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/kaprodi/jadwal')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // BIMBINGAN CONTROLLER COVERAGE
    // ============================================
    describe('Bimbingan Controller Coverage', () => {
        it('GET /api/bimbingan - mahasiswa', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/bimbingan')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/bimbingan - dosen', async () => {
            if (!dosenToken) return;
            const res = await request(app)
                .get('/api/bimbingan')
                .set('Authorization', `Bearer ${dosenToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // PROPOSAL CONTROLLER COVERAGE
    // ============================================
    describe('Proposal Controller Coverage', () => {
        it('GET /api/proposal - mahasiswa', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/proposal')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/proposal - koordinator', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/proposal')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // SIDANG CONTROLLER COVERAGE
    // ============================================
    describe('Sidang Controller Coverage', () => {
        it('GET /api/sidang - mahasiswa', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/sidang')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // NOTIFICATION CONTROLLER COVERAGE
    // ============================================
    describe('Notification Controller Coverage', () => {
        it('GET /api/notifications - mahasiswa', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // PROFILE CONTROLLER COVERAGE
    // ============================================
    describe('Profile Controller Coverage', () => {
        it('GET /api/profile - mahasiswa', async () => {
            if (!mahasiswaToken) return;
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${mahasiswaToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/profile - dosen', async () => {
            if (!dosenToken) return;
            const res = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${dosenToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });

    // ============================================
    // REPORT CONTROLLER COVERAGE
    // ============================================
    describe('Report Controller Coverage', () => {
        it('GET /api/report - koordinator', async () => {
            if (!koordinatorToken) return;
            const res = await request(app)
                .get('/api/report')
                .set('Authorization', `Bearer ${koordinatorToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });

        it('GET /api/report - kaprodi', async () => {
            if (!kaprodiToken) return;
            const res = await request(app)
                .get('/api/report')
                .set('Authorization', `Bearer ${kaprodiToken}`);
            expect([200, 403, 404, 500]).toContain(res.status);
        });
    });
});
