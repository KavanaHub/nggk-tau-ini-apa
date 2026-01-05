-- ============================================
-- MIGRATION: Merge Koordinator into Dosen Table
-- ============================================
-- Koordinator sekarang adalah dosen dengan jabatan 'koordinator'
-- Tidak perlu tabel koordinator terpisah

-- 1. Update kolom jabatan di dosen untuk support koordinator
-- jabatan bisa: 'dosen', 'kaprodi', 'koordinator', atau kombinasi
-- Contoh: 'dosen,koordinator' atau 'dosen,kaprodi'

-- 2. Tambah kolom assigned_semester ke tabel dosen
-- (untuk dosen yang punya jabatan koordinator)
ALTER TABLE dosen 
ADD COLUMN assigned_semester INT DEFAULT NULL 
COMMENT 'Semester yang di-assign untuk koordinator (2,3,5,7,8)';

-- 3. Tambah unique index agar 1 semester hanya 1 koordinator
-- Note: MySQL allows multiple NULL values in unique index
ALTER TABLE dosen
ADD UNIQUE INDEX uk_assigned_semester (assigned_semester);

-- 4. (OPTIONAL) Migrate existing data dari tabel koordinator ke dosen
-- Jalankan ini jika ada data koordinator yang perlu dipindahkan:
-- 
-- INSERT INTO dosen (email, password_hash, nidn, nama, no_wa, jabatan, is_active)
-- SELECT email, password_hash, nidn, nama, no_wa, 'dosen,koordinator', is_active
-- FROM koordinator
-- WHERE email NOT IN (SELECT email FROM dosen);
--
-- Untuk koordinator yang sudah ada di dosen, update jabatan:
-- UPDATE dosen d
-- INNER JOIN koordinator k ON d.email = k.email
-- SET d.jabatan = CONCAT(d.jabatan, ',koordinator');

-- 5. (OPTIONAL) Setelah migrasi selesai dan yakin, drop tabel koordinator:
-- DROP TABLE IF EXISTS koordinator;
