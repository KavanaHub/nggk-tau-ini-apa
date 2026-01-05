-- Fix jadwal_proyek foreign key constraint
-- Sebelumnya reference ke tabel koordinator, sekarang koordinator sudah di-merge ke tabel dosen

-- Drop existing FK constraint (jika ada)
ALTER TABLE jadwal_proyek DROP FOREIGN KEY IF EXISTS fk_jadwal_created_by;

-- Drop the FK constraint (MySQL 5.7 syntax if IF EXISTS not supported)
-- ALTER TABLE jadwal_proyek DROP FOREIGN KEY fk_jadwal_created_by;

-- Recreate FK to reference dosen table instead
ALTER TABLE jadwal_proyek 
ADD CONSTRAINT fk_jadwal_created_by 
FOREIGN KEY (created_by) REFERENCES dosen(id) ON DELETE SET NULL;

-- Atau jika tidak mau pakai FK sama sekali (lebih simple):
-- ALTER TABLE jadwal_proyek MODIFY created_by BIGINT DEFAULT NULL;
-- (tanpa FK constraint)
