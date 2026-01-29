/**
 * Comprehensive Tests for Utils - Full Coverage
 * Focus: All utils files including cloud and db helpers
 */

import { jest } from '@jest/globals';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Helper to resolve paths ensuring consistent format
const resolvePath = (relativePath) => {
    return path.resolve(__dirname, relativePath).replace(/\\/g, '/');
};

// --- Mocks Setup for Dependencies ---

// Mock DB
const mockPool = {
    query: jest.fn()
};
// Use absolute path for robustness
jest.unstable_mockModule(resolvePath('../../config/db.js'), () => ({
    default: mockPool
}));

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


import {
    SEMESTER_LABELS,
    SEMESTER_LABELS_SHORT,
    getSemesterLabel,
    TRACK_SEMESTER_MAP,
    isProyekTrack,
    isInternshipTrack,
    calculateSemester
} from '../../utils/constants.js';

import {
    ERROR_MESSAGES,
    notFound,
    badRequest,
    unauthorized,
    forbidden,
    success,
    validateRequired,
    VALID_SEMESTERS,
    isValidSemester
} from '../../utils/httpResponses.js';

import { generateToken } from '../../utils/jwt.js';
import { hashPassword, comparePassword } from '../../utils/password.js';

// ============================================
// CONSTANTS.JS TESTS
// ============================================
describe('Constants Utils', () => {
    describe('SEMESTER_LABELS', () => {
        it('should have correct labels for all valid semesters', () => {
            expect(SEMESTER_LABELS[2]).toBe('Proyek 1 (Semester 2)');
            expect(SEMESTER_LABELS[3]).toBe('Proyek 2 (Semester 3)');
            expect(SEMESTER_LABELS[5]).toBe('Proyek 3 (Semester 5)');
            expect(SEMESTER_LABELS[7]).toBe('Internship 1 (Semester 7)');
            expect(SEMESTER_LABELS[8]).toBe('Internship 2 (Semester 8)');
        });

        it('should have exactly 5 entries', () => {
            expect(Object.keys(SEMESTER_LABELS)).toHaveLength(5);
        });

        it('should return undefined for invalid semester', () => {
            expect(SEMESTER_LABELS[1]).toBeUndefined();
            expect(SEMESTER_LABELS[4]).toBeUndefined();
            expect(SEMESTER_LABELS[6]).toBeUndefined();
        });
    });

    describe('SEMESTER_LABELS_SHORT', () => {
        it('should have short labels for all valid semesters', () => {
            expect(SEMESTER_LABELS_SHORT[2]).toBe('Proyek 1');
            expect(SEMESTER_LABELS_SHORT[3]).toBe('Proyek 2');
            expect(SEMESTER_LABELS_SHORT[5]).toBe('Proyek 3');
            expect(SEMESTER_LABELS_SHORT[7]).toBe('Internship 1');
            expect(SEMESTER_LABELS_SHORT[8]).toBe('Internship 2');
        });

        it('should have exactly 5 entries', () => {
            expect(Object.keys(SEMESTER_LABELS_SHORT)).toHaveLength(5);
        });
    });

    describe('getSemesterLabel', () => {
        it('should return full label by default', () => {
            expect(getSemesterLabel(2)).toBe('Proyek 1 (Semester 2)');
            expect(getSemesterLabel(3)).toBe('Proyek 2 (Semester 3)');
            expect(getSemesterLabel(5)).toBe('Proyek 3 (Semester 5)');
            expect(getSemesterLabel(7)).toBe('Internship 1 (Semester 7)');
            expect(getSemesterLabel(8)).toBe('Internship 2 (Semester 8)');
        });

        it('should return short label when short=true', () => {
            expect(getSemesterLabel(2, true)).toBe('Proyek 1');
            expect(getSemesterLabel(3, true)).toBe('Proyek 2');
            expect(getSemesterLabel(5, true)).toBe('Proyek 3');
            expect(getSemesterLabel(7, true)).toBe('Internship 1');
            expect(getSemesterLabel(8, true)).toBe('Internship 2');
        });

        it('should return null for invalid semester', () => {
            expect(getSemesterLabel(1)).toBeNull();
            expect(getSemesterLabel(4)).toBeNull();
            expect(getSemesterLabel(6)).toBeNull();
            expect(getSemesterLabel(0)).toBeNull();
            expect(getSemesterLabel(-1)).toBeNull();
            expect(getSemesterLabel(100)).toBeNull();
        });

        it('should return null for invalid semester with short=true', () => {
            expect(getSemesterLabel(1, true)).toBeNull();
            expect(getSemesterLabel(100, true)).toBeNull();
        });
    });

    describe('TRACK_SEMESTER_MAP', () => {
        it('should map tracks to correct semesters', () => {
            expect(TRACK_SEMESTER_MAP['proyek1']).toBe(2);
            expect(TRACK_SEMESTER_MAP['proyek2']).toBe(3);
            expect(TRACK_SEMESTER_MAP['proyek3']).toBe(5);
            expect(TRACK_SEMESTER_MAP['internship1']).toBe(7);
            expect(TRACK_SEMESTER_MAP['internship2']).toBe(8);
        });

        it('should have exactly 5 entries', () => {
            expect(Object.keys(TRACK_SEMESTER_MAP)).toHaveLength(5);
        });

        it('should return undefined for invalid track', () => {
            expect(TRACK_SEMESTER_MAP['proyek4']).toBeUndefined();
            expect(TRACK_SEMESTER_MAP['internship3']).toBeUndefined();
            expect(TRACK_SEMESTER_MAP['unknown']).toBeUndefined();
        });
    });

    describe('isProyekTrack', () => {
        it('should return true for proyek tracks', () => {
            expect(isProyekTrack('proyek1')).toBe(true);
            expect(isProyekTrack('proyek2')).toBe(true);
            expect(isProyekTrack('proyek3')).toBe(true);
        });

        it('should return false for internship tracks', () => {
            expect(isProyekTrack('internship1')).toBe(false);
            expect(isProyekTrack('internship2')).toBe(false);
        });

        it('should return false for null/undefined/empty', () => {
            expect(isProyekTrack(null)).toBe(false);
            expect(isProyekTrack(undefined)).toBe(false);
            expect(isProyekTrack('')).toBe(false);
        });

        it('should return true for strings containing proyek', () => {
            expect(isProyekTrack('my-proyek-track')).toBe(true);
            expect(isProyekTrack('PROYEK')).toBe(false); // case sensitive
        });
    });

    describe('isInternshipTrack', () => {
        it('should return true for internship tracks', () => {
            expect(isInternshipTrack('internship1')).toBe(true);
            expect(isInternshipTrack('internship2')).toBe(true);
        });

        it('should return false for proyek tracks', () => {
            expect(isInternshipTrack('proyek1')).toBe(false);
            expect(isInternshipTrack('proyek2')).toBe(false);
            expect(isInternshipTrack('proyek3')).toBe(false);
        });

        it('should return false for null/undefined/empty', () => {
            expect(isInternshipTrack(null)).toBe(false);
            expect(isInternshipTrack(undefined)).toBe(false);
            expect(isInternshipTrack('')).toBe(false);
        });

        it('should return true for strings containing internship', () => {
            expect(isInternshipTrack('my-internship-track')).toBe(true);
            expect(isInternshipTrack('INTERNSHIP')).toBe(false); // case sensitive
        });
    });

    describe('calculateSemester', () => {
        it('should return null for null/undefined angkatan', () => {
            expect(calculateSemester(null)).toBeNull();
            expect(calculateSemester(undefined)).toBeNull();
            expect(calculateSemester(0)).toBeNull();
        });

        // Semester Ganjil: Oktober - Februari
        it('should calculate semester ganjil (Oktober)', () => {
            // Angkatan 2023, Oktober 2023 = Semester 1
            const octoberDate = new Date(2023, 9, 15); // October 15, 2023
            expect(calculateSemester(2023, octoberDate)).toBe(1);
        });

        it('should calculate semester ganjil (November)', () => {
            // Angkatan 2023, November 2023 = Semester 1
            const novemberDate = new Date(2023, 10, 15); // November 15, 2023
            expect(calculateSemester(2023, novemberDate)).toBe(1);
        });

        it('should calculate semester ganjil (Desember)', () => {
            // Angkatan 2023, December 2023 = Semester 1
            const decemberDate = new Date(2023, 11, 15); // December 15, 2023
            expect(calculateSemester(2023, decemberDate)).toBe(1);
        });

        it('should calculate semester ganjil (Januari - next year)', () => {
            // Angkatan 2023, January 2024 = still Semester 1
            const januaryDate = new Date(2024, 0, 15); // January 15, 2024
            expect(calculateSemester(2023, januaryDate)).toBe(1);
        });

        it('should calculate semester ganjil (Februari - next year)', () => {
            // Angkatan 2023, February 2024 = still Semester 1
            const februaryDate = new Date(2024, 1, 15); // February 15, 2024
            expect(calculateSemester(2023, februaryDate)).toBe(1);
        });

        // Semester Genap: Maret - September
        it('should calculate semester genap (Maret)', () => {
            // Angkatan 2023, March 2024 = Semester 2
            const marchDate = new Date(2024, 2, 15); // March 15, 2024
            expect(calculateSemester(2023, marchDate)).toBe(2);
        });

        it('should calculate semester genap (Juni)', () => {
            // Angkatan 2023, June 2024 = Semester 2
            const juneDate = new Date(2024, 5, 15); // June 15, 2024
            expect(calculateSemester(2023, juneDate)).toBe(2);
        });

        it('should calculate semester genap (September)', () => {
            // Angkatan 2023, September 2024 = Semester 2
            const septemberDate = new Date(2024, 8, 15); // September 15, 2024
            expect(calculateSemester(2023, septemberDate)).toBe(2);
        });

        // Year progression
        it('should calculate semester 3 (Oktober next year)', () => {
            // Angkatan 2023, October 2024 = Semester 3
            const octoberDate = new Date(2024, 9, 15);
            expect(calculateSemester(2023, octoberDate)).toBe(3);
        });

        it('should calculate semester 4 (Maret 2nd year)', () => {
            // Angkatan 2023, March 2025 = Semester 4
            const marchDate = new Date(2025, 2, 15);
            expect(calculateSemester(2023, marchDate)).toBe(4);
        });

        it('should calculate semester 5 (Oktober 2nd year)', () => {
            // Angkatan 2023, October 2025 = Semester 5
            const octoberDate = new Date(2025, 9, 15);
            expect(calculateSemester(2023, octoberDate)).toBe(5);
        });

        it('should calculate semester 7 (Oktober 3rd year)', () => {
            // Angkatan 2023, October 2026 = Semester 7
            const octoberDate = new Date(2026, 9, 15);
            expect(calculateSemester(2023, octoberDate)).toBe(7);
        });

        it('should calculate semester 8 (Maret 4th year)', () => {
            // Angkatan 2023, March 2027 = Semester 8
            const marchDate = new Date(2027, 2, 15);
            expect(calculateSemester(2023, marchDate)).toBe(8);
        });
    });
});

// ============================================
// HTTP RESPONSES TESTS
// ============================================
describe('HTTP Responses Utils', () => {
    // Mock response object
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    describe('ERROR_MESSAGES', () => {
        it('should have all required error messages', () => {
            expect(ERROR_MESSAGES.MAHASISWA_NOT_FOUND).toBe('Mahasiswa tidak ditemukan');
            expect(ERROR_MESSAGES.DOSEN_NOT_FOUND).toBe('Dosen tidak ditemukan');
            expect(ERROR_MESSAGES.KOORDINATOR_NOT_FOUND).toBe('Koordinator tidak ditemukan');
            expect(ERROR_MESSAGES.KAPRODI_NOT_FOUND).toBe('Kaprodi tidak ditemukan');
            expect(ERROR_MESSAGES.KELOMPOK_NOT_FOUND).toBe('Kelompok tidak ditemukan');
            expect(ERROR_MESSAGES.JADWAL_NOT_FOUND).toBe('Jadwal tidak ditemukan');
            expect(ERROR_MESSAGES.BIMBINGAN_NOT_FOUND).toBe('Bimbingan tidak ditemukan');
            expect(ERROR_MESSAGES.USER_NOT_FOUND).toBe('User not found');
            expect(ERROR_MESSAGES.PENGUJI_NOT_FOUND).toBe('Penguji tidak ditemukan');
            expect(ERROR_MESSAGES.UNAUTHORIZED).toBe('Unauthorized');
            expect(ERROR_MESSAGES.FORBIDDEN).toBe('Forbidden');
            expect(ERROR_MESSAGES.BAD_REQUEST).toBe('Bad request');
        });

        it('should have exactly 12 error messages', () => {
            expect(Object.keys(ERROR_MESSAGES)).toHaveLength(12);
        });
    });

    describe('notFound', () => {
        it('should return 404 with default message', () => {
            const res = mockResponse();
            notFound(res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should return 404 with custom message', () => {
            const res = mockResponse();
            notFound(res, 'Custom not found');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Custom not found' });
        });

        it('should return 404 with specific error message', () => {
            const res = mockResponse();
            notFound(res, ERROR_MESSAGES.MAHASISWA_NOT_FOUND);
            expect(res.json).toHaveBeenCalledWith({ message: 'Mahasiswa tidak ditemukan' });
        });
    });

    describe('badRequest', () => {
        it('should return 400 with default message', () => {
            const res = mockResponse();
            badRequest(res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Bad request' });
        });

        it('should return 400 with custom message', () => {
            const res = mockResponse();
            badRequest(res, 'Invalid input');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' });
        });
    });

    describe('unauthorized', () => {
        it('should return 401 with default message', () => {
            const res = mockResponse();
            unauthorized(res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });

        it('should return 401 with custom message', () => {
            const res = mockResponse();
            unauthorized(res, 'Token expired');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Token expired' });
        });
    });

    describe('forbidden', () => {
        it('should return 403 with default message', () => {
            const res = mockResponse();
            forbidden(res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
        });

        it('should return 403 with custom message', () => {
            const res = mockResponse();
            forbidden(res, 'Access denied');
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
        });
    });

    describe('success', () => {
        it('should return data when provided', () => {
            const res = mockResponse();
            const data = { id: 1, name: 'Test' };
            success(res, data);
            expect(res.json).toHaveBeenCalledWith(data);
        });

        it('should return message when data is null', () => {
            const res = mockResponse();
            success(res, null);
            expect(res.json).toHaveBeenCalledWith({ message: 'Success' });
        });

        it('should return message when data is undefined', () => {
            const res = mockResponse();
            success(res);
            expect(res.json).toHaveBeenCalledWith({ message: 'Success' });
        });

        it('should return custom message when no data', () => {
            const res = mockResponse();
            success(res, null, 'Operation completed');
            expect(res.json).toHaveBeenCalledWith({ message: 'Operation completed' });
        });

        it('should return empty array if provided', () => {
            const res = mockResponse();
            success(res, []);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return 0 if provided', () => {
            const res = mockResponse();
            success(res, 0);
            expect(res.json).toHaveBeenCalledWith({ message: 'Success' }); // 0 is falsy
        });
    });

    describe('validateRequired', () => {
        it('should return null when all fields are present', () => {
            const res = mockResponse();
            const result = validateRequired(res, ['name', 'email'], ['John', 'john@test.com']);
            expect(result).toBeNull();
        });

        it('should return badRequest when fields are missing', () => {
            const res = mockResponse();
            validateRequired(res, ['name', 'email'], ['John', null]);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'email wajib diisi' });
        });

        it('should mention all missing fields', () => {
            const res = mockResponse();
            validateRequired(res, ['name', 'email', 'password'], [null, null, 'pass']);
            expect(res.json).toHaveBeenCalledWith({ message: 'name, email wajib diisi' });
        });

        it('should handle empty string as missing', () => {
            const res = mockResponse();
            validateRequired(res, ['name'], ['']);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should handle undefined as missing', () => {
            const res = mockResponse();
            validateRequired(res, ['name'], [undefined]);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('VALID_SEMESTERS', () => {
        it('should contain exactly [2, 3, 5, 7, 8]', () => {
            expect(VALID_SEMESTERS).toEqual([2, 3, 5, 7, 8]);
        });

        it('should have exactly 5 elements', () => {
            expect(VALID_SEMESTERS).toHaveLength(5);
        });
    });

    describe('isValidSemester', () => {
        it('should return true for valid semesters', () => {
            expect(isValidSemester(2)).toBe(true);
            expect(isValidSemester(3)).toBe(true);
            expect(isValidSemester(5)).toBe(true);
            expect(isValidSemester(7)).toBe(true);
            expect(isValidSemester(8)).toBe(true);
        });

        it('should return false for invalid semesters', () => {
            expect(isValidSemester(1)).toBe(false);
            expect(isValidSemester(4)).toBe(false);
            expect(isValidSemester(6)).toBe(false);
            expect(isValidSemester(0)).toBe(false);
            expect(isValidSemester(-1)).toBe(false);
            expect(isValidSemester(100)).toBe(false);
        });

        it('should return false for non-numbers', () => {
            expect(isValidSemester('2')).toBe(false);
            expect(isValidSemester(null)).toBe(false);
            expect(isValidSemester(undefined)).toBe(false);
        });
    });
});

// ============================================
// JWT.JS TESTS
// ============================================
describe('JWT Utils', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        process.env.JWT_SECRET = 'test-secret-key';
        process.env.JWT_EXPIRES_IN = '1d';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const user = { id: 1, role: 'mahasiswa' };
            const token = generateToken(user);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
        });

        it('should include user id and role in token', async () => {
            const jwt = await import('jsonwebtoken');
            const user = { id: 123, role: 'dosen' };
            const token = generateToken(user);
            const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
            expect(decoded.id).toBe(123);
            expect(decoded.role).toBe('dosen');
        });

        it('should generate different tokens for different users', () => {
            const user1 = { id: 1, role: 'mahasiswa' };
            const user2 = { id: 2, role: 'dosen' };
            const token1 = generateToken(user1);
            const token2 = generateToken(user2);
            expect(token1).not.toBe(token2);
        });

        it('should use default expiry when JWT_EXPIRES_IN is not set', () => {
            delete process.env.JWT_EXPIRES_IN;
            const user = { id: 1, role: 'mahasiswa' };
            const token = generateToken(user);
            expect(token).toBeDefined();
        });
    });
});

// ============================================
// PASSWORD.JS TESTS
// ============================================
describe('Password Utils', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'TestPassword123';
            const hash = await hashPassword(password);
            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are ~60 chars
        });

        it('should generate different hashes for same password', async () => {
            const password = 'SamePassword';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);
            expect(hash1).not.toBe(hash2); // Different salts
        });

        it('should handle empty password', async () => {
            const hash = await hashPassword('');
            expect(hash).toBeDefined();
        });

        it('should handle special characters', async () => {
            const password = 'P@$$w0rd!@#$%^&*()';
            const hash = await hashPassword(password);
            expect(hash).toBeDefined();
        });

        it('should handle Unicode characters', async () => {
            const password = 'パスワード123';
            const hash = await hashPassword(password);
            expect(hash).toBeDefined();
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            const password = 'CorrectPassword';
            const hash = await hashPassword(password);
            const result = await comparePassword(password, hash);
            expect(result).toBe(true);
        });

        it('should return false for wrong password', async () => {
            const password = 'CorrectPassword';
            const hash = await hashPassword(password);
            const result = await comparePassword('WrongPassword', hash);
            expect(result).toBe(false);
        });

        it('should return false for similar but different password', async () => {
            const password = 'Password123';
            const hash = await hashPassword(password);
            const result = await comparePassword('Password124', hash);
            expect(result).toBe(false);
        });

        it('should be case sensitive', async () => {
            const password = 'CaseSensitive';
            const hash = await hashPassword(password);
            const result = await comparePassword('casesensitive', hash);
            expect(result).toBe(false);
        });

        it('should handle empty password comparison', async () => {
            const password = '';
            const hash = await hashPassword(password);
            const result = await comparePassword('', hash);
            expect(result).toBe(true);
        });

        it('should handle special characters comparison', async () => {
            const password = 'P@$$w0rd!';
            const hash = await hashPassword(password);
            const result = await comparePassword('P@$$w0rd!', hash);
            expect(result).toBe(true);
        });
    });
});

// ============================================
// CLOUD STORAGE TESTS (GCS & GDRIVE)
// ============================================
describe('Cloud Storage Utils', () => {
    let uploadToGCS;
    let uploadToGDrive, deleteFromGDrive, getFileInfo;

    beforeAll(async () => {
        // Import GCS
        const gcsModule = await import('../../utils/gcs.js');
        uploadToGCS = gcsModule.uploadToGCS;

        // Import GDrive
        const gdriveModule = await import('../../utils/gdrive.js');
        uploadToGDrive = gdriveModule.default.uploadToGDrive;
        deleteFromGDrive = gdriveModule.default.deleteFromGDrive;
        getFileInfo = gdriveModule.default.getFileInfo;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ---------- Google Cloud Storage (gcs.js) ----------
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

    // ---------- Google Drive (gdrive.js) ----------
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
            const original = process.env.GDRIVE_FOLDER_DEFAULT;
            delete process.env.GDRIVE_FOLDER_DEFAULT; // Explicitly unset

            await expect(uploadToGDrive(mockFileObj, 'unknown/path.pdf')).rejects.toThrow('Missing Google Drive folder ID env vars');

            if (original) process.env.GDRIVE_FOLDER_DEFAULT = original; // Restore
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
});

// ============================================
// ROLE HELPER UTILS TESTS (roleHelper.js)
// ============================================
describe('Role Helper Utils', () => {
    let roleHelper;

    beforeAll(async () => {
        // Import roleHelper
        const module = await import('../../utils/roleHelper.js');
        roleHelper = module.default;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getDosenRoles', () => {
        it('should return array of role names', async () => {
            mockPool.query.mockResolvedValue([[{ nama_role: 'dosen' }, { nama_role: 'koordinator' }]]);
            const roles = await roleHelper.getDosenRoles(1);
            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(roles).toEqual(['dosen', 'koordinator']);
        });
    });

    describe('hasRole', () => {
        it('should return true if count > 0', async () => {
            mockPool.query.mockResolvedValue([[{ count: 1 }]]);
            const result = await roleHelper.hasRole(1, 'dosen');
            expect(result).toBe(true);
        });

        it('should return false if count is 0', async () => {
            mockPool.query.mockResolvedValue([[{ count: 0 }]]);
            const result = await roleHelper.hasRole(1, 'admin');
            expect(result).toBe(false);
        });
    });

    describe('addRole', () => {
        it('should add role successfully', async () => {
            mockPool.query.mockResolvedValue([{}]);
            const result = await roleHelper.addRole(1, 'koordinator');
            expect(result).toBe(true);
        });

        it('should return false if role already exists (ER_DUP_ENTRY)', async () => {
            const err = new Error('Duplicate');
            err.code = 'ER_DUP_ENTRY';
            mockPool.query.mockRejectedValue(err);

            const result = await roleHelper.addRole(1, 'koordinator');
            expect(result).toBe(false);
        });

        it('should throw other errors', async () => {
            mockPool.query.mockRejectedValue(new Error('DB Error'));
            await expect(roleHelper.addRole(1, 'koordinator')).rejects.toThrow('DB Error');
        });
    });

    describe('removeRole', () => {
        it('should return true if row deleted', async () => {
            mockPool.query.mockResolvedValue([{ affectedRows: 1 }]);
            const result = await roleHelper.removeRole(1, 'koordinator');
            expect(result).toBe(true);
        });

        it('should return false if row deleted', async () => {
            mockPool.query.mockResolvedValue([{ affectedRows: 0 }]);
            const result = await roleHelper.removeRole(1, 'koordinator');
            expect(result).toBe(false);
        });
    });

    describe('getDosenByRole', () => {
        it('should return list of dosen', async () => {
            const mockDosen = [{ id: 1, nama: 'Dosen 1' }];
            mockPool.query.mockResolvedValue([mockDosen]);
            const result = await roleHelper.getDosenByRole('koordinator');
            expect(result).toEqual(mockDosen);
        });
    });

    describe('getDosenWithRoles', () => {
        it('should return dosen with roles', async () => {
            // Mock getDosen query
            mockPool.query
                .mockResolvedValueOnce([[{ id: 1, nama: 'Dosen 1' }]]) // First query: get dosen
                .mockResolvedValueOnce([[{ nama_role: 'dosen' }]]); // Second query: get roles

            const result = await roleHelper.getDosenWithRoles(1);
            expect(result.id).toBe(1);
            expect(result.roles).toEqual(['dosen']);
        });

        it('should return null if dosen not found', async () => {
            mockPool.query.mockResolvedValueOnce([[]]); // Empty result
            const result = await roleHelper.getDosenWithRoles(999);
            expect(result).toBeNull();
        });
    });

    describe('isKoordinator / isKaprodi', () => {
        it('should check koordinator role', async () => {
            mockPool.query.mockResolvedValue([[{ count: 1 }]]);
            const result = await roleHelper.isKoordinator(1);
            expect(result).toBe(true);
        });

        it('should check kaprodi role', async () => {
            mockPool.query.mockResolvedValue([[{ count: 0 }]]);
            const result = await roleHelper.isKaprodi(1);
            expect(result).toBe(false);
        });
    });

    describe('getKoordinatorByJadwal', () => {
        it('should return koordinator info', async () => {
            const mockData = { id: 1, nama: 'Koord' };
            mockPool.query.mockResolvedValue([[mockData]]);
            const result = await roleHelper.getKoordinatorByJadwal(101);
            expect(result).toEqual(mockData);
        });

        it('should return null if not found', async () => {
            mockPool.query.mockResolvedValue([[]]);
            const result = await roleHelper.getKoordinatorByJadwal(101);
            expect(result).toBeNull();
        });
    });
});
