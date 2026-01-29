import { jest } from '@jest/globals';
import { Readable } from 'stream';

// --- Mocks Setup ---

// Mock @google-cloud/storage
const mockFile = {
    createWriteStream: jest.fn(),
    makePublic: jest.fn().mockResolvedValue(),
    name: 'test-file.jpg'
};
const mockBucket = {
    file: jest.fn(() => mockFile)
};
const mockStorageInstance = {
    bucket: jest.fn(() => mockBucket)
};
const mockStorageConstructor = jest.fn(() => mockStorageInstance);

jest.unstable_mockModule('@google-cloud/storage', () => ({
    Storage: mockStorageConstructor
}));

// Mock googleapis
const mockDrive = {
    files: {
        create: jest.fn(),
        delete: jest.fn(),
        get: jest.fn()
    },
    permissions: {
        create: jest.fn()
    }
};
const mockGoogleAuth = {
    GoogleAuth: jest.fn()
};

jest.unstable_mockModule('googleapis', () => ({
    google: {
        auth: mockGoogleAuth,
        drive: jest.fn(() => mockDrive)
    }
}));

// Mock jsonwebtoken
const mockJwt = {
    sign: jest.fn(() => 'mock_token'),
    verify: jest.fn()
};
jest.unstable_mockModule('jsonwebtoken', () => ({
    __esModule: true,
    default: mockJwt
}));

// Mock bcryptjs
const mockBcrypt = {
    genSalt: jest.fn().mockResolvedValue('mock_salt'),
    hash: jest.fn().mockResolvedValue('mock_hashed_password'),
    compare: jest.fn()
};
jest.unstable_mockModule('bcryptjs', () => ({
    __esModule: true,
    default: mockBcrypt
}));

// Import modules AFTER mocks
// Note: We use dynamic imports in the tests or beforeAll to ensure mocks apply
let uploadToGCS;
let uploadToGDrive, deleteFromGDrive, getFileInfo;
let generateToken;
let hashPassword, comparePassword;

describe('Utils Unit Tests', () => {

    beforeAll(async () => {
        // Import GCS
        const gcsModule = await import('../../utils/gcs.js');
        uploadToGCS = gcsModule.uploadToGCS;

        // Import GDrive
        const gdriveModule = await import('../../utils/gdrive.js');
        uploadToGDrive = gdriveModule.default.uploadToGDrive;
        deleteFromGDrive = gdriveModule.default.deleteFromGDrive;
        getFileInfo = gdriveModule.default.getFileInfo;

        // Import JWT
        const jwtModule = await import('../../utils/jwt.js');
        generateToken = jwtModule.generateToken;

        // Import Password
        const passwordModule = await import('../../utils/password.js');
        hashPassword = passwordModule.hashPassword;
        comparePassword = passwordModule.comparePassword;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Google Cloud Storage (gcs.js)', () => {
        it('should upload file successfully and return public URL', async () => {
            const mockStream = {
                on: jest.fn(),
                end: jest.fn()
            };
            mockFile.createWriteStream.mockReturnValue(mockStream);

            // Simulate stream finish
            mockStream.on.mockImplementation((event, callback) => {
                if (event === 'finish') {
                    // Trigger callback immediately
                    callback();
                }
            });

            const file = {
                originalname: 'image.jpg',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test')
            };

            const result = await uploadToGCS(file);

            expect(mockStorageInstance.bucket).toHaveBeenCalled();
            expect(mockBucket.file).toHaveBeenCalled();
            expect(mockFile.createWriteStream).toHaveBeenCalled();
            expect(mockStream.end).toHaveBeenCalledWith(file.buffer);
            expect(mockFile.makePublic).toHaveBeenCalled();
            expect(result).toContain('https://storage.googleapis.com/');
        });

        it('should handle upload error', async () => {
            const mockStream = {
                on: jest.fn(),
                end: jest.fn()
            };
            mockFile.createWriteStream.mockReturnValue(mockStream);

            mockStream.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('Upload failed'));
                }
            });

            const file = {
                originalname: 'test.jpg',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test')
            };

            await expect(uploadToGCS(file)).rejects.toThrow('Upload failed');
        });

        it('should reject if no file provided', async () => {
            await expect(uploadToGCS(null)).rejects.toEqual('No file uploaded');
        });
    });

    describe('Google Drive (gdrive.js)', () => {
        const mockFileObj = {
            mimetype: 'application/pdf',
            buffer: Buffer.from('test'),
            originalname: 'test.pdf'
        };

        it('should upload to GDrive successfully', async () => {
            process.env.GDRIVE_FOLDER_DEFAULT = 'default_folder_id';

            mockDrive.files.create.mockResolvedValue({
                data: { id: 'file_123' }
            });

            const customPath = 'default/test.pdf';
            const result = await uploadToGDrive(mockFileObj, customPath);

            expect(mockDrive.files.create).toHaveBeenCalled();
            expect(mockDrive.permissions.create).toHaveBeenCalledWith({
                fileId: 'file_123',
                requestBody: { role: 'reader', type: 'anyone' },
                supportsAllDrives: true
            });
            expect(result).toContain('https://drive.google.com/uc?id=file_123');
        });

        it('should select correct folder for proposals', async () => {
            process.env.GDRIVE_FOLDER_PROPOSALS = 'proposal_folder_id';

            mockDrive.files.create.mockResolvedValue({
                data: { id: 'file_proposal' }
            });

            await uploadToGDrive(mockFileObj, 'proposals/my_proposal.pdf');

            const createCall = mockDrive.files.create.mock.calls[0][0];
            expect(createCall.requestBody.parents).toContain('proposal_folder_id');
        });

        it('should throw error if folder ID missing', async () => {
            // Unset env var temporarily
            const original = process.env.GDRIVE_FOLDER_DEFAULT;
            delete process.env.GDRIVE_FOLDER_DEFAULT;

            await expect(uploadToGDrive(mockFileObj, 'unknown/path.pdf')).rejects.toThrow('Missing Google Drive folder ID env vars');

            // Restore
            if (original) process.env.GDRIVE_FOLDER_DEFAULT = original;
        });

        it('should delete file from GDrive', async () => {
            mockDrive.files.delete.mockResolvedValue({});

            const fileUrl = 'https://drive.google.com/uc?id=file_to_delete&export=view';
            const result = await deleteFromGDrive(fileUrl);

            expect(mockDrive.files.delete).toHaveBeenCalledWith({ fileId: 'file_to_delete' });
            expect(result).toBe(true);
        });

        it('should get file info', async () => {
            const mockData = { id: '123', name: 'test' };
            mockDrive.files.get.mockResolvedValue({ data: mockData });

            const result = await getFileInfo('123');
            expect(result).toBe(mockData);
        });
    });

    describe('JWT Utils (jwt.js)', () => {
        it('should generate token with user data', () => {
            const user = { id: 1, role: 'mahasiswa' };
            const token = generateToken(user);

            expect(mockJwt.sign).toHaveBeenCalledWith(
                { id: 1, role: 'mahasiswa' },
                expect.anything(), // secret
                expect.objectContaining({ expiresIn: expect.anything() })
            );
            expect(token).toBe('mock_token');
        });
    });

    describe('Password Utils (password.js)', () => {
        it('should hash password', async () => {
            const result = await hashPassword('password123');

            expect(mockBcrypt.genSalt).toHaveBeenCalled();
            expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 'mock_salt');
            expect(result).toBe('mock_hashed_password');
        });

        it('should compare password', async () => {
            mockBcrypt.compare.mockResolvedValue(true);
            const result = await comparePassword('input', 'hash');

            expect(mockBcrypt.compare).toHaveBeenCalledWith('input', 'hash');
            expect(result).toBe(true);
        });
    });
});
