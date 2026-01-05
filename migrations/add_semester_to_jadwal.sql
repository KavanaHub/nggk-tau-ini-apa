-- Update jadwal_proyek table untuk menambah semester
ALTER TABLE jadwal_proyek 
ADD COLUMN semester INT DEFAULT NULL COMMENT 'Semester mahasiswa yang eligible (2,3,5,7,8)';

-- Contoh data:
-- INSERT INTO jadwal_proyek (nama, tipe, semester, start_date, end_date, status) VALUES
-- ('Proyek 1 Semester Ganjil 2024', 'proyek', 2, '2024-09-01', '2025-01-31', 'active'),
-- ('Proyek 2 Semester Ganjil 2024', 'proyek', 3, '2024-09-01', '2025-01-31', 'active'),
-- ('Proyek 3 Semester Ganjil 2024', 'proyek', 5, '2024-09-01', '2025-01-31', 'active'),
-- ('Internship 1 Semester Ganjil 2024', 'internship', 7, '2024-09-01', '2025-01-31', 'active'),
-- ('Internship 2 Semester Ganjil 2024', 'internship', 8, '2024-09-01', '2025-01-31', 'active');
