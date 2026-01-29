/**
 * RoleHelper Tests using jest.spyOn
 * Tests all functions in roleHelper.js
 */

import { jest } from '@jest/globals';
import pool from '../../config/db.js';
import {
    ROLES,
    getDosenRoles,
    hasRole,
    addRole,
    removeRole,
    getDosenByRole,
    getDosenWithRoles,
    isKoordinator,
    isKaprodi,
    getKoordinatorByJadwal
} from '../../utils/roleHelper.js';

describe('RoleHelper Utils - Full Coverage', () => {
    let querySpy;

    beforeAll(() => {
        // Spy on pool.query. This effectively mocks the database call.
        querySpy = jest.spyOn(pool, 'query');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Restore original query method
        querySpy.mockRestore();
        // End pool to allow clean exit
        pool.end();
    });

    // ---------- ROLES constant ----------
    describe('ROLES', () => {
        it('should have all role constants', () => {
            expect(ROLES.DOSEN).toBe('dosen');
            expect(ROLES.KOORDINATOR).toBe('koordinator');
            expect(ROLES.KAPRODI).toBe('kaprodi');
        });

        it('should have exactly 3 roles', () => {
            expect(Object.keys(ROLES)).toHaveLength(3);
        });
    });

    // ---------- getDosenRoles ----------
    describe('getDosenRoles', () => {
        it('should return array of role names', async () => {
            querySpy.mockResolvedValueOnce([[
                { nama_role: 'dosen' },
                { nama_role: 'koordinator' }
            ]]);

            const roles = await getDosenRoles(1);
            expect(roles).toEqual(['dosen', 'koordinator']);
            expect(querySpy).toHaveBeenCalledWith(
                expect.stringContaining('SELECT r.nama_role'),
                [1]
            );
        });

        it('should return empty array when dosen has no roles', async () => {
            querySpy.mockResolvedValueOnce([[]]);
            const roles = await getDosenRoles(999);
            expect(roles).toEqual([]);
        });
    });

    // ---------- hasRole ----------
    describe('hasRole', () => {
        it('should return true when dosen has role', async () => {
            querySpy.mockResolvedValueOnce([[{ count: 1 }]]);
            const result = await hasRole(1, 'koordinator');
            expect(result).toBe(true);
        });

        it('should return false when dosen does not have role', async () => {
            querySpy.mockResolvedValueOnce([[{ count: 0 }]]);
            const result = await hasRole(1, 'kaprodi');
            expect(result).toBe(false);
        });
    });

    // ---------- addRole ----------
    describe('addRole', () => {
        it('should return true when role added successfully', async () => {
            querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const result = await addRole(1, 'koordinator');
            expect(result).toBe(true);
        });

        it('should return false when role already exists (duplicate)', async () => {
            const error = new Error('Duplicate entry');
            error.code = 'ER_DUP_ENTRY';
            querySpy.mockRejectedValueOnce(error);

            const result = await addRole(1, 'koordinator');
            expect(result).toBe(false);
        });

        it('should throw error for other database errors', async () => {
            const error = new Error('Connection failed');
            error.code = 'ER_CONNECTION';
            querySpy.mockRejectedValueOnce(error);

            await expect(addRole(1, 'koordinator')).rejects.toThrow('Connection failed');
        });
    });

    // ---------- removeRole ----------
    describe('removeRole', () => {
        it('should return true when role removed', async () => {
            querySpy.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const result = await removeRole(1, 'koordinator');
            expect(result).toBe(true);
        });

        it('should return false when role was not present', async () => {
            querySpy.mockResolvedValueOnce([{ affectedRows: 0 }]);
            const result = await removeRole(1, 'koordinator');
            expect(result).toBe(false);
        });
    });

    // ---------- getDosenByRole ----------
    describe('getDosenByRole', () => {
        it('should return array of dosen with specific role', async () => {
            const mockDosen = [
                { id: 1, nama: 'Dosen A', email: 'a@test.com', nidn: '123', is_active: 1 },
                { id: 2, nama: 'Dosen B', email: 'b@test.com', nidn: '456', is_active: 1 }
            ];
            querySpy.mockResolvedValueOnce([mockDosen]);

            const result = await getDosenByRole('koordinator');
            expect(result).toEqual(mockDosen);
            expect(result).toHaveLength(2);
        });

        it('should return empty array when no dosen has role', async () => {
            querySpy.mockResolvedValueOnce([[]]);
            const result = await getDosenByRole('kaprodi');
            expect(result).toEqual([]);
        });
    });

    // ---------- getDosenWithRoles ----------
    describe('getDosenWithRoles', () => {
        it('should return dosen with roles array', async () => {
            const mockDosen = { id: 1, nama: 'Test Dosen', email: 'test@test.com', nidn: '123' };
            querySpy
                .mockResolvedValueOnce([[mockDosen]]) // First query for dosen
                .mockResolvedValueOnce([[{ nama_role: 'dosen' }, { nama_role: 'koordinator' }]]); // Second query for roles

            const result = await getDosenWithRoles(1);
            expect(result.id).toBe(1);
            expect(result.nama).toBe('Test Dosen');
            expect(result.roles).toEqual(['dosen', 'koordinator']);
        });

        it('should return null when dosen not found', async () => {
            querySpy.mockResolvedValueOnce([[]]);
            const result = await getDosenWithRoles(999);
            expect(result).toBeNull();
        });
    });

    // ---------- isKoordinator ----------
    describe('isKoordinator', () => {
        it('should return true when dosen is koordinator', async () => {
            querySpy.mockResolvedValueOnce([[{ count: 1 }]]);
            const result = await isKoordinator(1);
            expect(result).toBe(true);
        });

        it('should return false when dosen is not koordinator', async () => {
            querySpy.mockResolvedValueOnce([[{ count: 0 }]]);
            const result = await isKoordinator(1);
            expect(result).toBe(false);
        });
    });

    // ---------- isKaprodi ----------
    describe('isKaprodi', () => {
        it('should return true when dosen is kaprodi', async () => {
            querySpy.mockResolvedValueOnce([[{ count: 1 }]]);
            const result = await isKaprodi(1);
            expect(result).toBe(true);
        });

        it('should return false when dosen is not kaprodi', async () => {
            querySpy.mockResolvedValueOnce([[{ count: 0 }]]);
            const result = await isKaprodi(1);
            expect(result).toBe(false);
        });
    });

    // ---------- getKoordinatorByJadwal ----------
    describe('getKoordinatorByJadwal', () => {
        it('should return koordinator for jadwal', async () => {
            const mockResult = {
                id: 1,
                nama: 'Dr. Koordinator',
                email: 'koordinator@test.com',
                jadwal_nama: 'Proyek 1 2024',
                semester: 2
            };
            querySpy.mockResolvedValueOnce([[mockResult]]);

            const result = await getKoordinatorByJadwal(1);
            expect(result).toEqual(mockResult);
            expect(result.jadwal_nama).toBe('Proyek 1 2024');
        });

        it('should return null when jadwal not found', async () => {
            querySpy.mockResolvedValueOnce([[undefined]]);
            const result = await getKoordinatorByJadwal(999);
            expect(result).toBeNull();
        });
    });
});
