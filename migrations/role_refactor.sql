-- =====================================================
-- MIGRATION: From Old Schema to New Normalized Schema
-- =====================================================
-- This migration file is for reference only.
-- The new schema is defined in bimbingan_online.sql
--
-- KEY CHANGES:
-- 1. Removed `jabatan` column from `dosen` table
-- 2. Removed `assigned_semester` column from `dosen` table
-- 3. Created `role` table with `nama_role` column
-- 4. Created `dosen_role` pivot table with `assigned_semester`
-- 5. Created `sidang_penguji` pivot table (penguji now via pivot)
-- 6. Removed `penguji` table (penguji are just dosen with roles)
--
-- To apply the new schema:
-- 1. Backup existing data
-- 2. Run bimbingan_online.sql (creates fresh database)
-- 3. Migrate data from backup if needed
-- =====================================================

-- If migrating from existing database, run these queries:

-- Step 1: Create role table
CREATE TABLE IF NOT EXISTS `role` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `nama_role` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Step 2: Seed roles
INSERT INTO `role` (`nama_role`) VALUES
('dosen'),
('koordinator'),
('kaprodi')
ON DUPLICATE KEY UPDATE nama_role = nama_role;

-- Step 3: Create dosen_role pivot table
CREATE TABLE IF NOT EXISTS `dosen_role` (
  `dosen_id` BIGINT NOT NULL,
  `role_id` BIGINT NOT NULL,
  `assigned_semester` INT DEFAULT NULL,
  PRIMARY KEY (`dosen_id`, `role_id`),
  FOREIGN KEY (`dosen_id`) REFERENCES `dosen`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 4: Migrate existing jabatan data to dosen_role
-- All active dosen get 'dosen' role
INSERT IGNORE INTO dosen_role (dosen_id, role_id)
SELECT d.id, r.id FROM dosen d, role r WHERE r.nama_role = 'dosen' AND d.is_active = 1;

-- Dosen with 'koordinator' in old jabatan get 'koordinator' role with assigned_semester
INSERT IGNORE INTO dosen_role (dosen_id, role_id, assigned_semester)
SELECT d.id, r.id, d.assigned_semester 
FROM dosen d, role r 
WHERE r.nama_role = 'koordinator' AND d.jabatan LIKE '%koordinator%';

-- Dosen with 'kaprodi' in old jabatan get 'kaprodi' role
INSERT IGNORE INTO dosen_role (dosen_id, role_id)
SELECT d.id, r.id FROM dosen d, role r 
WHERE r.nama_role = 'kaprodi' AND d.jabatan LIKE '%kaprodi%';

-- Step 5: Create sidang_penguji pivot table
CREATE TABLE IF NOT EXISTS `sidang_penguji` (
  `sidang_id` BIGINT NOT NULL,
  `dosen_id` BIGINT NOT NULL,
  `peran` ENUM('pembimbing','penguji1','penguji2','ketua') NOT NULL,
  PRIMARY KEY (`sidang_id`,`dosen_id`),
  FOREIGN KEY (`sidang_id`) REFERENCES `sidang`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`dosen_id`) REFERENCES `dosen`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Step 6: Drop old columns (ONLY after verifying migration is correct!)
-- ALTER TABLE `dosen` DROP COLUMN `jabatan`;
-- ALTER TABLE `dosen` DROP COLUMN `assigned_semester`;
