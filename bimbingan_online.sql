-- --------------------------------------------------------
-- Host:                         43.106.25.105
-- Server version:               8.0.44-0ubuntu0.24.04.2 - (Ubuntu)
-- Server OS:                    Linux
-- HeidiSQL Version:             12.13.0.7147
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for bimbingan_online
DROP DATABASE IF EXISTS `bimbingan_online`;
CREATE DATABASE IF NOT EXISTS `bimbingan_online` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `bimbingan_online`;

-- Dumping structure for table bimbingan_online.bimbingan
DROP TABLE IF EXISTS `bimbingan`;
CREATE TABLE IF NOT EXISTS `bimbingan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mahasiswa_id` bigint NOT NULL,
  `dosen_id` bigint NOT NULL,
  `tanggal` date NOT NULL,
  `minggu_ke` tinyint NOT NULL,
  `topik` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `catatan` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('waiting','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `dosen_id` (`dosen_id`),
  CONSTRAINT `bimbingan_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bimbingan_ibfk_2` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.bimbingan
-- Sample bimbingan untuk mahasiswa yang sudah approved dan punya dosen
INSERT INTO `bimbingan` (`id`, `mahasiswa_id`, `dosen_id`, `tanggal`, `minggu_ke`, `topik`, `catatan`, `status`, `approved_at`, `created_at`) VALUES
	-- Bimbingan untuk Ahmad Fauzi (Kelompok 2 - proyek1)
	(1, 3, 1, '2026-01-08', 1, 'Diskusi BAB 1 Pendahuluan', 'Latar belakang perlu diperjelas', 'approved', '2026-01-08 10:00:00', '2026-01-08 09:00:00'),
	(2, 3, 1, '2026-01-15', 2, 'Review Metodologi Penelitian', 'Metode sudah sesuai', 'approved', '2026-01-15 10:00:00', '2026-01-15 09:00:00'),
	(3, 3, 1, '2026-01-22', 3, 'Pembahasan Entity Relationship Diagram', NULL, 'waiting', NULL, '2026-01-22 09:00:00'),
	-- Bimbingan untuk Budi Santoso (Kelompok 3 - proyek3)
	(4, 5, 2, '2026-01-05', 1, 'Konsultasi Proposal Awal', 'Judul sudah oke', 'approved', '2026-01-05 14:00:00', '2026-01-05 13:00:00'),
	(5, 5, 2, '2026-01-12', 2, 'Review Desain UI/UX', 'Perlu perbaikan navigasi', 'approved', '2026-01-12 14:00:00', '2026-01-12 13:00:00'),
	(6, 5, 2, '2026-01-19', 3, 'Demo Prototype Aplikasi', 'Bagus, lanjutkan development', 'approved', '2026-01-19 14:00:00', '2026-01-19 13:00:00'),
	(7, 5, 2, '2026-01-26', 4, 'Review Kode Backend', NULL, 'waiting', NULL, '2026-01-26 13:00:00'),
	-- Bimbingan untuk Eko Prasetyo (Kelompok 4 - proyek2)
	(8, 7, 4, '2026-01-07', 1, 'Diskusi Awal Proyek', 'Tema sudah disetujui', 'approved', '2026-01-07 11:00:00', '2026-01-07 10:00:00'),
	(9, 7, 4, '2026-01-14', 2, 'Review Business Logic', NULL, 'approved', '2026-01-14 11:00:00', '2026-01-14 10:00:00'),
	-- Bimbingan untuk Gilang Ramadhan (internship1)
	(10, 9, 5, '2026-01-10', 1, 'Laporan Minggu 1 Magang', 'Adaptasi berjalan baik', 'approved', '2026-01-10 16:00:00', '2026-01-10 15:00:00'),
	(11, 9, 5, '2026-01-17', 2, 'Progress Report Magang', 'Sudah mulai project kecil', 'approved', '2026-01-17 16:00:00', '2026-01-17 15:00:00'),
	(12, 9, 5, '2026-01-24', 3, 'Diskusi Kendala di Tempat Magang', NULL, 'waiting', NULL, '2026-01-24 15:00:00'),
	-- Bimbingan untuk Irfan Hakim (internship2)
	(13, 11, 8, '2026-01-06', 1, 'Orientasi Magang', 'Berjalan lancar', 'approved', '2026-01-06 09:00:00', '2026-01-06 08:00:00'),
	(14, 11, 8, '2026-01-13', 2, 'Progress Mingguan', 'Sudah handle feature kecil', 'approved', '2026-01-13 09:00:00', '2026-01-13 08:00:00'),
	(15, 11, 8, '2026-01-20', 3, 'Review Code Contribution', 'PR sudah di-merge', 'approved', '2026-01-20 09:00:00', '2026-01-20 08:00:00'),
	(16, 11, 8, '2026-01-27', 4, 'Diskusi Final Project', NULL, 'waiting', NULL, '2026-01-27 08:00:00');

-- Dumping structure for table bimbingan_online.dosen
DROP TABLE IF EXISTS `dosen`;
CREATE TABLE IF NOT EXISTS `dosen` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nidn` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_wa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.dosen: ~9 rows (approximately)
INSERT INTO `dosen` (`id`, `email`, `password_hash`, `nidn`, `nama`, `no_wa`, `is_active`, `created_at`) VALUES
	(1, 'yusrilhelmi@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0407117405', 'M. Yusril Helmi Setyawan, S.Kom., M.Kom.,SFPC.', NULL, 1, '2026-01-15 03:50:50'),
	(2, 'awangga@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0410118609', 'Rolly Maulana Awangga,S.T.,MT.,CAIP, SFPC.', NULL, 1, '2026-01-15 03:50:50'),
	(3, 'roniandarsyah@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0420058801', 'Roni Andarsyah, S.T., M.Kom., SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(4, 'm.nurkamal.f@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0402058005', 'Mohamad Nurkamal Fauzan, S.T., M.T., SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(5, 'cahyo@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0427078404', 'Cahyo Prianto, S.Pd., M.T.,CDSP, SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(6, 'syafrial.fachri@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0416048803', 'Syafrial Fachri Pane,ST. MTI,EBDP.CDSP,SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(7, 'roni.habibi@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0423127804', 'Roni Habibi, S.Kom., M.T., SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(8, 'nisa@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0415048901', 'Nisa Hanum Harani, S.Kom., M.T.,CDSP, SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(9, 'nurainisf@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0402047205', 'Rd. Nuraini Siti Fathonah, S.S., M.Hum., SFPC', NULL, 1, '2026-01-15 03:50:50');

-- Dumping structure for table bimbingan_online.dosen_role
DROP TABLE IF EXISTS `dosen_role`;
CREATE TABLE IF NOT EXISTS `dosen_role` (
  `dosen_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `assigned_semester` int DEFAULT NULL,
  PRIMARY KEY (`dosen_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `dosen_role_ibfk_1` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dosen_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.dosen_role: ~10 rows (approximately)
INSERT INTO `dosen_role` (`dosen_id`, `role_id`, `assigned_semester`) VALUES
	(1, 1, NULL),
	(2, 1, NULL),
	(3, 1, NULL),
	(3, 2, 3),
	(3, 3, NULL),
	(4, 1, NULL),
	(5, 1, NULL),
	(6, 1, NULL),
	(7, 1, NULL),
	(8, 1, NULL),
	(9, 1, NULL);

-- Dumping structure for table bimbingan_online.jadwal_proyek
DROP TABLE IF EXISTS `jadwal_proyek`;
CREATE TABLE IF NOT EXISTS `jadwal_proyek` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` enum('proyek','internship','lainnya') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'proyek',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `deskripsi` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` bigint DEFAULT NULL,
  `semester` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `jadwal_proyek_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `dosen` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.jadwal_proyek
INSERT INTO `jadwal_proyek` (`id`, `nama`, `tipe`, `start_date`, `end_date`, `status`, `deskripsi`, `created_by`, `semester`, `created_at`, `updated_at`) VALUES
	(1, 'Proyek 2 Angkatan 24', 'proyek', '2026-01-15', '2026-05-15', 'active', 'Periode proyek semester 3', 3, 3, '2026-01-15 12:43:45', '2026-01-15 12:43:45'),
	(2, 'Proyek 1 Angkatan 25', 'proyek', '2026-01-15', '2026-05-15', 'active', 'Periode proyek semester 2', 3, 2, '2026-01-15 12:43:45', '2026-01-15 12:43:45'),
	(3, 'Proyek 3 Angkatan 23', 'proyek', '2026-01-15', '2026-05-15', 'active', 'Periode proyek semester 5', 3, 5, '2026-01-15 12:43:45', '2026-01-15 12:43:45'),
	(4, 'Internship 1 Angkatan 22', 'internship', '2026-01-15', '2026-06-15', 'active', 'Periode internship semester 7', 3, 7, '2026-01-15 12:43:45', '2026-01-15 12:43:45'),
	(5, 'Internship 2 Angkatan 22', 'internship', '2026-01-15', '2026-06-15', 'active', 'Periode internship semester 8', 3, 8, '2026-01-15 12:43:45', '2026-01-15 12:43:45');

-- Dumping structure for table bimbingan_online.kelompok
DROP TABLE IF EXISTS `kelompok`;
CREATE TABLE IF NOT EXISTS `kelompok` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `track` enum('proyek1','proyek2','proyek3','internship1','internship2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.kelompok
INSERT INTO `kelompok` (`id`, `nama`, `track`, `created_at`) VALUES
	(1, 'Kelompok PROYEK2 - Al Fanisa Basri & Bagas Agung Wiyono', 'proyek2', '2026-01-15 12:44:56'),
	(2, 'Kelompok PROYEK1 - Ahmad Fauzi & Dewi Lestari', 'proyek1', '2026-01-15 12:45:00'),
	(3, 'Kelompok PROYEK3 - Budi Santoso & Rina Wati', 'proyek3', '2026-01-15 12:45:00'),
	(4, 'Kelompok PROYEK2 - Eko Prasetyo & Fitri Handayani', 'proyek2', '2026-01-15 12:45:00');

-- Dumping structure for table bimbingan_online.laporan_sidang
DROP TABLE IF EXISTS `laporan_sidang`;
CREATE TABLE IF NOT EXISTS `laporan_sidang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mahasiswa_id` bigint NOT NULL,
  `file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('submitted','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `approved_by` bigint DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `laporan_sidang_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `laporan_sidang_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `dosen` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.laporan_sidang: ~0 rows (approximately)

-- Dumping structure for table bimbingan_online.mahasiswa
DROP TABLE IF EXISTS `mahasiswa`;
CREATE TABLE IF NOT EXISTS `mahasiswa` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `npm` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_wa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `angkatan` int DEFAULT NULL,
  `track` enum('proyek1','proyek2','proyek3','internship1','internship2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kelompok_id` bigint DEFAULT NULL,
  `judul_proyek` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_proposal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_proposal` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usulan_dosen_id` bigint DEFAULT NULL,
  `dosen_id` bigint DEFAULT NULL,
  `dosen_id_2` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `pending_partner_npm` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `npm` (`npm`),
  KEY `kelompok_id` (`kelompok_id`),
  KEY `usulan_dosen_id` (`usulan_dosen_id`),
  KEY `dosen_id` (`dosen_id`),
  KEY `dosen_id_2` (`dosen_id_2`),
  CONSTRAINT `mahasiswa_ibfk_1` FOREIGN KEY (`kelompok_id`) REFERENCES `kelompok` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mahasiswa_ibfk_2` FOREIGN KEY (`usulan_dosen_id`) REFERENCES `dosen` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mahasiswa_ibfk_3` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mahasiswa_ibfk_4` FOREIGN KEY (`dosen_id_2`) REFERENCES `dosen` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.mahasiswa
-- Password for all: User1234 (hash: $2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu)
INSERT INTO `mahasiswa` (`id`, `email`, `password_hash`, `npm`, `nama`, `no_wa`, `angkatan`, `track`, `kelompok_id`, `judul_proyek`, `file_proposal`, `status_proposal`, `usulan_dosen_id`, `dosen_id`, `dosen_id_2`, `created_at`, `pending_partner_npm`) VALUES
	-- Kelompok 1 (Proyek 2 - Semester 3)
	(1, '714240042@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714240042', 'Bagas Agung Wiyono', '085179935117', 2024, 'proyek2', 1, 'Implementasi Laravel Dalam Website E-commerce', 'https://drive.google.com/file/d/example1', 'pending', 3, NULL, NULL, '2026-01-15 11:53:28', NULL),
	(2, '714240043@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714240043', 'Al Fanisa Basri', '085179935118', 2024, 'proyek2', 1, 'Implementasi Laravel Dalam Website E-commerce', 'https://drive.google.com/file/d/example1', 'pending', 3, NULL, NULL, '2026-01-15 11:53:58', NULL),
	-- Kelompok 2 (Proyek 1 - Semester 2)
	(3, '714250001@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250001', 'Ahmad Fauzi', '085179935119', 2025, 'proyek1', 2, 'Sistem Informasi Perpustakaan', 'https://drive.google.com/file/d/example2', 'approved', 1, 1, NULL, '2026-01-15 12:00:00', NULL),
	(4, '714250002@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250002', 'Dewi Lestari', '085179935120', 2025, 'proyek1', 2, 'Sistem Informasi Perpustakaan', 'https://drive.google.com/file/d/example2', 'approved', 1, 1, NULL, '2026-01-15 12:00:00', NULL),
	-- Kelompok 3 (Proyek 3 - Semester 5)
	(5, '714230001@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230001', 'Budi Santoso', '085179935121', 2023, 'proyek3', 3, 'Aplikasi Mobile Kesehatan', 'https://drive.google.com/file/d/example3', 'approved', 2, 2, NULL, '2026-01-15 12:00:00', NULL),
	(6, '714230002@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230002', 'Rina Wati', '085179935122', 2023, 'proyek3', 3, 'Aplikasi Mobile Kesehatan', 'https://drive.google.com/file/d/example3', 'approved', 2, 2, NULL, '2026-01-15 12:00:00', NULL),
	-- Kelompok 4 (Proyek 2 - Semester 3)
	(7, '714240044@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714240044', 'Eko Prasetyo', '085179935123', 2024, 'proyek2', 4, 'Website Manajemen Inventaris', 'https://drive.google.com/file/d/example4', 'approved', 4, 4, NULL, '2026-01-15 12:00:00', NULL),
	(8, '714240045@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714240045', 'Fitri Handayani', '085179935124', 2024, 'proyek2', 4, 'Website Manajemen Inventaris', 'https://drive.google.com/file/d/example4', 'approved', 4, 4, NULL, '2026-01-15 12:00:00', NULL),
	-- Internship 1 (Semester 7 - butuh 2 pembimbing)
	(9, '714220001@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220001', 'Gilang Ramadhan', '085179935125', 2022, 'internship1', NULL, 'Magang di PT Telkom Indonesia', 'https://drive.google.com/file/d/example5', 'approved', 5, 5, 6, '2026-01-15 12:00:00', NULL),
	(10, '714220002@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220002', 'Hana Pertiwi', '085179935126', 2022, 'internship1', NULL, 'Magang di PT Tokopedia', 'https://drive.google.com/file/d/example6', 'approved', 7, 7, 8, '2026-01-15 12:00:00', NULL),
	-- Internship 2 (Semester 8 - butuh 2 pembimbing)
	(11, '714220003@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220003', 'Irfan Hakim', '085179935127', 2022, 'internship2', NULL, 'Magang di PT Gojek', 'https://drive.google.com/file/d/example7', 'approved', 8, 8, 9, '2026-01-15 12:00:00', NULL),
	(12, '714220004@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220004', 'Jihan Aulia', '085179935128', 2022, 'internship2', NULL, 'Magang di PT Bukalapak', 'https://drive.google.com/file/d/example8', 'pending', 9, NULL, NULL, '2026-01-15 12:00:00', NULL);

-- Dumping structure for table bimbingan_online.role
DROP TABLE IF EXISTS `role`;
CREATE TABLE IF NOT EXISTS `role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nama_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nama_role` (`nama_role`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.role: ~3 rows (approximately)
INSERT INTO `role` (`id`, `nama_role`) VALUES
	(1, 'dosen'),
	(2, 'koordinator'),
	(3, 'kaprodi');

-- Dumping structure for table bimbingan_online.sidang
DROP TABLE IF EXISTS `sidang`;
CREATE TABLE IF NOT EXISTS `sidang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mahasiswa_id` bigint NOT NULL,
  `tanggal` date NOT NULL,
  `waktu` time NOT NULL,
  `ruangan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('scheduled','ongoing','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  CONSTRAINT `sidang_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.sidang: ~0 rows (approximately)

-- Dumping structure for table bimbingan_online.sidang_penguji
DROP TABLE IF EXISTS `sidang_penguji`;
CREATE TABLE IF NOT EXISTS `sidang_penguji` (
  `sidang_id` bigint NOT NULL,
  `dosen_id` bigint NOT NULL,
  `peran` enum('pembimbing','penguji1','penguji2','ketua') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`sidang_id`,`dosen_id`),
  KEY `dosen_id` (`dosen_id`),
  CONSTRAINT `sidang_penguji_ibfk_1` FOREIGN KEY (`sidang_id`) REFERENCES `sidang` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sidang_penguji_ibfk_2` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.sidang_penguji: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
