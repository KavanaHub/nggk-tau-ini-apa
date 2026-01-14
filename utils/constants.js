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
    return track && track.includes('proyek');
}

// Helper to check if track is internship
export function isInternshipTrack(track) {
    return track && track.includes('internship');
}
