import { describe, it, expect } from '@jest/globals';
import {
    SEMESTER_LABELS,
    SEMESTER_LABELS_SHORT,
    getSemesterLabel,
    TRACK_SEMESTER_MAP,
    isProyekTrack,
    isInternshipTrack
} from '../../utils/constants.js';

describe('Constants', () => {
    describe('SEMESTER_LABELS', () => {
        it('should have labels for all project semesters', () => {
            expect(SEMESTER_LABELS[2]).toBe('Proyek 1 (Semester 2)');
            expect(SEMESTER_LABELS[3]).toBe('Proyek 2 (Semester 3)');
            expect(SEMESTER_LABELS[5]).toBe('Proyek 3 (Semester 5)');
        });

        it('should have labels for all internship semesters', () => {
            expect(SEMESTER_LABELS[7]).toBe('Internship 1 (Semester 7)');
            expect(SEMESTER_LABELS[8]).toBe('Internship 2 (Semester 8)');
        });
    });

    describe('SEMESTER_LABELS_SHORT', () => {
        it('should have short labels for all semesters', () => {
            expect(SEMESTER_LABELS_SHORT[2]).toBe('Proyek 1');
            expect(SEMESTER_LABELS_SHORT[3]).toBe('Proyek 2');
            expect(SEMESTER_LABELS_SHORT[5]).toBe('Proyek 3');
            expect(SEMESTER_LABELS_SHORT[7]).toBe('Internship 1');
            expect(SEMESTER_LABELS_SHORT[8]).toBe('Internship 2');
        });
    });

    describe('getSemesterLabel', () => {
        it('should return full label by default', () => {
            expect(getSemesterLabel(2)).toBe('Proyek 1 (Semester 2)');
            expect(getSemesterLabel(7)).toBe('Internship 1 (Semester 7)');
        });

        it('should return short label when requested', () => {
            expect(getSemesterLabel(2, true)).toBe('Proyek 1');
            expect(getSemesterLabel(7, true)).toBe('Internship 1');
        });

        it('should return null for invalid semester', () => {
            expect(getSemesterLabel(99)).toBeNull();
            expect(getSemesterLabel(null)).toBeNull();
            expect(getSemesterLabel(undefined)).toBeNull();
        });
    });

    describe('TRACK_SEMESTER_MAP', () => {
        it('should map proyek tracks to correct semesters', () => {
            expect(TRACK_SEMESTER_MAP['proyek1']).toBe(2);
            expect(TRACK_SEMESTER_MAP['proyek2']).toBe(3);
            expect(TRACK_SEMESTER_MAP['proyek3']).toBe(5);
        });

        it('should map internship tracks to correct semesters', () => {
            expect(TRACK_SEMESTER_MAP['internship1']).toBe(7);
            expect(TRACK_SEMESTER_MAP['internship2']).toBe(8);
        });
    });

    describe('isProyekTrack', () => {
        it('should return true for proyek tracks', () => {
            expect(isProyekTrack('proyek1')).toBe(true);
            expect(isProyekTrack('proyek2')).toBe(true);
            expect(isProyekTrack('proyek3')).toBe(true);
        });

        it('should return false for non-proyek tracks', () => {
            expect(isProyekTrack('internship1')).toBe(false);
            expect(isProyekTrack('internship2')).toBe(false);
            expect(isProyekTrack(null)).toBe(false);
            expect(isProyekTrack(undefined)).toBe(false);
        });
    });

    describe('isInternshipTrack', () => {
        it('should return true for internship tracks', () => {
            expect(isInternshipTrack('internship1')).toBe(true);
            expect(isInternshipTrack('internship2')).toBe(true);
        });

        it('should return false for non-internship tracks', () => {
            expect(isInternshipTrack('proyek1')).toBe(false);
            expect(isInternshipTrack('proyek2')).toBe(false);
            expect(isInternshipTrack(null)).toBe(false);
            expect(isInternshipTrack(undefined)).toBe(false);
        });
    });
});
