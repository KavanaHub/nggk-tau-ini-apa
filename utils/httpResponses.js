/**
 * HTTP Response helpers to reduce code duplication
 */

// Common error messages
export const ERROR_MESSAGES = {
    MAHASISWA_NOT_FOUND: 'Mahasiswa tidak ditemukan',
    DOSEN_NOT_FOUND: 'Dosen tidak ditemukan',
    KOORDINATOR_NOT_FOUND: 'Koordinator tidak ditemukan',
    KAPRODI_NOT_FOUND: 'Kaprodi tidak ditemukan',
    KELOMPOK_NOT_FOUND: 'Kelompok tidak ditemukan',
    JADWAL_NOT_FOUND: 'Jadwal tidak ditemukan',
    BIMBINGAN_NOT_FOUND: 'Bimbingan tidak ditemukan',
    USER_NOT_FOUND: 'User not found',
    PENGUJI_NOT_FOUND: 'Penguji tidak ditemukan',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    BAD_REQUEST: 'Bad request'
};

// Response helpers
export function notFound(res, message = ERROR_MESSAGES.USER_NOT_FOUND) {
    return res.status(404).json({ message });
}

export function badRequest(res, message = ERROR_MESSAGES.BAD_REQUEST) {
    return res.status(400).json({ message });
}

export function unauthorized(res, message = ERROR_MESSAGES.UNAUTHORIZED) {
    return res.status(401).json({ message });
}

export function forbidden(res, message = ERROR_MESSAGES.FORBIDDEN) {
    return res.status(403).json({ message });
}

export function success(res, data = null, message = 'Success') {
    return res.json(data || { message });
}

// Common validation: required fields
export function validateRequired(res, fields, values) {
    const missing = fields.filter((field, i) => !values[i]);
    if (missing.length > 0) {
        return badRequest(res, `${missing.join(', ')} wajib diisi`);
    }
    return null; // validation passed
}

// Common validation: valid semesters
export const VALID_SEMESTERS = [2, 3, 5, 7, 8];
export function isValidSemester(semester) {
    return VALID_SEMESTERS.includes(semester);
}
