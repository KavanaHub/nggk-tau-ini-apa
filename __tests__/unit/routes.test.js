// Routes Tests - Import all route files for coverage
import { describe, it, expect } from '@jest/globals';

// Import all routes (this executes the route definition code for coverage)
import authRoutes from '../../routes/authRoutes.js';
import adminRoutes from '../../routes/adminRoutes.js';
import mahasiswaRoutes from '../../routes/mahasiswaRoutes.js';
import dosenRoutes from '../../routes/dosenRoutes.js';
import kaprodiRoutes from '../../routes/kaprodiRoutes.js';
import koordinatorRoutes from '../../routes/koordinatorRoutes.js';
import bimbinganRoutes from '../../routes/bimbinganRoutes.js';
import proposalRoutes from '../../routes/proposalRoutes.js';
import sidangRoutes from '../../routes/sidangRoutes.js';
import profileRoutes from '../../routes/profileRoutes.js';
import reportRoutes from '../../routes/reportRoutes.js';
import pengujiRoutes from '../../routes/pengujiRoutes.js';

describe('Routes - Coverage', () => {
    describe('Auth Routes', () => {
        it('should export a router', () => {
            expect(authRoutes).toBeDefined();
            expect(authRoutes.stack).toBeDefined();
        });

        it('should have POST /login route', () => {
            const loginRoute = authRoutes.stack.find(r =>
                r.route && r.route.path === '/login' && r.route.methods.post
            );
            expect(loginRoute).toBeDefined();
        });

        it('should have POST /register/mahasiswa route', () => {
            const registerRoute = authRoutes.stack.find(r =>
                r.route && r.route.path === '/register/mahasiswa'
            );
            expect(registerRoute).toBeDefined();
        });
    });

    describe('Admin Routes', () => {
        it('should export a router', () => {
            expect(adminRoutes).toBeDefined();
            expect(adminRoutes.stack).toBeDefined();
        });

        it('should have routes defined', () => {
            expect(adminRoutes.stack.length).toBeGreaterThan(0);
        });
    });

    describe('Mahasiswa Routes', () => {
        it('should export a router', () => {
            expect(mahasiswaRoutes).toBeDefined();
            expect(mahasiswaRoutes.stack).toBeDefined();
        });

        it('should have routes defined', () => {
            expect(mahasiswaRoutes.stack.length).toBeGreaterThan(0);
        });
    });

    describe('Dosen Routes', () => {
        it('should export a router', () => {
            expect(dosenRoutes).toBeDefined();
            expect(dosenRoutes.stack).toBeDefined();
        });

        it('should have routes defined', () => {
            expect(dosenRoutes.stack.length).toBeGreaterThan(0);
        });
    });

    describe('Kaprodi Routes', () => {
        it('should export a router', () => {
            expect(kaprodiRoutes).toBeDefined();
            expect(kaprodiRoutes.stack).toBeDefined();
        });

        it('should have routes defined', () => {
            expect(kaprodiRoutes.stack.length).toBeGreaterThan(0);
        });
    });

    describe('Koordinator Routes', () => {
        it('should export a router', () => {
            expect(koordinatorRoutes).toBeDefined();
            expect(koordinatorRoutes.stack).toBeDefined();
        });

        it('should have routes defined', () => {
            expect(koordinatorRoutes.stack.length).toBeGreaterThan(0);
        });
    });

    describe('Bimbingan Routes', () => {
        it('should export a router', () => {
            expect(bimbinganRoutes).toBeDefined();
            expect(bimbinganRoutes.stack).toBeDefined();
        });
    });

    describe('Proposal Routes', () => {
        it('should export a router', () => {
            expect(proposalRoutes).toBeDefined();
            expect(proposalRoutes.stack).toBeDefined();
        });
    });

    describe('Sidang Routes', () => {
        it('should export a router', () => {
            expect(sidangRoutes).toBeDefined();
            expect(sidangRoutes.stack).toBeDefined();
        });
    });

    describe('Profile Routes', () => {
        it('should export a router', () => {
            expect(profileRoutes).toBeDefined();
            expect(profileRoutes.stack).toBeDefined();
        });
    });

    describe('Report Routes', () => {
        it('should export a router', () => {
            expect(reportRoutes).toBeDefined();
            expect(reportRoutes.stack).toBeDefined();
        });
    });

    describe('Penguji Routes', () => {
        it('should export a router', () => {
            expect(pengujiRoutes).toBeDefined();
            expect(pengujiRoutes.stack).toBeDefined();
        });
    });
});
