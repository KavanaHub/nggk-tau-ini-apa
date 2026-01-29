import { jest } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolvePath = (relativePath) => {
    return path.resolve(__dirname, relativePath).replace(/\\/g, '/');
};

// Define Mocks in a factory format
const mockRouterInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    use: jest.fn(),
    mockClear: () => {
        mockRouterInstance.get.mockClear();
        mockRouterInstance.post.mockClear();
        mockRouterInstance.put.mockClear();
        mockRouterInstance.patch.mockClear();
        mockRouterInstance.delete.mockClear();
        mockRouterInstance.use.mockClear();
    }
};

const mockExpressFactory = () => {
    return {
        __esModule: true,
        default: {
            Router: jest.fn(() => mockRouterInstance)
        }
    };
};

jest.unstable_mockModule('express', mockExpressFactory);

// --- CONTROLLERS ---
const createMockController = (methods) => {
    const mock = {};
    methods.forEach(m => mock[m] = jest.fn());
    return { __esModule: true, default: mock };
};

jest.unstable_mockModule(resolvePath('../../controllers/authController.js'), () => createMockController(['registerMahasiswa', 'login', 'getProfile', 'updateProfile', 'changePassword', 'runSchemaFix']));
jest.unstable_mockModule(resolvePath('../../controllers/adminController.js'), () => createMockController(['getProfile', 'getStats', 'getRecentActivity', 'getAllUsers', 'updateUserStatus', 'deleteUser', 'getAllDosen', 'createDosen', 'getAllMahasiswa', 'getSystemReport']));
jest.unstable_mockModule(resolvePath('../../controllers/mahasiswaController.js'), () => createMockController(['getProfile', 'updateProfile', 'setTrack', 'getPeriodeAktif', 'submitProposal', 'getProposalStatus', 'getDosen', 'getAllDosen']));
jest.unstable_mockModule(resolvePath('../../controllers/bimbinganController.js'), () => createMockController(['createBimbingan', 'getMyBimbingan', 'getBimbinganById', 'getDosenBimbingan', 'updateBimbinganStatus']));
jest.unstable_mockModule(resolvePath('../../controllers/sidangController.js'), () => createMockController(['submitLaporan', 'getMyLaporan', 'getMySidang', 'getAllSidang', 'scheduleSidang', 'getDosenLaporan', 'updateLaporanStatus']));
jest.unstable_mockModule(resolvePath('../../controllers/kelompokController.js'), () => createMockController(['createKelompok', 'joinKelompok', 'getMyKelompok', 'getAvailableKelompok']));
jest.unstable_mockModule(resolvePath('../../controllers/dosenController.js'), () => createMockController(['getProfile', 'getStats', 'listDosen', 'getMahasiswaBimbingan', 'getMySidang']));
jest.unstable_mockModule(resolvePath('../../controllers/kaprodiController.js'), () => createMockController(['getProfile', 'getDashboardStats', 'getRecentActivities', 'getAllMahasiswa', 'getAllDosen', 'getAllKoordinator', 'getAllPenguji', 'assignDosen', 'updateProposalStatus', 'assignKoordinatorSemester', 'unassignKoordinatorSemester']));
jest.unstable_mockModule(resolvePath('../../controllers/koordinatorController.js'), () => createMockController(['getProfile', 'getStats', 'getAssignedSemester', 'getAllMahasiswa', 'getAllDosen', 'getPendingProposals', 'validateProposal', 'assignDosen', 'getPengujiList']));
jest.unstable_mockModule(resolvePath('../../controllers/jadwalController.js'), () => createMockController(['list', 'getActive', 'create', 'update', 'complete']));
jest.unstable_mockModule(resolvePath('../../controllers/notificationController.js'), () => createMockController(['getStats']));

// --- UTILS & CONFIG ---
jest.unstable_mockModule(resolvePath('../../config/db.js'), () => ({
    __esModule: true,
    default: {
        query: jest.fnAsync ? jest.fnAsync() : jest.fn().mockResolvedValue([[]]) // Handle simple query mock
    }
}));
jest.unstable_mockModule(resolvePath('../../utils/gcs.js'), () => ({
    __esModule: true,
    uploadToGCS: jest.fn()
}));

// --- MIDDLEWARE ---
const mockAuthMiddleware = jest.fn();
jest.unstable_mockModule(resolvePath('../../middleware/auth.js'), () => ({
    __esModule: true,
    default: mockAuthMiddleware
}));

const mockRoleMiddleware = jest.fn((...roles) => `requireRole(${roles.join(',')})`);
const mockKaprodiOnly = jest.fn(() => 'kaprodiOnly');
jest.unstable_mockModule(resolvePath('../../middleware/role.js'), () => ({
    __esModule: true,
    default: mockRoleMiddleware,
    kaprodiOnly: mockKaprodiOnly
}));

const mockUpload = {
    single: jest.fn(() => 'upload.single')
};
const mockParseMultipart = jest.fn();
jest.unstable_mockModule(resolvePath('../../middleware/upload.js'), () => ({
    __esModule: true,
    upload: mockUpload,
    parseMultipart: mockParseMultipart
}));


describe('Route Definitions', () => {
    let importedExpress;
    let authController, adminController, mahasiswaController, bimbinganController, sidangController, kelompokController, dosenController, kaprodiController, koordinatorController, jadwalController, notificationController;
    let authMiddleware, parseMultipart, mockUpload;

    const findCall = (method, path) => {
        return mockRouterInstance[method].mock.calls.find(call => call[0] === path);
    };

    beforeAll(async () => {
        importedExpress = (await import('express')).default;

        authController = (await import('../../controllers/authController.js')).default;
        adminController = (await import('../../controllers/adminController.js')).default;
        mahasiswaController = (await import('../../controllers/mahasiswaController.js')).default;
        bimbinganController = (await import('../../controllers/bimbinganController.js')).default;
        sidangController = (await import('../../controllers/sidangController.js')).default;
        // kelompokController = (await import('../../controllers/kelompokController.js')).default; // Controller exists but route file doesn't? verify
        dosenController = (await import('../../controllers/dosenController.js')).default;
        kaprodiController = (await import('../../controllers/kaprodiController.js')).default;
        koordinatorController = (await import('../../controllers/koordinatorController.js')).default;
        jadwalController = (await import('../../controllers/jadwalController.js')).default;
        notificationController = (await import('../../controllers/notificationController.js')).default;

        authMiddleware = (await import('../../middleware/auth.js')).default;
        const uploadModule = await import('../../middleware/upload.js');
        parseMultipart = uploadModule.parseMultipart;
        mockUpload = uploadModule.upload;
    });

    describe('authRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/authRoutes.js');
        });

        it('should define POST /register/mahasiswa', () => {
            const call = findCall('post', '/register/mahasiswa');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authController.registerMahasiswa);
        });
        it('should define POST /login', () => {
            const call = findCall('post', '/login');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authController.login);
        });
        it('should define GET /profile', () => {
            const call = findCall('get', '/profile');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe(authController.getProfile);
        });
    });

    describe('adminRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/adminRoutes.js');
        });
        it('should define POST /dosen', () => {
            const call = findCall('post', '/dosen');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe("requireRole(admin)");
            expect(call[3]).toBe(adminController.createDosen);
        });
        it('should define GET /users', () => {
            const call = findCall('get', '/users');
            expect(call).toBeDefined();
            expect(call[3]).toBe(adminController.getAllUsers);
        });
    });

    describe('mahasiswaRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/mahasiswaRoutes.js');
        });
        it('should define GET /profile', () => {
            const call = findCall('get', '/profile');
            expect(call).toBeDefined();
            expect(call[2]).toBe("requireRole(mahasiswa)");
            expect(call[3]).toBe(mahasiswaController.getProfile);
        });
    });

    describe('dosenRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/dosenRoutes.js');
        });
        it('should define GET /profile', () => {
            const call = findCall('get', '/profile');
            expect(call).toBeDefined();
            expect(call[2]).toBe("requireRole(dosen,kaprodi)");
            expect(call[3]).toBe(dosenController.getProfile);
        });
        it('should define GET /bimbingan', () => {
            const call = findCall('get', '/bimbingan');
            expect(call).toBeDefined(); // or /bimbingan (alias support test?)
            // dosenRoutes has /bimbingan
            expect(call[3]).toBe(bimbinganController.getDosenBimbingan);
        });
    });

    describe('kaprodiRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/kaprodiRoutes.js');
        });
        it('should define GET /profile', () => {
            const call = findCall('get', '/profile');
            expect(call).toBeDefined();
            expect(call[2]).toBe("requireRole(kaprodi)");
            expect(call[3]).toBe(kaprodiController.getProfile);
        });
        it('should define POST /assign-dosen', () => {
            const call = findCall('post', '/assign-dosen');
            expect(call).toBeDefined();
            expect(call[2]).toBe("kaprodiOnly");
            expect(call[3]).toBe(kaprodiController.assignDosen);
        });
    });

    describe('koordinatorRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/koordinatorRoutes.js');
        });
        it('should define GET /profile', () => {
            const call = findCall('get', '/profile');
            expect(call).toBeDefined();
            expect(call[2]).toBe("requireRole(koordinator)");
            expect(call[3]).toBe(koordinatorController.getProfile);
        });
        it('should define POST /sidang/schedule', () => {
            const call = findCall('post', '/sidang/schedule');
            expect(call).toBeDefined();
            expect(call[3]).toBe(sidangController.scheduleSidang);
        });
    });

    describe('notificationRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/notificationRoutes.js');
        });
        it('should define GET /stats', () => {
            const call = findCall('get', '/stats');
            expect(call).toBeDefined();
            expect(call[2]).toBe(notificationController.getStats);
        });
    });

    describe('bimbinganRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/bimbinganRoutes.js');
        });
        it('should define GET /:id', () => {
            const call = findCall('get', '/:id');
            expect(call).toBeDefined();
            expect(call[2]).toBe(bimbinganController.getBimbinganById);
        });
        it('should define POST /upload (inline handler)', () => {
            const call = findCall('post', '/upload');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe(parseMultipart);
            expect(call[3]).toEqual(expect.any(Function));
        });
    });

    describe('sidangRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/sidangRoutes.js');
        });
        it('should define GET /', () => {
            const call = findCall('get', '/');
            expect(call).toBeDefined();
            expect(call[2]).toBe(sidangController.getAllSidang);
        });
        it('should define POST /upload (inline handler)', () => {
            const call = findCall('post', '/upload');
            expect(call).toBeDefined();
            // router.post("/upload", auth, upload.single("file"), async ... )
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe('upload.single'); // from mock
            expect(call[3]).toEqual(expect.any(Function));
        });
    });

    describe('proposalRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/proposalRoutes.js');
        });
        it('should define POST /upload (inline handler)', () => {
            const call = findCall('post', '/upload');
            expect(call).toBeDefined();
            // router.post("/upload", auth, requireRole("mahasiswa"), parseMultipart, async ...)
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe("requireRole(mahasiswa)");
            expect(call[3]).toBe(parseMultipart);
            expect(call[4]).toEqual(expect.any(Function));
        });
    });

    describe('pengujiRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/pengujiRoutes.js');
        });
        it('should define GET /profile (inline)', () => {
            const call = findCall('get', '/profile');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe("requireRole(penguji)");
            expect(call[3]).toEqual(expect.any(Function));
        });
    });

    describe('reportRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/reportRoutes.js');
        });
        it('should define POST /upload (inline)', () => {
            const call = findCall('post', '/upload');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe("requireRole(mahasiswa)");
            expect(call[3]).toBe(parseMultipart);
            expect(call[4]).toEqual(expect.any(Function));
        });
    });

    describe('profileRoutes.js', () => {
        beforeAll(async () => {
            mockRouterInstance.mockClear();
            await import('../../routes/profileRoutes.js');
        });
        it('should define POST /upload (inline)', () => {
            const call = findCall('post', '/upload');
            expect(call).toBeDefined();
            expect(call[1]).toBe(authMiddleware);
            expect(call[2]).toBe(parseMultipart);
            expect(call[3]).toEqual(expect.any(Function));
        });
    });
});
