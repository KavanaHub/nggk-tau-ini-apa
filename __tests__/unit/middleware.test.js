import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mocks
const mockVerify = jest.fn();
const mockSign = jest.fn();

// Mock Busboy: return the function directly for CJS/ESM interop
// This often fixes "is not a function" when default import gets the module namespace
const mockBusboyInstance = {
    on: jest.fn(),
    end: jest.fn()
};
const mockBusboyConstructor = jest.fn(() => mockBusboyInstance);

jest.mock('busboy', () => {
    return mockBusboyConstructor;
});

// Mock request/response helpers
const mockRequest = (headers = {}, user = null, body = {}) => ({
    headers,
    user,
    body,
    pipe: jest.fn(),
    rawBody: null
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('Middleware Unit Tests', () => {
    let auth;
    let requireRole;
    let kaprodiOnly;
    let uploadMiddleware;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';

        // Dynamic imports
        auth = (await import('../../middleware/auth.js')).default;
        const roleModule = await import('../../middleware/role.js');
        requireRole = roleModule.default;
        kaprodiOnly = roleModule.kaprodiOnly;
        uploadMiddleware = await import('../../middleware/upload.js');
    });

    afterEach(() => {
        jest.clearAllMocks();
        mockBusboyInstance.on.mockReset();
    });

    // ============================================
    // AUTH MIDDLEWARE
    // ============================================
    describe('Auth Middleware', () => {
        it('should return 401 if no auth header', () => {
            const req = mockRequest();
            const res = mockResponse();
            auth(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
        });

        it('should return 401 if invalid header format', () => {
            const req = mockRequest({ authorization: 'Basic token' });
            const res = mockResponse();
            auth(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if token invalid', () => {
            const req = mockRequest({ authorization: 'Bearer invalidtoken' });
            const res = mockResponse();
            auth(req, res, mockNext);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should call next and set user if token valid', () => {
            const mockUser = { id: 1, role: 'admin' };
            const token = jwt.sign(mockUser, process.env.JWT_SECRET);

            const req = mockRequest({ authorization: `Bearer ${token}` });
            const res = mockResponse();

            auth(req, res, mockNext);

            expect(req.user).toMatchObject({ id: 1, role: 'admin' });
            expect(mockNext).toHaveBeenCalled();
        });
    });

    // ============================================
    // ROLE MIDDLEWARE
    // ============================================
    describe('Role Middleware', () => {
        describe('requireRole', () => {
            it('should return 403 if no user', () => {
                const res = mockResponse();
                requireRole('mahasiswa')(mockRequest(), res, mockNext);
                expect(res.status).toHaveBeenCalledWith(403);
            });

            it('should allow admin', () => {
                requireRole('dosen')(mockRequest({}, { role: 'admin' }), mockResponse(), mockNext);
                expect(mockNext).toHaveBeenCalled();
            });

            it('should allow correct role', () => {
                requireRole('mahasiswa')(mockRequest({}, { role: 'mahasiswa' }), mockResponse(), mockNext);
                expect(mockNext).toHaveBeenCalled();
            });

            it('should return 403 for mismatch', () => {
                const res = mockResponse();
                requireRole('dosen')(mockRequest({}, { role: 'mahasiswa' }), res, mockNext);
                expect(res.status).toHaveBeenCalledWith(403);
            });

            it('should allow Kaprodi to Dosen', () => {
                requireRole('dosen')(mockRequest({}, { role: 'kaprodi' }), mockResponse(), mockNext);
                expect(mockNext).toHaveBeenCalled();
            });
        });

        describe('kaprodiOnly', () => {
            it('should allow kaprodi', () => {
                kaprodiOnly()(mockRequest({}, { role: 'kaprodi' }), mockResponse(), mockNext);
                expect(mockNext).toHaveBeenCalled();
            });

            it('should block admin', () => {
                const res = mockResponse();
                kaprodiOnly()(mockRequest({}, { role: 'admin' }), res, mockNext);
                expect(res.status).toHaveBeenCalledWith(403);
            });
        });
    });

    // ============================================
    // UPLOAD MIDDLEWARE (Multipart)
    // ============================================
    describe('Upload Middleware', () => {
        describe('parseMultipart', () => {
            let req, res;

            beforeEach(() => {
                req = mockRequest({ 'content-type': 'multipart/form-data; boundary=123' }, null, {});
                res = mockResponse();
                mockBusboyInstance.on.mockReset();
            });

            it('should skip if req.file exists', () => {
                req.file = {};
                uploadMiddleware.parseMultipart(req, res, mockNext);
                expect(mockNext).toHaveBeenCalled();
            });

            it('should skip if not multipart', () => {
                req.headers['content-type'] = 'application/json';
                uploadMiddleware.parseMultipart(req, res, mockNext);
                expect(mockNext).toHaveBeenCalled();
            });

            it('should parse fields and files via Busboy', () => {
                uploadMiddleware.parseMultipart(req, res, mockNext);

                expect(mockBusboyConstructor).toHaveBeenCalled();

                // Capture calls
                const calls = mockBusboyInstance.on.mock.calls;
                const callbacks = {};
                calls.forEach(([event, cb]) => { callbacks[event] = cb; });

                if (callbacks['field']) {
                    callbacks['field']('username', 'testuser');
                }

                if (callbacks['file']) {
                    const mockFileStream = {
                        on: jest.fn((e, cb) => {
                            if (e === 'data') cb(Buffer.from('filecontent'));
                            if (e === 'end') cb();
                        }),
                        resume: jest.fn()
                    };
                    callbacks['file']('avatar', mockFileStream, { filename: 'pic.jpg', mimeType: 'image/jpeg' });
                }

                if (callbacks['finish']) callbacks['finish']();

                expect(req.body.username).toBe('testuser');
                expect(req.file).toMatchObject({
                    fieldname: 'avatar',
                    originalname: 'pic.jpg'
                });
                expect(mockNext).toHaveBeenCalled();
            });
        });
    });
});
