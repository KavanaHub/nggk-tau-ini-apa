-- ============================================================
-- Migration 009: Add Performance Indexes
-- Target: Reduce full-table scans on frequently filtered columns
-- Run: mysql -h HOST -u USER -p bimbingan_online < migrations/009_add_performance_indexes.sql
-- ============================================================

USE `bimbingan_online`;

-- 1. mahasiswa: filter by status_proposal (pending/approved/rejected)
ALTER TABLE `mahasiswa` ADD INDEX `idx_status_proposal` (`status_proposal`);

-- 2. mahasiswa: filter by track (proyek1/proyek2/proyek3/internship1/internship2)
ALTER TABLE `mahasiswa` ADD INDEX `idx_track` (`track`);

-- 3. dosen: filter active dosen
ALTER TABLE `dosen` ADD INDEX `idx_is_active` (`is_active`);

-- 4. bimbingan: filter by status (waiting/approved/rejected)
ALTER TABLE `bimbingan` ADD INDEX `idx_bimbingan_status` (`status`);

-- 5. mahasiswa: filter/search by nama
ALTER TABLE `mahasiswa` ADD INDEX `idx_nama` (`nama`);

-- Verify indexes
SHOW INDEX FROM `mahasiswa`;
SHOW INDEX FROM `dosen`;
SHOW INDEX FROM `bimbingan`;

