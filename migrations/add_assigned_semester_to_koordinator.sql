-- Tambah kolom assigned_semester ke tabel koordinator
-- 1 koordinator = 1 semester (one-to-one)
-- Semester valid: 2,3,5,7,8

ALTER TABLE koordinator 
ADD COLUMN assigned_semester INT DEFAULT NULL 
COMMENT 'Semester yang di-assign (2=Proyek1, 3=Proyek2, 5=Proyek3, 7=Internship1, 8=Internship2)';

-- Tambah unique constraint agar 1 semester hanya bisa 1 koordinator
ALTER TABLE koordinator
ADD UNIQUE INDEX uk_assigned_semester (assigned_semester);
