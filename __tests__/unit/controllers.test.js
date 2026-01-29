import { jest } from '@jest/globals';

// 1. MOCK UTILS REMOVED - Using real utils to avoid ESM mocking issues
// (DB Mocking handled via spyOn below)

// 2. NOW IMPORT MODULES
const { default: pool } = await import('../../config/db.js');
const { default: authController } = await import('../../controllers/authController.js');
const { default: mahasiswaController } = await import('../../controllers/mahasiswaController.js');
const { default: adminController } = await import('../../controllers/adminController.js');
const { default: dosenController } = await import('../../controllers/dosenController.js');
// New Controllers
const { default: bimbinganController } = await import('../../controllers/bimbinganController.js');
const { default: jadwalController } = await import('../../controllers/jadwalController.js');
const { default: kelompokController } = await import('../../controllers/kelompokController.js');
const { default: koordinatorController } = await import('../../controllers/koordinatorController.js');
const { default: kaprodiController } = await import('../../controllers/kaprodiController.js');
const { default: notificationController } = await import('../../controllers/notificationController.js');
const { default: sharedController } = await import('../../controllers/sharedController.js');
const { default: sidangController } = await import('../../controllers/sidangController.js');

// Setup Request/Response Mocks
const mockRequest = (body = {}, params = {}, user = null) => ({
    body,
    params,
    user,
    headers: {}
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('Controller Unit Tests', () => {
    let querySpy;
    let connectionSpy;
    let mockConnection;

    beforeAll(() => {
        // Mock Pool Query
        querySpy = jest.spyOn(pool, 'query');

        // Mock Pool Connection (for transactions)
        mockConnection = {
            query: jest.fn(),
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn()
        };
        connectionSpy = jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);
    });

    afterEach(() => {
        querySpy.mockReset();
        mockConnection.query.mockReset();
        mockConnection.beginTransaction.mockReset();
        mockConnection.commit.mockReset();
        mockConnection.rollback.mockReset();
        mockConnection.release.mockReset();
        jest.clearAllMocks();
    });


    afterAll(() => {
        querySpy.mockRestore();
        connectionSpy.mockRestore();
        pool.end();
    });

    // ============================================
    // AUTH CONTROLLER
    // ============================================
    describe('AuthController', () => {
        describe('login', () => {
            it('should return 400 if fields missing', async () => {
                const req = mockRequest({});
                const res = mockResponse();
                await authController.login(req, res, mockNext);
                expect(res.status).toHaveBeenCalledWith(400);
            });


            it('should login successfully for Mahasiswa', async () => {
                const req = mockRequest({ email: 'mhs@test.com', password: 'pass' });
                const res = mockResponse();

                // Generate real hash since we are using real utils
                const { hashPassword } = await import('../../utils/password.js');
                const validHash = await hashPassword('pass');

                // Mock DB: Find user with VALID hash
                querySpy.mockResolvedValueOnce([[
                    { id: 1, email: 'mhs@test.com', password_hash: validHash, role: 'mahasiswa' }
                ]]);

                await authController.login(req, res, mockNext);

                expect(querySpy).toHaveBeenCalled();
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    token: expect.any(String),
                    role: 'mahasiswa'
                }));
            });

            it('should return 400 if user not found', async () => {
                const req = mockRequest({ email: 'unknown@test.com', password: 'pass' });
                const res = mockResponse();

                // Mock DB: Empty result
                querySpy.mockResolvedValueOnce([[]]);

                await authController.login(req, res, mockNext);

                // Controller returns 400 for invalid credentials, not 401
                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('registerMahasiswa', () => {
            it('should register new mahasiswa successfully', async () => {
                const req = mockRequest({
                    nama: 'Test Mhs',
                    email: 'new@test.com',
                    password: 'pass',
                    npm: '12345',
                    no_wa: '0812'
                });
                const res = mockResponse();

                // Mock 1: Check existing email (returns empty)
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 2: Check existing NPM (returns empty)
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 3: Insert into user (returns insertId)
                querySpy.mockResolvedValueOnce([{ insertId: 1 }]);

                await authController.registerMahasiswa(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });

            it('should return 400 if email already exists', async () => {
                const req = mockRequest({ email: 'exist@mhs.com', password: 'pass', npm: '12345' });
                const res = mockResponse();

                // Mock 1: Email exists
                querySpy.mockResolvedValueOnce([[{ id: 1 }]]);

                await authController.registerMahasiswa(req, res, mockNext);
                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('getProfile', () => {
            it('should return mahasiswa profile', async () => {
                const req = mockRequest({}, {}, { id: 1, role: 'mahasiswa' });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ id: 1, nama: 'Mhs', role: 'mahasiswa' }]]);

                await authController.getProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nama: 'Mhs' }));
            });

            it('should return dosen profile with roles', async () => {
                const req = mockRequest({}, {}, { id: 10, role: 'dosen' });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ id: 10, nama: 'Dosen', roles: 'dosen,kaprodi' }]]);

                await authController.getProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ roles: 'dosen,kaprodi' }));
            });

            it('should return admin profile', async () => {
                const req = mockRequest({}, {}, { id: 0, role: 'admin' });
                const res = mockResponse();

                await authController.getProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
            });
        });

        describe('updateProfile', () => {
            it('should update mahasiswa profile', async () => {
                const req = mockRequest({ nama: 'Updated', email: 'new@mail.com' }, {}, { id: 1, role: 'mahasiswa' });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await authController.updateProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('successfully') }));
            });

            it('should update dosen profile', async () => {
                const req = mockRequest({ nama: 'Updated Dosen', email: 'dosen@mail.com' }, {}, { id: 10, role: 'dosen' });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await authController.updateProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('successfully') }));
            });
        });

        describe('changePassword', () => {
            it('should change password successfully', async () => {
                const req = mockRequest({ old_password: 'oldpass', new_password: 'newpass' }, {}, { id: 1, role: 'mahasiswa' });
                const res = mockResponse();

                const { hashPassword } = await import('../../utils/password.js');
                const realHash = await hashPassword('oldpass');

                // Mock 1: Get user with correct hash
                querySpy.mockResolvedValueOnce([[{ password_hash: realHash }]]);
                // Mock 2: Update password
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await authController.changePassword(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith({ message: 'Password changed successfully' });
            });

            it('should return 401 if old password incorrect', async () => {
                const req = mockRequest({ old_password: 'wrong', new_password: 'newpass' }, {}, { id: 1, role: 'mahasiswa' });
                const res = mockResponse();

                const { hashPassword } = await import('../../utils/password.js');
                const realHash = await hashPassword('correct');

                querySpy.mockResolvedValueOnce([[{ password_hash: realHash }]]);

                await authController.changePassword(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(401);
            });
        });

        describe('runSchemaFix', () => {
            it('should run schema fix successfully', async () => {
                const req = mockRequest();
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([{ warningStatus: 0 }]);

                await authController.runSchemaFix(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('fixed') }));
            });
        });


    });


    // ============================================
    // MAHASISWA CONTROLLER
    // ============================================
    describe('MahasiswaController', () => {
        describe('getProfile', () => {
            it('should return profile with dosen info', async () => {
                const req = mockRequest({}, {}, { id: 1, role: 'mahasiswa' });
                const res = mockResponse();

                const mockProfile = {
                    id: 1, nama: 'Mhs', dosen_nama: 'Dosen 1'
                };
                querySpy.mockResolvedValueOnce([[mockProfile]]);

                await mahasiswaController.getProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining(mockProfile));
            });

            it('should return 404 if not found', async () => {
                const req = mockRequest({}, {}, { id: 999, role: 'mahasiswa' });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[]]);

                await mahasiswaController.getProfile(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(404);
            });
        });

        describe('submitProposal', () => {
            it('should submit proposal successfully', async () => {
                const req = mockRequest(
                    { judul_proyek: 'Judul', file_url: 'http://file' },
                    {},
                    { id: 1 }
                );
                const res = mockResponse();

                // Mock 1: Get mahasiswa info
                querySpy.mockResolvedValueOnce([[{ track: 'proyek1', kelompok_id: null }]]);
                // Mock 2: Update proposal (returns success)
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await mahasiswaController.submitProposal(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });

            it('should return 400 if track not set', async () => {
                const req = mockRequest(
                    { judul_proyek: 'Judul', file_url: 'http://file' },
                    {},
                    { id: 1 }
                );
                const res = mockResponse();

                // Mock 1: Get info (track null)
                querySpy.mockResolvedValueOnce([[{ track: null }]]);

                await mahasiswaController.submitProposal(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('getBimbinganList', () => {
            it('should return list of bimbingan', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                const mockList = [{ id: 1, minggu_ke: 1 }];
                querySpy.mockResolvedValueOnce([mockList]);

                await mahasiswaController.getBimbinganList(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('setTrack', () => {
            it('should set track successfully (no partner)', async () => {
                const req = mockRequest({ track: 'proyek1' }, {}, { id: 1 });
                const res = mockResponse();

                const mockConnection = {
                    beginTransaction: jest.fn(),
                    query: jest.fn(),
                    commit: jest.fn(),
                    rollback: jest.fn(),
                    release: jest.fn()
                };

                // Mock pool.getConnection
                const connectionSpy = jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);

                // Mock 1: Get current student check
                mockConnection.query
                    .mockResolvedValueOnce([[{ id: 1, npm: '123', nama: 'Mhs', track: null, kelompok_id: null }]])
                    .mockResolvedValueOnce([{ affectedRows: 1 }]); // Update track

                await mahasiswaController.setTrack(req, res, mockNext);

                expect(mockConnection.commit).toHaveBeenCalled();
                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    message: expect.stringContaining('berhasil diset'),
                    track: 'proyek1'
                }));
            });

            it('should fail if track already set', async () => {
                const req = mockRequest({ track: 'proyek1' }, {}, { id: 1 });
                const res = mockResponse();
                const mockConnection = {
                    beginTransaction: jest.fn(),
                    query: jest.fn(),
                    commit: jest.fn(),
                    rollback: jest.fn(),
                    release: jest.fn()
                };
                jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);

                // Mock 1: Get current student check (already has track)
                mockConnection.query.mockResolvedValueOnce([[{ id: 1, npm: '123', track: 'proyek1', kelompok_id: 10 }]]);

                await mahasiswaController.setTrack(req, res, mockNext);

                expect(mockConnection.rollback).toHaveBeenCalled();
                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('getProposalStatus', () => {
            it('should return proposal status', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ judul_proyek: 'Judul', status_proposal: 'submitted' }]]);

                await mahasiswaController.getProposalStatus(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status_proposal: 'submitted' }));
            });
        });

        describe('getDosen', () => {
            it('should return dosen pembimbing info', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{
                    dosen_id: 10, dosen_nama: 'Dosen 1',
                    dosen_id_2: null
                }]]);

                await mahasiswaController.getDosen(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    pembimbing_utama: expect.objectContaining({ nama: 'Dosen 1' })
                }));
            });
        });

        describe('getPeriodeAktif', () => {
            it('should return active periode', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                // Mock 1: Get Angkatan
                querySpy.mockResolvedValueOnce([[{ angkatan: 2023 }]]);
                // Mock 2: Get Periode
                querySpy.mockResolvedValueOnce([[{ id: 1, nama: 'Periode 1', status: 'active' }]]);

                await mahasiswaController.getPeriodeAktif(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
            });

            it('should return active: false if no periode found', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                // Mock 1: Get Angkatan
                querySpy.mockResolvedValueOnce([[{ angkatan: 2023 }]]);
                // Mock 2: Get Periode (empty)
                querySpy.mockResolvedValueOnce([[]]);

                await mahasiswaController.getPeriodeAktif(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
            });
        });
    });

    // ============================================
    // ADMIN CONTROLLER
    // ============================================
    describe('AdminController', () => {
        describe('getStats', () => {
            it('should return dashboard stats', async () => {
                const req = mockRequest();
                const res = mockResponse();

                // Mock multiple queries with CORRECT column aliases
                querySpy
                    .mockResolvedValueOnce([[{ total_mahasiswa: 10 }]])
                    .mockResolvedValueOnce([[{ total_dosen: 5 }]])
                    .mockResolvedValueOnce([[{ total_koordinator: 2 }]])
                    .mockResolvedValueOnce([[{ sidang_bulan_ini: 1 }]])
                    .mockResolvedValueOnce([[{ proposal_pending: 3 }]])
                    .mockResolvedValueOnce([[{ bimbingan_aktif: 4 }]])
                    .mockResolvedValueOnce([[{ laporan_pending: 0 }]])
                    .mockResolvedValueOnce([[{ sidang_scheduled: 0 }]])
                    .mockResolvedValueOnce([[{ users_inactive: 0 }]]);

                await adminController.getStats(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    total_mahasiswa: 10,
                    total_dosen: 5
                }));
            });
        });

        describe('getRecentActivity', () => {
            it('should return combined recent activities', async () => {
                const req = mockRequest();
                const res = mockResponse();

                // Mock 1: New Mahasiswa
                querySpy.mockResolvedValueOnce([[{ type: 'user_register', message: 'Mhs 1' }]]);
                // Mock 2: New Proposals
                querySpy.mockResolvedValueOnce([[{ type: 'proposal_submit', message: 'Mhs 1' }]]);
                // Mock 3: Sidang
                querySpy.mockResolvedValueOnce([[{ type: 'sidang_scheduled', message: 'Mhs 1' }]]);

                await adminController.getRecentActivity(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
                    expect.objectContaining({ type: 'user_register' }),
                    expect.objectContaining({ type: 'proposal_submit' })
                ]));
            });
        });

        describe('getAllUsers', () => {
            it('should return merged user list', async () => {
                const req = mockRequest();
                const res = mockResponse();

                // Mock 1: Mahasiswa
                querySpy.mockResolvedValueOnce([[{ id: 1, role: 'mahasiswa' }]]);
                // Mock 2: Dosen
                querySpy.mockResolvedValueOnce([[{ id: 10, role: 'dosen' }]]);

                await adminController.getAllUsers(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    mahasiswa: expect.any(Array),
                    dosen: expect.any(Array)
                }));
            });
        });

        describe('getAllDosen', () => {
            it('should return all dosen', async () => {
                const req = mockRequest();
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ id: 10, nama: 'Dosen' }]]);

                await adminController.getAllDosen(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.any(Array));
            });
        });

        describe('createDosen', () => {
            it('should create dosen successfully with roles', async () => {
                const req = mockRequest({
                    email: 'newdosen@test.com',
                    password: 'pass',
                    nidn: '123',
                    nama: 'Dosen Baru',
                    roles: ['dosen', 'kaprodi']
                });
                const res = mockResponse();

                // Mock 1: Check existing
                querySpy.mockResolvedValueOnce([[]]);
                // Mock password hash (using real utils import or mock not needed if we rely on next calls)
                const { hashPassword } = await import('../../utils/password.js');
                // Mock 2: Insert Dosen
                querySpy.mockResolvedValueOnce([{ insertId: 50 }]);
                // Mock 3: Insert Default Role (dosen)
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);
                // Mock 4: Insert Additional Role (kaprodi)
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await adminController.createDosen(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });

            it('should return 400 if email exists', async () => {
                const req = mockRequest({ email: 'exist@test.com' });
                const res = mockResponse();
                querySpy.mockResolvedValueOnce([[{ id: 10 }]]);

                await adminController.createDosen(req, res, mockNext);
                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('updateUserStatus', () => {
            it('should update mahasiswa status', async () => {
                const req = mockRequest({ role: 'mahasiswa', is_active: false }, { id: 1 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await adminController.updateUserStatus(req, res, mockNext);
                expect(res.json).toHaveBeenCalledWith({ message: 'Status updated successfully' });
            });
        });

        describe('deleteUser', () => {
            it('should delete user', async () => {
                const req = mockRequest({ role: 'dosen' }, { id: 10 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await adminController.deleteUser(req, res, mockNext);
                expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
            });
        });

        describe('getSystemReport', () => {
            it('should return system report', async () => {
                const req = mockRequest();
                const res = mockResponse();

                querySpy
                    .mockResolvedValueOnce([[{ total_mahasiswa: 100 }]])
                    .mockResolvedValueOnce([[{ total_dosen: 50 }]])
                    .mockResolvedValueOnce([[{ total_bimbingan: 200 }]])
                    .mockResolvedValueOnce([[{ total_sidang: 50 }]]);

                await adminController.getSystemReport(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    total_mahasiswa: 100,
                    total_dosen: 50
                }));
            });
        });
    });

    // ============================================
    // DOSEN CONTROLLER
    // ============================================
    describe('DosenController', () => {
        describe('getProfile', () => {
            it('should return profile with roles', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                // Mock 1: Get Dosen
                querySpy.mockResolvedValueOnce([[{ id: 1, nama: 'Dosen' }]]);
                // Mock 2: Get Roles (called via roleHelper)
                querySpy.mockResolvedValueOnce([[{ nama_role: 'dosen' }]]);

                await dosenController.getProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    nama: 'Dosen'
                }));
            });
        });

        describe('getMahasiswaBimbingan', () => {
            it('should return mahasiswa list', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ id: 1, nama: 'Mhs 1' }]]);

                await dosenController.getMahasiswaBimbingan(req, res, mockNext);

                expect(res.json).toHaveBeenCalled();
            });
        });

        describe('getBimbinganList', () => {
            it('should return all bimbingan', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ id: 100, topic: 'Topic' }]]);

                await dosenController.getBimbinganList(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.any(Array));
            });
        });

        describe('getLaporanSidang', () => {
            it('should return laporan sidang list', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ id: 99, status: 'pending' }]]);

                await dosenController.getLaporanSidang(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.any(Array));
            });
        });

        describe('getMySidang', () => {
            it('should return sidang schedule as penguji', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ id: 50, tanggal: '2024-01-01' }]]);

                await dosenController.getMySidang(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.any(Array));
            });
        });

        describe('getStats', () => {
            it('should return dosen dashboard stats', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                querySpy
                    .mockResolvedValueOnce([[{ total_mahasiswa: 5 }]])
                    .mockResolvedValueOnce([[{ bimbingan_pending: 2 }]])
                    .mockResolvedValueOnce([[{ siap_sidang: 1 }]])
                    .mockResolvedValueOnce([[{ laporan_pending: 0 }]]);

                await dosenController.getStats(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    total_mahasiswa: 5,
                    bimbingan_pending: 2
                }));
            });
        });
    });

    // ============================================
    // BIMBINGAN CONTROLLER
    // ============================================
    describe('BimbinganController', () => {
        describe('createBimbingan', () => {
            it('should create bimbingan successfully', async () => {
                const req = mockRequest(
                    { tanggal: '2026-01-01', minggu_ke: 1, topik: 'Topik 1' },
                    {},
                    { id: 1 }
                );
                const res = mockResponse();

                // Mock 1: Get dosen pembimbing
                querySpy.mockResolvedValueOnce([[{ dosen_id: 10 }]]);
                // Mock 2: Count existing (returns 0)
                querySpy.mockResolvedValueOnce([[{ total: 0 }]]);
                // Mock 3: Check weekly validation (returns empty)
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 4: Insert bimbingan
                querySpy.mockResolvedValueOnce([{ insertId: 100 }]);

                await bimbinganController.createBimbingan(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });
        });

        describe('getDosenBimbingan', () => {
            it('should return list of bimbingan for dosen', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                const mockList = [{ id: 100, topik: 'Topik 1' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await bimbinganController.getDosenBimbingan(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('getMyBimbingan', () => {
            it('should return list of own bimbingan', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                const mockList = [{ id: 100, topik: 'My Topik' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await bimbinganController.getMyBimbingan(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('updateBimbinganStatus', () => {
            it('should approve bimbingan successfully', async () => {
                const req = mockRequest({ status: 'approved' }, { id: 100 }, { id: 10 });
                const res = mockResponse();

                // Mock 1: Check ownership
                querySpy.mockResolvedValueOnce([[{ id: 100 }]]);
                // Mock 2: Update status
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await bimbinganController.updateBimbinganStatus(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith({ message: 'Bimbingan approved' });
            });

            it('should return 400 if status invalid', async () => {
                const req = mockRequest({ status: 'invalid' }, { id: 100 }, { id: 10 });
                const res = mockResponse();

                await bimbinganController.updateBimbinganStatus(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

        describe('getBimbinganById', () => {
            it('should return bimbingan detail', async () => {
                const req = mockRequest({}, { id: 100 });
                const res = mockResponse();

                const mockDetail = { id: 100, topik: 'Detail' };
                querySpy.mockResolvedValueOnce([[mockDetail]]);

                await bimbinganController.getBimbinganById(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockDetail);
            });

            it('should return 404 if not found', async () => {
                const req = mockRequest({}, { id: 999 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[]]);

                await bimbinganController.getBimbinganById(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(404);
            });
        });
    });

    // ============================================
    // JADWAL CONTROLLER
    // ============================================
    describe('JadwalController', () => {
        describe('getActive', () => {
            it('should return active schedules', async () => {
                const req = mockRequest();
                const res = mockResponse();

                const mockSchedules = [{ id: 1, nama: 'Jadwal 1', status: 'active' }];
                querySpy.mockResolvedValueOnce([mockSchedules]);

                await jadwalController.getActive(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockSchedules);
            });
        });

        describe('create', () => {
            it('should create new jadwal', async () => {
                const req = mockRequest({
                    nama: 'Jadwal Baru',
                    tipe: 'proyek',
                    semester: 2,
                    start_date: '2026-01-01',
                    end_date: '2026-06-01'
                }, {}, { id: 10 });
                const res = mockResponse();

                // Mock 1: Check Koordinator role
                querySpy.mockResolvedValueOnce([[{ is_koordinator: 1 }]]);
                // Mock 2: Check existing active (others)
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 3: Check existing active (self)
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 4: Global check
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 5: Insert
                querySpy.mockResolvedValueOnce([{ insertId: 50 }]);

                await jadwalController.create(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });
        });

        describe('list', () => {
            it('should return all schedules', async () => {
                const req = mockRequest();
                const res = mockResponse();

                const mockList = [{ id: 1, nama: 'Jadwal 1' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await jadwalController.list(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('update', () => {
            it('should update jadwal successfully', async () => {
                const req = mockRequest({
                    nama: 'Updated',
                    tipe: 'proyek',
                    start_date: '2026-01-01',
                    end_date: '2026-06-01'
                }, { id: 1 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await jadwalController.update(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith({ message: 'Jadwal diperbarui' });
            });
        });

        describe('complete', () => {
            it('should complete active jadwal and remove koordinator role', async () => {
                const req = mockRequest({}, { id: 1 });
                const res = mockResponse();

                const mockConnection = {
                    beginTransaction: jest.fn(),
                    query: jest.fn(),
                    commit: jest.fn(),
                    rollback: jest.fn(),
                    release: jest.fn()
                };
                jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);

                // Mock 1: Select jadwal for update (status active)
                mockConnection.query.mockResolvedValueOnce([[{ status: 'active', semester: 2, created_by: 10 }]]);
                // Mock 2: Update status
                mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
                // Mock 3: Delete role
                mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await jadwalController.complete(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('berhasil') }));
                expect(mockConnection.commit).toHaveBeenCalled();
            });
        });
    });

    // ============================================
    // MAHASISWA CONTROLLER EXTENSION
    // ============================================
    describe('MahasiswaController Extension', () => {
        describe('setTrack (Partner Match)', () => {
            it('should match partner and create kelompok', async () => {
                const req = mockRequest({ track: 'proyek1', partner_npm: '999' }, {}, { id: 1 });
                const res = mockResponse();

                const mockConnection = {
                    beginTransaction: jest.fn(),
                    query: jest.fn(),
                    commit: jest.fn(),
                    rollback: jest.fn(),
                    release: jest.fn()
                };
                jest.spyOn(pool, 'getConnection').mockResolvedValue(mockConnection);

                // Mock 1: Get current student (track null)
                mockConnection.query.mockResolvedValueOnce([[{ id: 1, npm: '123', nama: 'Mhs 1', track: null, kelompok_id: null }]]);
                // Mock 2: Update track
                mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
                // Mock 3: Find partner
                mockConnection.query.mockResolvedValueOnce([[{
                    id: 2, npm: '999', nama: 'Mhs 2',
                    track: 'proyek1',
                    pending_partner_npm: '123',
                    kelompok_id: null
                }]]);
                // Mock 4: Create Kelompok
                mockConnection.query.mockResolvedValueOnce([{ insertId: 500 }]);
                // Mock 5: Update members
                mockConnection.query.mockResolvedValueOnce([{ affectedRows: 2 }]);

                await mahasiswaController.setTrack(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    matched: true,
                    kelompok_id: 500,
                    message: expect.stringContaining('Kelompok otomatis terbentuk')
                }));
            });
        });

        describe('submitProposal (Validation)', () => {
            it('should return 400 if user has no track', async () => {
                const req = mockRequest({ judul_proyek: 'Judul', file_url: 'file.pdf' }, {}, { id: 1 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ track: null }]]);

                await mahasiswaController.submitProposal(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(400);
            });

            it('should return 400 if validation fails (already submitted)', async () => {
                const req = mockRequest({ judul_proyek: 'Judul', file_url: 'file.pdf' }, {}, { id: 1 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ track: 'proyek1', judul_proyek: 'Ada', status_proposal: 'pending' }]]);

                await mahasiswaController.submitProposal(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(400);
            });
        });

    });


    // ============================================
    // KELOMPOK CONTROLLER
    // ============================================
    describe('KelompokController', () => {
        describe('createKelompok', () => {
            it('should create kelompok successfully', async () => {
                const req = mockRequest({ nama: 'Kelompok A' }, {}, { id: 1 });
                const res = mockResponse();

                // Mock 1: Check mahasiswa track
                querySpy.mockResolvedValueOnce([[{ track: 'proyek1', kelompok_id: null }]]);
                // Mock 2: Insert kelompok
                querySpy.mockResolvedValueOnce([{ insertId: 200 }]);
                // Mock 3: Update mahasiswa
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await kelompokController.createKelompok(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });
        });

        describe('joinKelompok', () => {
            it('should join kelompok successfully', async () => {
                const req = mockRequest({ kelompok_id: 200 }, {}, { id: 1 });
                const res = mockResponse();

                // Mock 1: Check mahasiswa
                querySpy.mockResolvedValueOnce([[{ track: 'proyek1', kelompok_id: null }]]);
                // Mock 2: Check kelompok track
                querySpy.mockResolvedValueOnce([[{ id: 200, track: 'proyek1' }]]);
                // Mock 3: Check count
                querySpy.mockResolvedValueOnce([[{ count: 1 }]]);
                // Mock 4: Update mahasiswa
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await kelompokController.joinKelompok(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Berhasil') }));
            });
        });

        describe('getMyKelompok', () => {
            it('should return my kelompok', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                // Mock 1: Get kelompok info
                const mockKelompok = { id: 200, nama: 'Grp' };
                querySpy.mockResolvedValueOnce([[mockKelompok]]);
                // Mock 2: Get members
                querySpy.mockResolvedValueOnce([[{ id: 1, nama: 'Me' }]]);

                await kelompokController.getMyKelompok(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ kelompok: mockKelompok }));
            });
        });

        describe('getAllKelompok', () => {
            it('should return all kelompok', async () => {
                const req = mockRequest();
                const res = mockResponse();

                const mockList = [{ id: 200, nama: 'Grp' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await kelompokController.getAllKelompok(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('getAvailableKelompok', () => {
            it('should return available kelompok for track', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                // Mock 1: Check mahasiswa track
                querySpy.mockResolvedValueOnce([[{ track: 'proyek1' }]]);
                // Mock 2: Get groups
                const mockList = [{ id: 200, nama: 'Grp' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await kelompokController.getAvailableKelompok(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });
    });

    // ============================================
    // KOORDINATOR CONTROLLER
    // ============================================
    describe('KoordinatorController', () => {
        describe('getProfile', () => {
            it('should return koordinator profile', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                const mockProfile = { id: 10, nama: 'Dosen K', assigned_semester: 2 };
                querySpy.mockResolvedValueOnce([[{ ...mockProfile }]]);

                await koordinatorController.getProfile(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nama: 'Dosen K' }));
            });
        });

        describe('getAssignedSemester', () => {
            it('should return assigned semester', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ assigned_semester: 5 }]]);

                await koordinatorController.getAssignedSemester(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ assigned: true, semester: 5 }));
            });
        });

        describe('getPendingProposals', () => {
            it('should return pending proposals grouped by kelompok', async () => {
                const req = mockRequest();
                const res = mockResponse();

                // Mock rows: 2 students in same group, 1 individual
                const mockRows = [
                    { id: 1, nama: 'A', track: 'proyek1', kelompok_id: 200, status_proposal: 'pending' },
                    { id: 2, nama: 'B', track: 'proyek1', kelompok_id: 200, status_proposal: 'pending' },
                    { id: 3, nama: 'C', track: 'internship', kelompok_id: null, status_proposal: 'pending' }
                ];
                querySpy.mockResolvedValueOnce([mockRows]);

                await koordinatorController.getPendingProposals(req, res, mockNext);

                // Expect 2 items in result: 1 group (with 2 members), 1 individual
                expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
                    expect.objectContaining({ kelompok_id: 200, anggota: expect.any(Array) }),
                    expect.objectContaining({ id: 3, anggota: expect.any(Array) })
                ]));
            });
        });

        describe('getPengujiList', () => {
            it('should return list of penguji', async () => {
                const req = mockRequest();
                const res = mockResponse();

                const mockList = [{ id: 50, nama: 'Penguji 1' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await koordinatorController.getPengujiList(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('getStats', () => {
            it('should return koordinator stats', async () => {
                const req = mockRequest();
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ total_mahasiswa: 100 }]]);
                querySpy.mockResolvedValueOnce([[{ proposal_pending: 5 }]]);
                querySpy.mockResolvedValueOnce([[{ menunggu_pembimbing: 3 }]]);
                querySpy.mockResolvedValueOnce([[{ siap_sidang: 2 }]]);

                await koordinatorController.getStats(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    total_mahasiswa: 100,
                    proposal_pending: 5
                }));
            });
        });
    });

    // ============================================
    // KAPRODI CONTROLLER
    // ============================================
    describe('KaprodiController', () => {
        describe('getRecentActivities', () => {
            it('should return combined activities', async () => {
                const req = mockRequest();
                const res = mockResponse();

                // Mock 1: New Students
                querySpy.mockResolvedValueOnce([[{ nama: 'Mhs1', created_at: new Date() }]]);
                // Mock 2: Track Select
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 3: Proposals Pending
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 4: Proposals Approved
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 5: Bimbingan Waiting
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 6: Bimbingan Approved
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 7: Sidang
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 8: Assignments
                querySpy.mockResolvedValueOnce([[]]);

                await kaprodiController.getRecentActivities(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
                    expect.objectContaining({ type: 'register' })
                ]));
            });
        });

        describe('assignKoordinatorSemester', () => {
            it('should assign koordinator successfully', async () => {
                const req = mockRequest({ koordinator_id: 10, semester: 5 });
                const res = mockResponse();

                // Mock 1: Check dosen exists
                querySpy.mockResolvedValueOnce([[{ id: 10, nama: 'Dosen' }]]);
                // Mock 2: Check existing assignment
                querySpy.mockResolvedValueOnce([[]]);
                // Mock 3: Insert/Update role
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await kaprodiController.assignKoordinatorSemester(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('berhasil') }));
            });
        });

        describe('unassignKoordinatorSemester', () => {
            it('should unassign koordinator', async () => {
                const req = mockRequest({ koordinator_id: 10 });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await kaprodiController.unassignKoordinatorSemester(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith({ message: 'Assignment berhasil dihapus' });
            });
        });

        describe('getDashboardStats', () => {
            it('should return kaprodi dashboard stats', async () => {
                const req = mockRequest();
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ total_mahasiswa: 200 }]]);
                querySpy.mockResolvedValueOnce([[{ total_dosen: 50 }]]);
                querySpy.mockResolvedValueOnce([[{ mahasiswa_aktif: 180 }]]);
                querySpy.mockResolvedValueOnce([[{ lulus: 20 }]]);
                querySpy.mockResolvedValueOnce([[{ siap_sidang: 5 }]]);
                // Additional stats
                querySpy.mockResolvedValueOnce([[{ proyek: 100 }]]);
                querySpy.mockResolvedValueOnce([[{ internship: 80 }]]);
                querySpy.mockResolvedValueOnce([[{ menunggu_track: 20 }]]);
                querySpy.mockResolvedValueOnce([[{ proposal_pending: 10 }]]);
                querySpy.mockResolvedValueOnce([[{ sedang_bimbingan: 50 }]]);
                // Angkatan stats
                querySpy.mockResolvedValueOnce([[{ angkatan: 2023, count: 100 }]]);

                await kaprodiController.getDashboardStats(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                    total_mahasiswa: 200,
                    lulus_semester_ini: 20
                }));
            });
        });
    });

    // ============================================
    // NOTIFICATION CONTROLLER
    // ============================================
    describe('NotificationController', () => {
        describe('getStats', () => {
            it('should return notification stats for Dosen', async () => {
                const req = mockRequest({}, {}, { id: 10, role: 'dosen' });
                const res = mockResponse();

                querySpy.mockResolvedValueOnce([[{ pending_bimbingan: 2 }]]);
                querySpy.mockResolvedValueOnce([[{ pending_laporan: 1 }]]);

                await notificationController.getStats(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith({
                    'mahasiswa-bimbingan': 2,
                    'laporan-approve': 1
                });
            });
        });
    });

    // ============================================
    // SIDANG CONTROLLER
    // ============================================
    describe('SidangController', () => {
        describe('submitLaporan', () => {
            it('should submit laporan successfully', async () => {
                const req = mockRequest(
                    { file_url: 'http://laporan' },
                    {},
                    { id: 1 }
                );
                const res = mockResponse();

                // Mock 1: Get mahasiswa info (approved proposal, has dosen)
                querySpy.mockResolvedValueOnce([[{
                    id: 1,
                    nama: 'Mhs',
                    dosen_id: 10,
                    status_proposal: 'approved',
                    kelompok_id: null
                }]]);

                // Mock 2: Validate bimbingan count (>= 8)
                querySpy.mockResolvedValueOnce([[{ approved: 8 }]]);

                // Mock 3: Check existing report (none)
                querySpy.mockResolvedValueOnce([[]]);

                // Mock 4: Insert report
                querySpy.mockResolvedValueOnce([{ insertId: 300 }]);

                await sidangController.submitLaporan(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });
        });

        describe('scheduleSidang', () => {
            it('should schedule sidang successfully', async () => {
                const req = mockRequest({
                    mahasiswa_id: 1,
                    tanggal: '2026-06-01',
                    waktu: '09:00',
                    ruangan: '101',
                    penguji_id: 20
                });
                const res = mockResponse();

                // Mock 1: Get mahasiswa info (has dosen)
                querySpy.mockResolvedValueOnce([[{ dosen_id: 10 }]]);
                // Mock 2: Check laporan (optional, skipped in controller logic for now or mocked)
                // (Controller logic: try-catch for laporan check, continues if empty)
                querySpy.mockResolvedValueOnce([[{ id: 300 }]]);

                // Mock 3: Check penguji
                querySpy.mockResolvedValueOnce([[{ id: 20 }]]);
                // Mock 4: Insert sidang
                querySpy.mockResolvedValueOnce([{ insertId: 400 }]);

                await sidangController.scheduleSidang(req, res, mockNext);

                expect(res.status).toHaveBeenCalledWith(201);
            });
        });

        describe('getMyLaporan', () => {
            it('should return my laporan', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                const mockList = [{ id: 100, status: 'submitted' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await sidangController.getMyLaporan(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('getDosenLaporan', () => {
            it('should return grouped laporan for dosen', async () => {
                const req = mockRequest({}, {}, { id: 10 });
                const res = mockResponse();

                const mockRows = [
                    { id: 1, mahasiswa_id: 1, file_laporan: 'url', kelompok_id: 200 },
                    { id: 2, mahasiswa_id: 2, file_laporan: 'url', kelompok_id: 200 }, // Duplicate group
                    { id: 3, mahasiswa_id: 3, file_laporan: 'url', kelompok_id: null }
                ];
                querySpy.mockResolvedValueOnce([mockRows]);

                await sidangController.getDosenLaporan(req, res, mockNext);

                // Should return 2 items: 1 group (id 200) and 1 individual (id 3)
                expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
                    expect.objectContaining({ kelompok_id: 200 }),
                    expect.objectContaining({ mahasiswa_id: 3 })
                ]));
            });
        });

        describe('updateLaporanStatus', () => {
            it('should update laporan status for group', async () => {
                const req = mockRequest({ status: 'approved' }, { id: 1 }, { id: 10 });
                const res = mockResponse();

                // Mock 1: Get laporan info
                querySpy.mockResolvedValueOnce([[{ mahasiswa_id: 1, kelompok_id: 200 }]]);
                // Mock 2: Get group members
                querySpy.mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]]);
                // Mock 3: Bulk Update
                querySpy.mockResolvedValueOnce([{ affectedRows: 2 }]);

                await sidangController.updateLaporanStatus(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('2 mahasiswa') }));
            });
        });

        describe('getAllSidang', () => {
            it('should return all sidang', async () => {
                const req = mockRequest();
                const res = mockResponse();

                const mockList = [{ id: 500, tanggal: '2026-06-01' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await sidangController.getAllSidang(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });

        describe('getMySidang', () => {
            it('should return my sidang', async () => {
                const req = mockRequest({}, {}, { id: 1 });
                const res = mockResponse();

                const mockList = [{ id: 500, tanggal: '2026-06-01' }];
                querySpy.mockResolvedValueOnce([mockList]);

                await sidangController.getMySidang(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(mockList);
            });
        });
    });

    // ============================================
    // SHARED CONTROLLER
    // ============================================
    describe('SharedController', () => {
        describe('assignDosen', () => {
            it('should assign dosen to mahasiswa', async () => {
                const req = mockRequest({ mahasiswa_id: 1, dosen_id: 10 });
                const res = mockResponse();

                // Mock 1: Check Mhs
                querySpy.mockResolvedValueOnce([[{ id: 1, track: 'proyek' }]]);
                // Mock 2: Check Dosen
                querySpy.mockResolvedValueOnce([[{ id: 10 }]]);
                // Mock 3: Update
                querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);

                await sharedController.assignDosen(req, res, mockNext);

                expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('berhasil') }));
            });
        });
    });
});

