// Comprehensive Tests for constants.js with full coverage
import { describe, it, expect } from '@jest/globals';

// Direct imports for coverage
import {
    SEMESTER_LABELS,
    SEMESTER_LABELS_SHORT,
    getSemesterLabel,
    TRACK_SEMESTER_MAP,
    isProyekTrack,
    isInternshipTrack,
    calculateSemester
} from '../../utils/constants.js';

describe('Constants Utils - Full Coverage', () => {
    // ============================================
    // SEMESTER_LABELS
    // ============================================
    describe('SEMESTER_LABELS', () => {
        it('should have label for semester 2', () => {
            expect(SEMESTER_LABELS[2]).toBe('Proyek 1 (Semester 2)');
        });

        it('should have label for semester 3', () => {
            expect(SEMESTER_LABELS[3]).toBe('Proyek 2 (Semester 3)');
        });

        it('should have label for semester 5', () => {
            expect(SEMESTER_LABELS[5]).toBe('Proyek 3 (Semester 5)');
        });

        it('should have label for semester 7', () => {
            expect(SEMESTER_LABELS[7]).toBe('Internship 1 (Semester 7)');
        });

        it('should have label for semester 8', () => {
            expect(SEMESTER_LABELS[8]).toBe('Internship 2 (Semester 8)');
        });

        it('should have 5 semester labels', () => {
            expect(Object.keys(SEMESTER_LABELS).length).toBe(5);
        });
    });

    // ============================================
    // SEMESTER_LABELS_SHORT
    // ============================================
    describe('SEMESTER_LABELS_SHORT', () => {
        it('should have short label for semester 2', () => {
            expect(SEMESTER_LABELS_SHORT[2]).toBe('Proyek 1');
        });

        it('should have short label for semester 3', () => {
            expect(SEMESTER_LABELS_SHORT[3]).toBe('Proyek 2');
        });

        it('should have short label for semester 5', () => {
            expect(SEMESTER_LABELS_SHORT[5]).toBe('Proyek 3');
        });

        it('should have short label for semester 7', () => {
            expect(SEMESTER_LABELS_SHORT[7]).toBe('Internship 1');
        });

        it('should have short label for semester 8', () => {
            expect(SEMESTER_LABELS_SHORT[8]).toBe('Internship 2');
        });
    });

    // ============================================
    // getSemesterLabel
    // ============================================
    describe('getSemesterLabel', () => {
        it('should return full label for semester 2', () => {
            expect(getSemesterLabel(2)).toBe('Proyek 1 (Semester 2)');
        });

        it('should return short label for semester 2 when short=true', () => {
            expect(getSemesterLabel(2, true)).toBe('Proyek 1');
        });

        it('should return full label for semester 5', () => {
            expect(getSemesterLabel(5)).toBe('Proyek 3 (Semester 5)');
        });

        it('should return short label for semester 5 when short=true', () => {
            expect(getSemesterLabel(5, true)).toBe('Proyek 3');
        });

        it('should return null for invalid semester', () => {
            expect(getSemesterLabel(1)).toBeNull();
        });

        it('should return null for undefined semester', () => {
            expect(getSemesterLabel(undefined)).toBeNull();
        });

        it('should return null for non-existent semester 10', () => {
            expect(getSemesterLabel(10)).toBeNull();
        });

        it('should return null for semester 4 (not in list)', () => {
            expect(getSemesterLabel(4)).toBeNull();
        });

        it('should return null for semester 6 (not in list)', () => {
            expect(getSemesterLabel(6)).toBeNull();
        });
    });

    // ============================================
    // TRACK_SEMESTER_MAP
    // ============================================
    describe('TRACK_SEMESTER_MAP', () => {
        it('should map proyek1 to semester 2', () => {
            expect(TRACK_SEMESTER_MAP['proyek1']).toBe(2);
        });

        it('should map proyek2 to semester 3', () => {
            expect(TRACK_SEMESTER_MAP['proyek2']).toBe(3);
        });

        it('should map proyek3 to semester 5', () => {
            expect(TRACK_SEMESTER_MAP['proyek3']).toBe(5);
        });

        it('should map internship1 to semester 7', () => {
            expect(TRACK_SEMESTER_MAP['internship1']).toBe(7);
        });

        it('should map internship2 to semester 8', () => {
            expect(TRACK_SEMESTER_MAP['internship2']).toBe(8);
        });

        it('should return undefined for invalid track', () => {
            expect(TRACK_SEMESTER_MAP['invalid']).toBeUndefined();
        });
    });

    // ============================================
    // isProyekTrack
    // ============================================
    describe('isProyekTrack', () => {
        it('should return true for proyek1', () => {
            expect(isProyekTrack('proyek1')).toBe(true);
        });

        it('should return true for proyek2', () => {
            expect(isProyekTrack('proyek2')).toBe(true);
        });

        it('should return true for proyek3', () => {
            expect(isProyekTrack('proyek3')).toBe(true);
        });

        it('should return false for internship1', () => {
            expect(isProyekTrack('internship1')).toBe(false);
        });

        it('should return false for internship2', () => {
            expect(isProyekTrack('internship2')).toBe(false);
        });

        it('should return false for null', () => {
            expect(isProyekTrack(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isProyekTrack(undefined)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isProyekTrack('')).toBe(false);
        });
    });

    // ============================================
    // isInternshipTrack
    // ============================================
    describe('isInternshipTrack', () => {
        it('should return true for internship1', () => {
            expect(isInternshipTrack('internship1')).toBe(true);
        });

        it('should return true for internship2', () => {
            expect(isInternshipTrack('internship2')).toBe(true);
        });

        it('should return false for proyek1', () => {
            expect(isInternshipTrack('proyek1')).toBe(false);
        });

        it('should return false for proyek2', () => {
            expect(isInternshipTrack('proyek2')).toBe(false);
        });

        it('should return false for proyek3', () => {
            expect(isInternshipTrack('proyek3')).toBe(false);
        });

        it('should return false for null', () => {
            expect(isInternshipTrack(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isInternshipTrack(undefined)).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isInternshipTrack('')).toBe(false);
        });
    });

    // ============================================
    // calculateSemester
    // ============================================
    describe('calculateSemester', () => {
        it('should return null for null angkatan', () => {
            expect(calculateSemester(null)).toBeNull();
        });

        it('should return null for undefined angkatan', () => {
            expect(calculateSemester(undefined)).toBeNull();
        });

        it('should return null for 0 angkatan', () => {
            expect(calculateSemester(0)).toBeNull();
        });

        // Semester GANJIL (Oktober - Februari)
        it('should calculate semester 1 for first year student in October', () => {
            const october = new Date(2024, 9, 15); // October 15, 2024
            expect(calculateSemester(2024, october)).toBe(1);
        });

        it('should calculate semester 1 for first year student in November', () => {
            const november = new Date(2024, 10, 15); // November 15, 2024
            expect(calculateSemester(2024, november)).toBe(1);
        });

        it('should calculate semester 1 for first year student in December', () => {
            const december = new Date(2024, 11, 15); // December 15, 2024
            expect(calculateSemester(2024, december)).toBe(1);
        });

        it('should calculate semester 1 for first year student in January (next year)', () => {
            const january = new Date(2025, 0, 15); // January 15, 2025
            expect(calculateSemester(2024, january)).toBe(1);
        });

        it('should calculate semester 1 for first year student in February (next year)', () => {
            const february = new Date(2025, 1, 15); // February 15, 2025
            expect(calculateSemester(2024, february)).toBe(1);
        });

        // Semester GENAP (Maret - September)
        it('should calculate semester 2 for first year student in March', () => {
            const march = new Date(2025, 2, 15); // March 15, 2025
            expect(calculateSemester(2024, march)).toBe(2);
        });

        it('should calculate semester 2 for first year student in April', () => {
            const april = new Date(2025, 3, 15); // April 15, 2025
            expect(calculateSemester(2024, april)).toBe(2);
        });

        it('should calculate semester 2 for first year student in September', () => {
            const september = new Date(2025, 8, 15); // September 15, 2025
            expect(calculateSemester(2024, september)).toBe(2);
        });

        // Multi-year calculations
        it('should calculate semester 3 for second year student in October', () => {
            const october = new Date(2025, 9, 15); // October 15, 2025
            expect(calculateSemester(2024, october)).toBe(3);
        });

        it('should calculate semester 4 for second year student in March', () => {
            const march = new Date(2026, 2, 15); // March 15, 2026
            expect(calculateSemester(2024, march)).toBe(4);
        });

        it('should calculate semester 5 for third year student in October', () => {
            const october = new Date(2026, 9, 15); // October 15, 2026
            expect(calculateSemester(2024, october)).toBe(5);
        });

        it('should calculate semester 7 for fourth year student in October', () => {
            const october = new Date(2027, 9, 15); // October 15, 2027
            expect(calculateSemester(2024, october)).toBe(7);
        });

        it('should calculate semester 8 for fourth year student in March', () => {
            const march = new Date(2028, 2, 15); // March 15, 2028
            expect(calculateSemester(2024, march)).toBe(8);
        });
    });
});
