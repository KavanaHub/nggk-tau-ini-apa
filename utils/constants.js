/**
 * Shared constants untuk menghindari duplikasi di seluruh aplikasi
 */

// Semester labels untuk proyek dan internship
export const SEMESTER_LABELS = {
    2: 'Proyek 1 (Semester 2)',
    3: 'Proyek 2 (Semester 3)',
    5: 'Proyek 3 (Semester 5)',
    7: 'Internship 1 (Semester 7)',
    8: 'Internship 2 (Semester 8)'
};

// Short semester labels
export const SEMESTER_LABELS_SHORT = {
    2: 'Proyek 1',
    3: 'Proyek 2',
    5: 'Proyek 3',
    7: 'Internship 1',
    8: 'Internship 2'
};

// Helper function to get semester label
export function getSemesterLabel(semester, short = false) {
    const labels = short ? SEMESTER_LABELS_SHORT : SEMESTER_LABELS;
    return labels[semester] || null;
}

// Track to semester mapping
export const TRACK_SEMESTER_MAP = {
    'proyek1': 2,
    'proyek2': 3,
    'proyek3': 5,
    'internship1': 7,
    'internship2': 8
};

// Helper to check if track is proyek
export function isProyekTrack(track) {
    return Boolean(track && track.includes('proyek'));
}

// Helper to check if track is internship
export function isInternshipTrack(track) {
    return Boolean(track && track.includes('internship'));
}

/**
 * Calculate current semester based on angkatan (enrollment year)
 * Academic calendar: Ganjil = Oktober-Februari, Genap = Maret-September
 * @param {number} angkatan - Enrollment year (e.g., 2023)
 * @param {Date} date - Reference date (defaults to now)
 * @returns {number} Current semester number
 */
export function calculateSemester(angkatan, date = new Date()) {
    if (!angkatan) return null;

    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1; // 1-12
    const yearsElapsed = currentYear - angkatan;

    if (currentMonth >= 10 || currentMonth <= 2) {
        // Semester GANJIL (Oktober - Februari)
        if (currentMonth >= 10) {
            return (yearsElapsed * 2) + 1;
        } else {
            return ((yearsElapsed - 1) * 2) + 1;
        }
    } else {
        // Semester GENAP (Maret - September)
        return yearsElapsed * 2;
    }
}
