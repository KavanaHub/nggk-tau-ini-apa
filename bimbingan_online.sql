-- --------------------------------------------------------
-- Host:                         43.106.25.105
-- Server version:               8.0.45-0ubuntu0.24.04.1 - (Ubuntu)
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
  `status` enum('waiting','pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `dosen_id` (`dosen_id`),
  KEY `idx_bimbingan_status` (`status`),
  CONSTRAINT `bimbingan_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bimbingan_ibfk_2` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.bimbingan: ~33 rows (approximately)
INSERT INTO `bimbingan` (`id`, `mahasiswa_id`, `dosen_id`, `tanggal`, `minggu_ke`, `topik`, `catatan`, `status`, `approved_at`, `created_at`) VALUES
	(1, 3, 1, '2026-01-08', 1, 'Diskusi BAB 1 Pendahuluan', 'Latar belakang perlu diperjelas', 'approved', '2026-01-08 10:00:00', '2026-01-08 09:00:00'),
	(2, 3, 1, '2026-01-15', 2, 'Review Metodologi Penelitian', 'Metode sudah sesuai', 'approved', '2026-01-15 10:00:00', '2026-01-15 09:00:00'),
	(3, 3, 1, '2026-01-22', 3, 'Pembahasan Entity Relationship Diagram', NULL, 'waiting', NULL, '2026-01-22 09:00:00'),
	(4, 5, 2, '2026-01-05', 1, 'Konsultasi Proposal Awal', 'Judul sudah oke', 'approved', '2026-01-05 14:00:00', '2026-01-05 13:00:00'),
	(5, 5, 2, '2026-01-12', 2, 'Review Desain UI/UX', 'Perlu perbaikan navigasi', 'approved', '2026-01-12 14:00:00', '2026-01-12 13:00:00'),
	(6, 5, 2, '2026-01-19', 3, 'Demo Prototype Aplikasi', 'Bagus, lanjutkan development', 'approved', '2026-01-19 14:00:00', '2026-01-19 13:00:00'),
	(7, 5, 2, '2026-01-26', 4, 'Review Kode Backend', NULL, 'waiting', NULL, '2026-01-26 13:00:00'),
	(8, 7, 4, '2026-01-07', 1, 'Diskusi Awal Proyek', 'Tema sudah disetujui', 'approved', '2026-01-07 11:00:00', '2026-01-07 10:00:00'),
	(9, 7, 4, '2026-01-14', 2, 'Review Business Logic', NULL, 'approved', '2026-01-14 11:00:00', '2026-01-14 10:00:00'),
	(10, 9, 5, '2026-01-10', 1, 'Laporan Minggu 1 Magang', 'Adaptasi berjalan baik', 'approved', '2026-01-10 16:00:00', '2026-01-10 15:00:00'),
	(11, 9, 5, '2026-01-17', 2, 'Progress Report Magang', 'Sudah mulai project kecil', 'approved', '2026-01-17 16:00:00', '2026-01-17 15:00:00'),
	(12, 9, 5, '2026-01-24', 3, 'Diskusi Kendala di Tempat Magang', NULL, 'waiting', NULL, '2026-01-24 15:00:00'),
	(13, 11, 8, '2026-01-06', 1, 'Orientasi Magang', 'Berjalan lancar', 'approved', '2026-01-06 09:00:00', '2026-01-06 08:00:00'),
	(14, 11, 8, '2026-01-13', 2, 'Progress Mingguan', 'Sudah handle feature kecil', 'approved', '2026-01-13 09:00:00', '2026-01-13 08:00:00'),
	(15, 11, 8, '2026-01-20', 3, 'Review Code Contribution', 'PR sudah di-merge', 'approved', '2026-01-20 09:00:00', '2026-01-20 08:00:00'),
	(16, 11, 8, '2026-01-27', 4, 'Diskusi Final Project', NULL, 'waiting', NULL, '2026-01-27 08:00:00'),
	(27, 1, 3, '2025-11-20', 1, 'Pengajuan Judul E-Commerce', 'Judul menarik, lanjut proposal', 'approved', '2025-11-20 10:00:00', '2025-11-20 09:00:00'),
	(28, 1, 3, '2025-11-27', 2, 'Revisi Proposal', 'Perbaiki metodologi', 'approved', '2025-11-27 10:00:00', '2025-11-27 09:00:00'),
	(29, 1, 3, '2025-12-04', 3, 'Acc Proposal & Lanjut Bab 1', 'Silahkan lanjut', 'approved', '2025-12-04 10:00:00', '2025-12-04 09:00:00'),
	(30, 1, 3, '2025-12-11', 4, 'Revisi Bab 1', 'Latar belakang pertajam', 'approved', '2025-12-11 10:00:00', '2025-12-11 09:00:00'),
	(31, 1, 3, '2025-12-18', 5, 'Asistensi Bab 2', 'Teori pendukung sudah cukup', 'approved', '2025-12-18 10:00:00', '2025-12-18 09:00:00'),
	(32, 1, 3, '2026-01-08', 6, 'Perancangan Sistem (Bab 3)', 'ERD dan Use Case sudah benar', 'approved', '2026-01-08 10:00:00', '2026-01-08 09:00:00'),
	(33, 1, 3, '2026-01-15', 7, 'Implementasi Laravel', 'Pastikan fitur cart berjalan', 'approved', '2026-01-15 10:00:00', '2026-01-15 09:00:00'),
	(34, 1, 3, '2026-01-22', 8, 'Testing & Integrasi Payment', 'Siap untuk demo minggu depan', 'approved', '2026-01-22 10:00:00', '2026-01-22 09:00:00'),
	(35, 21, 3, '2026-01-27', 1, 'menentukan judul', 'judul', 'approved', '2026-01-27 12:18:38', '2026-01-27 12:17:32'),
	(36, 22, 3, '2026-01-27', 1, 'review bab 1', 'bagus banget woy jenius', 'approved', '2026-01-27 12:18:35', '2026-01-27 12:18:01'),
	(37, 22, 3, '2026-01-28', 2, 'review bab 2', 'hehehe bagus woy', 'approved', '2026-01-27 12:21:58', '2026-01-27 12:19:23'),
	(38, 22, 3, '2026-01-29', 3, 'review bab 3', 'apaya sya juga gatau karena kaesempurnaan hanya milik allah', 'approved', '2026-01-27 12:22:00', '2026-01-27 12:20:07'),
	(39, 22, 3, '2026-01-30', 4, 'review bab 4', 'gatau', 'approved', '2026-01-27 12:22:02', '2026-01-27 12:20:27'),
	(40, 22, 3, '2026-01-27', 5, 'review bab 5', 'GATAUUU', 'approved', '2026-01-27 12:21:48', '2026-01-27 12:20:47'),
	(41, 22, 3, '2026-01-27', 6, 'review bab 6', 'Ganyang fufufafa', 'approved', '2026-01-27 12:21:53', '2026-01-27 12:21:06'),
	(42, 22, 3, '2026-01-27', 7, 'review bab 7', 'Ganyang fufufafa', 'approved', '2026-01-27 12:21:50', '2026-01-27 12:21:18'),
	(43, 22, 3, '2026-01-27', 8, 'review bab 8', 'Ganyang SAWIT', 'approved', '2026-01-27 12:21:55', '2026-01-27 12:21:35'),
	(44, 2, 3, '2026-01-27', 1, 'dawd', 'dawd', 'approved', '2026-01-28 14:21:42', '2026-01-27 13:46:13');

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
  UNIQUE KEY `email` (`email`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.dosen: ~9 rows (approximately)
INSERT INTO `dosen` (`id`, `email`, `password_hash`, `nidn`, `nama`, `no_wa`, `is_active`, `created_at`) VALUES
	(1, 'yusrilhelmi@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0407117405', 'M. Yusril Helmi Setyawan, S.Kom., M.Kom.,SFPC.', NULL, 1, '2026-01-15 03:50:50'),
	(2, 'awangga@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0410118609', 'Rolly Maulana Awangga,S.T.,MT.,CAIP, SFPC.', NULL, 1, '2026-01-15 03:50:50'),
	(3, 'roniandarsyah@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0420058801', 'Roni Andarsyah, S.T., M.Kom., SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(4, 'm.nurkamal.f@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0402058005', 'Mohamad Nurkamal Fauzan, S.T., M.T., SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(5, 'cahyo@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0427078404', 'Cahyo Prianto, S.Pd., M.T.,CDSP, SFPC', NULL, 1, '2026-01-15 03:50:50'),
	(6, 'syafrial.fachri@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0416048803', 'Dr. Syafrial Fachri Pane.,S.T.,M.TI., EBDP.,CDSP.,SFPC', NULL, 1, '2026-01-15 03:50:50'),
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
	(2, 2, 2),
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

-- Dumping data for table bimbingan_online.jadwal_proyek: ~5 rows (approximately)
INSERT INTO `jadwal_proyek` (`id`, `nama`, `tipe`, `start_date`, `end_date`, `status`, `deskripsi`, `created_by`, `semester`, `created_at`, `updated_at`) VALUES
	(1, 'Proyek 2 Angkatan 24', 'proyek', '2026-01-15', '2026-05-15', 'completed', 'Periode proyek semester 3', 3, 3, '2026-01-15 12:43:45', '2026-02-26 16:07:04'),
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.kelompok: ~4 rows (approximately)
INSERT INTO `kelompok` (`id`, `nama`, `track`, `created_at`) VALUES
	(1, 'Kelompok PROYEK2 - Al Fanisa Basri & Bagas Agung Wiyono', 'proyek2', '2026-01-15 12:44:56'),
	(2, 'Kelompok PROYEK1 - Ahmad Fauzi & Dewi Lestari', 'proyek1', '2026-01-15 12:45:00'),
	(3, 'Kelompok PROYEK3 - Budi Santoso & Rina Wati', 'proyek3', '2026-01-15 12:45:00'),
	(4, 'Kelompok PROYEK2 - Eko Prasetyo & Fitri Handayani', 'proyek2', '2026-01-15 12:45:00'),
	(5, 'tim alphamart', 'proyek2', '2026-01-27 12:13:20');

-- Dumping structure for table bimbingan_online.laporan_sidang
DROP TABLE IF EXISTS `laporan_sidang`;
CREATE TABLE IF NOT EXISTS `laporan_sidang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mahasiswa_id` bigint NOT NULL,
  `file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('submitted','pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `approved_by` bigint DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `laporan_sidang_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `laporan_sidang_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `dosen` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.laporan_sidang: ~2 rows (approximately)
INSERT INTO `laporan_sidang` (`id`, `mahasiswa_id`, `file_url`, `status`, `note`, `approved_by`, `approved_at`, `created_at`) VALUES
	(8, 2, 'https://youtube.com', 'submitted', NULL, NULL, NULL, '2026-02-26 17:52:37');

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
  `semester` int DEFAULT NULL,
  `track` enum('proyek1','proyek2','proyek3','internship1','internship2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kelompok_id` bigint DEFAULT NULL,
  `judul_proyek` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_proposal` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_proposal` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usulan_dosen_id` bigint DEFAULT NULL,
  `dosen_id` bigint DEFAULT NULL,
  `dosen_id_2` bigint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pending_partner_npm` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `npm` (`npm`),
  KEY `kelompok_id` (`kelompok_id`),
  KEY `usulan_dosen_id` (`usulan_dosen_id`),
  KEY `dosen_id` (`dosen_id`),
  KEY `dosen_id_2` (`dosen_id_2`),
  KEY `idx_status_proposal` (`status_proposal`),
  KEY `idx_track` (`track`),
  KEY `idx_nama` (`nama`),
  KEY `idx_pending_partner` (`pending_partner_npm`),
  CONSTRAINT `mahasiswa_ibfk_1` FOREIGN KEY (`kelompok_id`) REFERENCES `kelompok` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mahasiswa_ibfk_2` FOREIGN KEY (`usulan_dosen_id`) REFERENCES `dosen` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mahasiswa_ibfk_3` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mahasiswa_ibfk_4` FOREIGN KEY (`dosen_id_2`) REFERENCES `dosen` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.mahasiswa: ~22 rows (approximately)
INSERT INTO `mahasiswa` (`id`, `email`, `password_hash`, `npm`, `nama`, `no_wa`, `angkatan`, `track`, `kelompok_id`, `judul_proyek`, `file_proposal`, `status_proposal`, `usulan_dosen_id`, `dosen_id`, `dosen_id_2`, `created_at`, `pending_partner_npm`) VALUES
	(1, '714240042@std.ulbi.ac.id', '$2b$10$mMkhfbtkcnDtYH1gK93xgu4cCUddR9zcA9Yt2w/jrZ87mmHYfcY7G', '714240042', 'Bagas Agung Wiyono', '085179935117', 2024, NULL, 1, 'Implementasi Laravel Dalam Website E-commerce', 'https://drive.google.com/file/d/example1', 'approved', 3, 3, NULL, '2026-01-15 11:53:28', NULL),
	(2, '714240043@std.ulbi.ac.id', '$2b$10$mMkhfbtkcnDtYH1gK93xgu4cCUddR9zcA9Yt2w/jrZ87mmHYfcY7G', '714240043', 'Al Fanisa Basri', '085179935118', 2024, 'proyek2', 1, 'Implementasi Laravel Dalam Website E-commerce', 'https://drive.google.com/file/d/example1', 'approved', 3, 3, NULL, '2026-01-15 11:53:58', NULL),
	(3, '714250001@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250001', 'Ahmad Fauzi', '085179935119', 2025, 'proyek1', 2, 'Sistem Informasi Perpustakaan', 'https://drive.google.com/file/d/example2', 'approved', 1, 1, NULL, '2026-01-15 12:00:00', NULL),
	(4, '714250002@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250002', 'Dewi Lestari', '085179935120', 2025, 'proyek1', 2, 'Sistem Informasi Perpustakaan', 'https://drive.google.com/file/d/example2', 'approved', 1, 1, NULL, '2026-01-15 12:00:00', NULL),
	(5, '714230001@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230001', 'Budi Santoso', '085179935121', 2023, 'proyek3', 3, 'Aplikasi Mobile Kesehatan', 'https://drive.google.com/file/d/example3', 'approved', 2, 2, NULL, '2026-01-15 12:00:00', NULL),
	(6, '714230002@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230002', 'Rina Wati', '085179935122', 2023, 'proyek3', 3, 'Aplikasi Mobile Kesehatan', 'https://drive.google.com/file/d/example3', 'approved', 2, 2, NULL, '2026-01-15 12:00:00', NULL),
	(7, '714240044@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714240044', 'Eko Prasetyo', '085179935123', 2024, 'proyek2', 4, 'Website Manajemen Inventaris', 'https://drive.google.com/file/d/example4', 'approved', 4, 4, NULL, '2026-01-15 12:00:00', NULL),
	(8, '714240045@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714240045', 'Fitri Handayani', '085179935124', 2024, 'proyek2', 4, 'Website Manajemen Inventaris', 'https://drive.google.com/file/d/example4', 'approved', 4, 4, NULL, '2026-01-15 12:00:00', NULL),
	(9, '714220001@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220001', 'Gilang Ramadhan', '085179935125', 2022, 'internship1', NULL, 'Magang di PT Telkom Indonesia', 'https://drive.google.com/file/d/example5', 'approved', 5, 5, 6, '2026-01-15 12:00:00', NULL),
	(10, '714220002@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220002', 'Hana Pertiwi', '085179935126', 2022, 'internship1', NULL, 'Magang di PT Tokopedia', 'https://drive.google.com/file/d/example6', 'approved', 7, 7, 8, '2026-01-15 12:00:00', NULL),
	(11, '714220003@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220003', 'Irfan Hakim', '085179935127', 2022, 'internship2', NULL, 'Magang di PT Gojek', 'https://drive.google.com/file/d/example7', 'approved', 8, 8, 9, '2026-01-15 12:00:00', NULL),
	(12, '714220004@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714220004', 'Jihan Aulia', '085179935128', 2022, 'internship2', NULL, 'Magang di PT Bukalapak', 'https://drive.google.com/file/d/example8', 'approved', 9, NULL, NULL, '2026-01-15 12:00:00', NULL),
	(13, '714250011@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250011', 'Agil Saputra', '085179935131', 2025, 'proyek1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 13:00:00', NULL),
	(14, '714250012@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250012', 'Bunga Citra', '085179935132', 2025, 'proyek1', NULL, NULL, NULL, NULL, NULL, 3, NULL, '2026-01-15 13:00:00', NULL),
	(15, '714230011@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230011', 'Candra Wijaya', '085179935133', 2023, 'proyek3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 13:00:00', NULL),
	(16, '714230012@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230012', 'Dinda Kirana', '085179935134', 2023, 'proyek3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 13:00:00', NULL),
	(17, '714250013@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250013', 'Erik Sondhy', '085179935135', 2025, 'proyek1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 13:00:00', NULL),
	(18, '714250014@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714250014', 'Fani Rahmawati', '085179935136', 2025, 'proyek1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 13:00:00', NULL),
	(19, '714230013@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230013', 'Galih Ginanjar', '085179935137', 2023, 'proyek3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 13:00:00', NULL),
	(20, '714230014@std.ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '714230014', 'Hani Puspita', '085179935138', 2023, 'proyek3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-15 13:00:00', NULL),
	(21, '714240050@gmail.com', '$2b$10$BhTTGv2zkE8DYc/AyDgUOOFBI4jmnhTbYH0tIfkBijs56R.Vq9wUG', '714240050', 'Asep Faraday', '085179935117', 2024, 'proyek2', 5, 'Membangun RUMAH', 'https://drive.google.com/file/d/1fvgGqcjIhfzf77nl_BmYDqE9pEpCZZpG/view?usp=sharing', 'approved', 3, 3, NULL, '2026-01-27 12:10:38', NULL),
	(22, '714240046@std.ulbi.ac.id', '$2b$10$TgXftRTR9Okondx/IddFZ.gNmmcITM0FxpkbEK2qfR1d5UbqSZy/y', '714240046', 'zahra', '0812436447', 2024, 'proyek2', 5, 'Membangun RUMAH', 'https://drive.google.com/file/d/1fvgGqcjIhfzf77nl_BmYDqE9pEpCZZpG/view?usp=sharing', 'approved', 3, 3, NULL, '2026-01-27 12:11:56', NULL),
	(23, 'new@test.com', '$2b$10$7oA41z4awCcHZTp0lBWRc.tyguRjFnJWzNmM6MPDqJxmC6UxJA5au', '12345', 'Test Mhs', '0812', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-01-29 12:14:44', NULL),
	(24, 'baagas7474@gmail.com', '$2b$10$sM.iTV1rsNKOVL7QS6oZHOe8.C5v3JmnvucRyA3sBqgkiXdcZ3KYi', '12345678', 'Bagas Agung Wiyono', '085179935117', 2025, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-16 14:54:03', NULL);

-- Dumping structure for table bimbingan_online.otp_codesng
DROP TABLE IF EXISTS `otp_codes`;
CREATE TABLE IF NOT EXISTS `otp_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('login','reset_password','register') COLLATE utf8mb4_unicode_ci DEFAULT 'reset_password',
  `payload` json DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `attempts` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_type` (`email`,`type`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table bimbingan_online.otp_codes: ~0 rows (approximately)
INSERT INTO `otp_codes` (`id`, `email`, `otp_hash`, `type`, `payload`, `expires_at`, `used`, `attempts`, `created_at`) VALUES
	(2, 'baagas7474@gmail.com', '$2b$10$cNtdq3FVyAf0sNxwDwWD.u9sDZO5wr.I4X3NQUtj9KJiagTy36Lrq', 'reset_password', NULL, '2026-02-16 07:29:29', 1, 1, '2026-02-16 07:24:28');

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

-- Dumping structure for table bimbingan_online.user
DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `emailVerified` tinyint(1) DEFAULT '0',
  `image` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `banned` tinyint(1) DEFAULT '0',
  `banReason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `banExpires` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping structure for table bimbingan_online.session
DROP TABLE IF EXISTS `session`;
CREATE TABLE IF NOT EXISTS `session` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `token` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL,
  `ipAddress` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_session_user` (`userId`),
  KEY `idx_session_token` (`token`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping structure for table bimbingan_online.account
DROP TABLE IF EXISTS `account`;
CREATE TABLE IF NOT EXISTS `account` (
  `id` varchar(36) NOT NULL,
  `userId` varchar(36) NOT NULL,
  `accountId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `providerId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `accessToken` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `refreshToken` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `accessTokenExpiresAt` datetime DEFAULT NULL,
  `refreshTokenExpiresAt` datetime DEFAULT NULL,
  `scope` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `idToken` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_account_user` (`userId`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping structure for table bimbingan_online.verification
DROP TABLE IF EXISTS `verification`;
CREATE TABLE IF NOT EXISTS `verification` (
  `id` varchar(36) NOT NULL,
  `identifier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_verification_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping structure for table bimbingan_online.audit_logs
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `request_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `result` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_created` (`created_at`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compatibility tables for legacy backend paths
DROP TABLE IF EXISTS `koordinator`;
CREATE TABLE IF NOT EXISTS `koordinator` (
  `id` bigint NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nidn` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nip` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_wa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_profil` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `assigned_semester` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uk_assigned_semester` (`assigned_semester`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `koordinator` (`id`, `email`, `password_hash`, `nidn`, `nip`, `nama`, `no_wa`, `foto_profil`, `is_active`, `assigned_semester`, `created_at`)
SELECT d.`id`, d.`email`, d.`password_hash`, d.`nidn`, d.`nidn`, d.`nama`, d.`no_wa`, NULL, d.`is_active`, dr.`assigned_semester`, d.`created_at`
FROM `dosen` d
JOIN `dosen_role` dr ON dr.`dosen_id` = d.`id`
JOIN `role` r ON r.`id` = dr.`role_id`
WHERE r.`nama_role` = 'koordinator';

DROP TABLE IF EXISTS `penguji`;
CREATE TABLE IF NOT EXISTS `penguji` (
  `id` bigint NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nidn` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nip` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_wa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_profil` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_penguji_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `penguji` (`id`, `email`, `password_hash`, `nidn`, `nip`, `nama`, `no_wa`, `foto_profil`, `is_active`, `created_at`)
SELECT d.`id`, d.`email`, d.`password_hash`, d.`nidn`, d.`nidn`, d.`nama`, d.`no_wa`, NULL, d.`is_active`, d.`created_at`
FROM `dosen` d;

DROP TABLE IF EXISTS `dosen_pembimbing`;
CREATE TABLE IF NOT EXISTS `dosen_pembimbing` (
  `id` bigint NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nidn` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `dosen_pembimbing` (`id`, `email`, `nidn`, `nama`, `created_at`)
SELECT d.`id`, d.`email`, d.`nidn`, d.`nama`, d.`created_at`
FROM `dosen` d;

-- Dumping structure for table bimbingan_online.sidang
DROP TABLE IF EXISTS `sidang`;
CREATE TABLE IF NOT EXISTS `sidang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mahasiswa_id` bigint NOT NULL,
  `tanggal` date NOT NULL,
  `waktu` time NOT NULL,
  `ruangan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dosen_id` bigint DEFAULT NULL,
  `penguji_id` bigint DEFAULT NULL,
  `dosen_pembimbing_id` bigint DEFAULT NULL,
  `status` enum('scheduled','ongoing','completed','lulus') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `dosen_id` (`dosen_id`),
  KEY `penguji_id` (`penguji_id`),
  KEY `dosen_pembimbing_id` (`dosen_pembimbing_id`),
  CONSTRAINT `sidang_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sidang_ibfk_2` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sidang_ibfk_3` FOREIGN KEY (`penguji_id`) REFERENCES `dosen` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sidang_ibfk_4` FOREIGN KEY (`dosen_pembimbing_id`) REFERENCES `dosen_pembimbing` (`id`) ON DELETE SET NULL
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

-- Lightweight compatibility triggers for legacy backend paths
DROP TRIGGER IF EXISTS `trg_sidang_set_pembimbing_bi`;
CREATE TRIGGER `trg_sidang_set_pembimbing_bi`
BEFORE INSERT ON `sidang`
FOR EACH ROW
SET NEW.`dosen_pembimbing_id` = COALESCE(NEW.`dosen_pembimbing_id`, NEW.`dosen_id`);

DROP TRIGGER IF EXISTS `trg_sidang_set_pembimbing_bu`;
CREATE TRIGGER `trg_sidang_set_pembimbing_bu`
BEFORE UPDATE ON `sidang`
FOR EACH ROW
SET NEW.`dosen_pembimbing_id` = COALESCE(NEW.`dosen_pembimbing_id`, NEW.`dosen_id`);

DROP TRIGGER IF EXISTS `trg_dosen_sync_penguji_ai`;
CREATE TRIGGER `trg_dosen_sync_penguji_ai`
AFTER INSERT ON `dosen`
FOR EACH ROW
INSERT INTO `penguji` (`id`, `email`, `password_hash`, `nidn`, `nip`, `nama`, `no_wa`, `foto_profil`, `is_active`, `created_at`)
VALUES (NEW.`id`, NEW.`email`, NEW.`password_hash`, NEW.`nidn`, NEW.`nidn`, NEW.`nama`, NEW.`no_wa`, NULL, NEW.`is_active`, NEW.`created_at`)
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`),
  `nidn` = VALUES(`nidn`),
  `nip` = VALUES(`nip`),
  `nama` = VALUES(`nama`),
  `no_wa` = VALUES(`no_wa`),
  `is_active` = VALUES(`is_active`);

DROP TRIGGER IF EXISTS `trg_dosen_sync_penguji_au`;
CREATE TRIGGER `trg_dosen_sync_penguji_au`
AFTER UPDATE ON `dosen`
FOR EACH ROW
INSERT INTO `penguji` (`id`, `email`, `password_hash`, `nidn`, `nip`, `nama`, `no_wa`, `foto_profil`, `is_active`, `created_at`)
VALUES (NEW.`id`, NEW.`email`, NEW.`password_hash`, NEW.`nidn`, NEW.`nidn`, NEW.`nama`, NEW.`no_wa`, NULL, NEW.`is_active`, NEW.`created_at`)
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`),
  `nidn` = VALUES(`nidn`),
  `nip` = VALUES(`nip`),
  `nama` = VALUES(`nama`),
  `no_wa` = VALUES(`no_wa`),
  `is_active` = VALUES(`is_active`);

DROP TRIGGER IF EXISTS `trg_dosen_sync_pembimbing_ai`;
CREATE TRIGGER `trg_dosen_sync_pembimbing_ai`
AFTER INSERT ON `dosen`
FOR EACH ROW
INSERT INTO `dosen_pembimbing` (`id`, `email`, `nidn`, `nama`, `created_at`)
VALUES (NEW.`id`, NEW.`email`, NEW.`nidn`, NEW.`nama`, NEW.`created_at`)
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `nidn` = VALUES(`nidn`),
  `nama` = VALUES(`nama`);

DROP TRIGGER IF EXISTS `trg_dosen_sync_pembimbing_au`;
CREATE TRIGGER `trg_dosen_sync_pembimbing_au`
AFTER UPDATE ON `dosen`
FOR EACH ROW
INSERT INTO `dosen_pembimbing` (`id`, `email`, `nidn`, `nama`, `created_at`)
VALUES (NEW.`id`, NEW.`email`, NEW.`nidn`, NEW.`nama`, NEW.`created_at`)
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `nidn` = VALUES(`nidn`),
  `nama` = VALUES(`nama`);

DROP TRIGGER IF EXISTS `trg_dosen_sync_penguji_ad`;
CREATE TRIGGER `trg_dosen_sync_penguji_ad`
AFTER DELETE ON `dosen`
FOR EACH ROW
DELETE FROM `penguji` WHERE `id` = OLD.`id`;

DROP TRIGGER IF EXISTS `trg_dosen_sync_pembimbing_ad`;
CREATE TRIGGER `trg_dosen_sync_pembimbing_ad`
AFTER DELETE ON `dosen`
FOR EACH ROW
DELETE FROM `dosen_pembimbing` WHERE `id` = OLD.`id`;

DROP TRIGGER IF EXISTS `trg_dosen_role_sync_koordinator_ai`;
CREATE TRIGGER `trg_dosen_role_sync_koordinator_ai`
AFTER INSERT ON `dosen_role`
FOR EACH ROW
INSERT INTO `koordinator` (`id`, `email`, `password_hash`, `nidn`, `nip`, `nama`, `no_wa`, `foto_profil`, `is_active`, `assigned_semester`, `created_at`)
SELECT d.`id`, d.`email`, d.`password_hash`, d.`nidn`, d.`nidn`, d.`nama`, d.`no_wa`, NULL, d.`is_active`, NEW.`assigned_semester`, d.`created_at`
FROM `dosen` d
JOIN `role` r ON r.`id` = NEW.`role_id`
WHERE d.`id` = NEW.`dosen_id` AND r.`nama_role` = 'koordinator'
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`),
  `nidn` = VALUES(`nidn`),
  `nip` = VALUES(`nip`),
  `nama` = VALUES(`nama`),
  `no_wa` = VALUES(`no_wa`),
  `is_active` = VALUES(`is_active`),
  `assigned_semester` = VALUES(`assigned_semester`);

DROP TRIGGER IF EXISTS `trg_dosen_role_sync_koordinator_au`;
CREATE TRIGGER `trg_dosen_role_sync_koordinator_au`
AFTER UPDATE ON `dosen_role`
FOR EACH ROW
INSERT INTO `koordinator` (`id`, `email`, `password_hash`, `nidn`, `nip`, `nama`, `no_wa`, `foto_profil`, `is_active`, `assigned_semester`, `created_at`)
SELECT d.`id`, d.`email`, d.`password_hash`, d.`nidn`, d.`nidn`, d.`nama`, d.`no_wa`, NULL, d.`is_active`, NEW.`assigned_semester`, d.`created_at`
FROM `dosen` d
JOIN `role` r ON r.`id` = NEW.`role_id`
WHERE d.`id` = NEW.`dosen_id` AND r.`nama_role` = 'koordinator'
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `password_hash` = VALUES(`password_hash`),
  `nidn` = VALUES(`nidn`),
  `nip` = VALUES(`nip`),
  `nama` = VALUES(`nama`),
  `no_wa` = VALUES(`no_wa`),
  `is_active` = VALUES(`is_active`),
  `assigned_semester` = VALUES(`assigned_semester`);

DROP TRIGGER IF EXISTS `trg_dosen_role_sync_koordinator_ad`;
CREATE TRIGGER `trg_dosen_role_sync_koordinator_ad`
AFTER DELETE ON `dosen_role`
FOR EACH ROW
DELETE k FROM `koordinator` k
JOIN `role` r ON r.`id` = OLD.`role_id`
WHERE k.`id` = OLD.`dosen_id` AND r.`nama_role` = 'koordinator';

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
