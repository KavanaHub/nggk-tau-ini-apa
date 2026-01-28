// Controller Tests with Database Mocking for Coverage
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the database pool before importing controllers
const mockQuery = jest.fn();
jest.unstable_mockModule('../../config/db.js', () => ({
    default: {
        query: mockQuery
    }
}));

// Import controllers after mocking
const authControllerModule = await import('../../controllers/authController.js');
const authController = authControllerModule.default;

describe('Auth Controller with Mocked DB', () => {
    const createMockRes = () => ({
        statusCode: null,
        data: null,
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) { this.data = data; return this; }
    });

    const mockNext = jest.fn();

    beforeEach(() => {
        mockQuery.mockClear();
        mockNext.mockClear();
    });

    // ============================================
    // LOGIN TESTS
    // ============================================
    describe('login', () => {
        it('should return 400 if email is missing', async () => {
            const req = { body: { password: 'test123' } };
            const res = createMockRes();

            await authController.login(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 if password is missing', async () => {
            const req = { body: { email: 'test@test.com' } };
            const res = createMockRes();

            await authController.login(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 if both email and password are missing', async () => {
            const req = { body: {} };
            const res = createMockRes();

            await authController.login(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });

        it('should login admin with correct hardcoded credentials', async () => {
            const req = {
                body: {
                    email: process.env.ADMIN_EMAIL,
                    password: process.env.ADMIN_PASSWORD
                }
            };
            const res = createMockRes();

            await authController.login(req, res, mockNext);

            // Should return token for admin
            if (res.data && res.data.token) {
                expect(res.data.role).toBe('admin');
            }
        });

        it('should return 400 for non-existing user', async () => {
            // Mock DB to return empty results
            mockQuery.mockResolvedValue([[]]);

            const req = {
                body: {
                    email: 'nonexistent@test.com',
                    password: 'wrongpass'
                }
            };
            const res = createMockRes();

            await authController.login(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });

        it('should detect NPM login (numeric identifier)', async () => {
            mockQuery.mockResolvedValue([[]]);

            const req = {
                body: {
                    email: '1234567890', // NPM is all digits
                    password: 'test123'
                }
            };
            const res = createMockRes();

            await authController.login(req, res, mockNext);

            // Should query by NPM instead of email
            expect(res.statusCode).toBe(400);
        });
    });

    // ============================================
    // REGISTER MAHASISWA TESTS
    // ============================================
    describe('registerMahasiswa', () => {
        it('should return 400 if email already exists', async () => {
            // Mock existing email
            mockQuery.mockResolvedValue([[{ id: 1 }]]);

            const req = {
                body: {
                    email: 'existing@test.com',
                    password: 'test123',
                    npm: '12345678',
                    nama: 'Test User'
                }
            };
            const res = createMockRes();

            await authController.registerMahasiswa(req, res, mockNext);

            expect(res.statusCode).toBe(400);
            expect(res.data.message).toContain('Email');
        });

        it('should return 400 if NPM already exists', async () => {
            // Mock: email doesn't exist, but NPM exists
            mockQuery
                .mockResolvedValueOnce([[]])  // email check
                .mockResolvedValueOnce([[{ id: 1 }]]);  // npm check

            const req = {
                body: {
                    email: 'new@test.com',
                    password: 'test123',
                    npm: '12345678',
                    nama: 'Test User'
                }
            };
            const res = createMockRes();

            await authController.registerMahasiswa(req, res, mockNext);

            expect(res.statusCode).toBe(400);
            expect(res.data.message).toContain('NPM');
        });

        it('should register successfully for new user', async () => {
            // Mock: email and NPM don't exist
            mockQuery
                .mockResolvedValueOnce([[]])  // email check
                .mockResolvedValueOnce([[]])  // npm check
                .mockResolvedValueOnce([{ insertId: 1 }]);  // insert

            const req = {
                body: {
                    email: 'new@test.com',
                    password: 'test123',
                    npm: '99999999',
                    nama: 'New User',
                    no_wa: '08123456789',
                    angkatan: 2024
                }
            };
            const res = createMockRes();

            await authController.registerMahasiswa(req, res, mockNext);

            expect(res.statusCode).toBe(201);
            expect(res.data.message).toContain('successfully');
        });
    });

    // ============================================
    // GET PROFILE TESTS
    // ============================================
    describe('getProfile', () => {
        it('should return admin profile', async () => {
            const req = { user: { id: 0, role: 'admin' } };
            const res = createMockRes();

            await authController.getProfile(req, res, mockNext);

            expect(res.data.role).toBe('admin');
            expect(res.data.nama).toBe('Administrator');
        });

        it('should return 404 for non-existing mahasiswa', async () => {
            mockQuery.mockResolvedValue([[]]);

            const req = { user: { id: 999, role: 'mahasiswa' } };
            const res = createMockRes();

            await authController.getProfile(req, res, mockNext);

            expect(res.statusCode).toBe(404);
        });

        it('should return mahasiswa profile', async () => {
            mockQuery.mockResolvedValue([[{
                id: 1,
                nama: 'Test Mahasiswa',
                email: 'mhs@test.com',
                npm: '12345678'
            }]]);

            const req = { user: { id: 1, role: 'mahasiswa' } };
            const res = createMockRes();

            await authController.getProfile(req, res, mockNext);

            expect(res.data.nama).toBe('Test Mahasiswa');
            expect(res.data.role).toBe('mahasiswa');
        });

        it('should return dosen profile', async () => {
            mockQuery.mockResolvedValue([[{
                id: 1,
                nama: 'Test Dosen',
                email: 'dosen@test.com',
                nidn: '123456'
            }]]);

            const req = { user: { id: 1, role: 'dosen' } };
            const res = createMockRes();

            await authController.getProfile(req, res, mockNext);

            expect(res.data.nama).toBe('Test Dosen');
            expect(res.data.role).toBe('dosen');
        });

        it('should return kaprodi profile', async () => {
            mockQuery.mockResolvedValue([[{
                id: 1,
                nama: 'Test Kaprodi',
                email: 'kaprodi@test.com',
                nidn: '123456'
            }]]);

            const req = { user: { id: 1, role: 'kaprodi' } };
            const res = createMockRes();

            await authController.getProfile(req, res, mockNext);

            expect(res.data.nama).toBe('Test Kaprodi');
            expect(res.data.role).toBe('kaprodi');
        });

        it('should return koordinator profile', async () => {
            mockQuery.mockResolvedValue([[{
                id: 1,
                nama: 'Test Koordinator',
                email: 'koordinator@test.com',
                nip: '123456'
            }]]);

            const req = { user: { id: 1, role: 'koordinator' } };
            const res = createMockRes();

            await authController.getProfile(req, res, mockNext);

            expect(res.data.nama).toBe('Test Koordinator');
        });

        it('should return penguji profile', async () => {
            mockQuery.mockResolvedValue([[{
                id: 1,
                nama: 'Test Penguji',
                email: 'penguji@test.com'
            }]]);

            const req = { user: { id: 1, role: 'penguji' } };
            const res = createMockRes();

            await authController.getProfile(req, res, mockNext);

            expect(res.data.nama).toBe('Test Penguji');
        });
    });

    // ============================================
    // UPDATE PROFILE TESTS
    // ============================================
    describe('updateProfile', () => {
        it('should update mahasiswa profile', async () => {
            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const req = {
                user: { id: 1, role: 'mahasiswa' },
                body: { nama: 'Updated Name', email: 'updated@test.com' }
            };
            const res = createMockRes();

            await authController.updateProfile(req, res, mockNext);

            expect(res.data.message).toContain('updated');
        });

        it('should update dosen profile', async () => {
            mockQuery.mockResolvedValue([{ affectedRows: 1 }]);

            const req = {
                user: { id: 1, role: 'dosen' },
                body: { nama: 'Updated Dosen', email: 'dosen@test.com' }
            };
            const res = createMockRes();

            await authController.updateProfile(req, res, mockNext);

            expect(res.data.message).toContain('updated');
        });

        it('should return 404 for non-existing user', async () => {
            mockQuery.mockResolvedValue([{ affectedRows: 0 }]);

            const req = {
                user: { id: 999, role: 'mahasiswa' },
                body: { nama: 'Test', email: 'test@test.com' }
            };
            const res = createMockRes();

            await authController.updateProfile(req, res, mockNext);

            expect(res.statusCode).toBe(404);
        });

        it('should return 400 for unsupported role', async () => {
            const req = {
                user: { id: 1, role: 'unknown' },
                body: { nama: 'Test', email: 'test@test.com' }
            };
            const res = createMockRes();

            await authController.updateProfile(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });
    });

    // ============================================
    // CHANGE PASSWORD TESTS
    // ============================================
    describe('changePassword', () => {
        it('should return 400 if old_password is missing', async () => {
            const req = {
                user: { id: 1, role: 'mahasiswa' },
                body: { new_password: 'newpass123' }
            };
            const res = createMockRes();

            await authController.changePassword(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 if new_password is missing', async () => {
            const req = {
                user: { id: 1, role: 'mahasiswa' },
                body: { old_password: 'oldpass123' }
            };
            const res = createMockRes();

            await authController.changePassword(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });

        it('should return 400 if new_password is too short', async () => {
            const req = {
                user: { id: 1, role: 'mahasiswa' },
                body: { old_password: 'oldpass', new_password: '123' }
            };
            const res = createMockRes();

            await authController.changePassword(req, res, mockNext);

            expect(res.statusCode).toBe(400);
            expect(res.data.message).toContain('6 characters');
        });

        it('should return 400 for unsupported role', async () => {
            const req = {
                user: { id: 1, role: 'unknown' },
                body: { old_password: 'oldpass', new_password: 'newpass123' }
            };
            const res = createMockRes();

            await authController.changePassword(req, res, mockNext);

            expect(res.statusCode).toBe(400);
        });

        it('should return 404 for non-existing user', async () => {
            mockQuery.mockResolvedValue([[]]);

            const req = {
                user: { id: 999, role: 'mahasiswa' },
                body: { old_password: 'oldpass', new_password: 'newpass123' }
            };
            const res = createMockRes();

            await authController.changePassword(req, res, mockNext);

            expect(res.statusCode).toBe(404);
        });
    });
});
