/**
 * Role Helper Utilities
 * Manages dosen roles using dosen_role pivot table
 * Schema: dosen_role (dosen_id, role_id)
 * 
 * Note: Koordinator assignment to semester/jadwal is handled via jadwal_proyek.created_by
 * When jadwal is completed, koordinator role is removed from that dosen
 */

import pool from '../config/db.js';

// Role constants
export const ROLES = {
    DOSEN: 'dosen',
    KOORDINATOR: 'koordinator',
    KAPRODI: 'kaprodi'
};

/**
 * Get all roles for a dosen
 * @param {number} dosenId 
 * @returns {Promise<string[]>} Array of role names
 */
export async function getDosenRoles(dosenId) {
    const [rows] = await pool.query(
        `SELECT r.nama_role
     FROM dosen_role dr
     JOIN role r ON dr.role_id = r.id
     WHERE dr.dosen_id = ?`,
        [dosenId]
    );
    return rows.map(r => r.nama_role);
}

/**
 * Check if dosen has a specific role
 * @param {number} dosenId 
 * @param {string} roleName 
 * @returns {Promise<boolean>}
 */
export async function hasRole(dosenId, roleName) {
    const [[result]] = await pool.query(
        `SELECT COUNT(*) as count 
     FROM dosen_role dr
     JOIN role r ON dr.role_id = r.id
     WHERE dr.dosen_id = ? AND r.nama_role = ?`,
        [dosenId, roleName]
    );
    return result.count > 0;
}

/**
 * Add a role to dosen
 * @param {number} dosenId 
 * @param {string} roleName 
 * @returns {Promise<boolean>} true if added, false if already exists
 */
export async function addRole(dosenId, roleName) {
    try {
        await pool.query(
            `INSERT INTO dosen_role (dosen_id, role_id)
       SELECT ?, id FROM role WHERE nama_role = ?`,
            [dosenId, roleName]
        );
        return true;
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return false; // Already has this role
        }
        throw err;
    }
}

/**
 * Remove a role from dosen
 * @param {number} dosenId 
 * @param {string} roleName 
 * @returns {Promise<boolean>} true if removed, false if didn't have role
 */
export async function removeRole(dosenId, roleName) {
    const [result] = await pool.query(
        `DELETE dr FROM dosen_role dr
     JOIN role r ON dr.role_id = r.id
     WHERE dr.dosen_id = ? AND r.nama_role = ?`,
        [dosenId, roleName]
    );
    return result.affectedRows > 0;
}

/**
 * Get all dosen with a specific role
 * @param {string} roleName 
 * @returns {Promise<Array>} Array of dosen objects
 */
export async function getDosenByRole(roleName) {
    const [rows] = await pool.query(
        `SELECT d.id, d.email, d.nidn, d.nama, d.no_wa, d.is_active, d.created_at
     FROM dosen d
     JOIN dosen_role dr ON d.id = dr.dosen_id
     JOIN role r ON dr.role_id = r.id
     WHERE r.nama_role = ? AND d.is_active = 1
     ORDER BY d.nama`,
        [roleName]
    );
    return rows;
}

/**
 * Get dosen with all roles as array
 * @param {number} dosenId 
 * @returns {Promise<Object>} Dosen object with roles array
 */
export async function getDosenWithRoles(dosenId) {
    const [[dosen]] = await pool.query(
        `SELECT id, email, nidn, nama, no_wa, is_active, created_at
     FROM dosen WHERE id = ?`,
        [dosenId]
    );

    if (!dosen) return null;

    dosen.roles = await getDosenRoles(dosenId);
    return dosen;
}

/**
 * Check if dosen is koordinator
 * @param {number} dosenId 
 * @returns {Promise<boolean>}
 */
export async function isKoordinator(dosenId) {
    return hasRole(dosenId, ROLES.KOORDINATOR);
}

/**
 * Check if dosen is kaprodi
 * @param {number} dosenId 
 * @returns {Promise<boolean>}
 */
export async function isKaprodi(dosenId) {
    return hasRole(dosenId, ROLES.KAPRODI);
}

/**
 * Get koordinator for specific jadwal/semester via jadwal_proyek.created_by
 * @param {number} jadwalId 
 * @returns {Promise<Object|null>}
 */
export async function getKoordinatorByJadwal(jadwalId) {
    const [[result]] = await pool.query(
        `SELECT d.id, d.nama, d.email, jp.nama as jadwal_nama, jp.semester
     FROM jadwal_proyek jp
     JOIN dosen d ON jp.created_by = d.id
     WHERE jp.id = ?`,
        [jadwalId]
    );
    return result || null;
}

export default {
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
};
