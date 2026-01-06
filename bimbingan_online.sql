-- --------------------------------------------------------
-- Host:                         139.59.111.220
-- Server version:               8.0.44-0ubuntu0.24.04.1 - (Ubuntu)
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
  `topik` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `status` enum('waiting','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `dosen_id` (`dosen_id`),
  CONSTRAINT `bimbingan_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bimbingan_ibfk_2` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table bimbingan_online.dosen
DROP TABLE IF EXISTS `dosen`;
CREATE TABLE IF NOT EXISTS `dosen` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nidn` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_wa` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Seed data: DOSEN
INSERT INTO `dosen` (`id`, `email`, `password_hash`, `nidn`, `nama`, `no_wa`, `is_active`) VALUES
(1, 'yusrilhelmi@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0407117405', 'M. Yusril Helmi Setyawan, S.Kom., M.Kom.,SFPC.', NULL, 1),
(2, 'awangga@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0410118609', 'Rolly Maulana Awangga,S.T.,MT.,CAIP, SFPC.', NULL, 1),
(3, 'roniandarsyah@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0420058801', 'Roni Andarsyah, S.T., M.Kom., SFPC', NULL, 1),
(4, 'm.nurkamal.f@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0402058005', 'Mohamad Nurkamal Fauzan, S.T., M.T., SFPC', NULL, 1),
(5, 'cahyo@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0427078404', 'Cahyo Prianto, S.Pd., M.T.,CDSP, SFPC', NULL, 1),
(6, 'syafrial.fachri@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0416048803', 'Syafrial Fachri Pane,ST. MTI,EBDP.CDSP,SFPC', NULL, 1),
(7, 'roni.habibi@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0423127804', 'Roni Habibi, S.Kom., M.T., SFPC', NULL, 1),
(8, 'nisa@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0415048901', 'Nisa Hanum Harani, S.Kom., M.T.,CDSP, SFPC', NULL, 1),
(9, 'nurainisf@ulbi.ac.id', '$2b$10$jme6u9xgqH502DiVTbx/e.wXGvfgye8jnxTv0BBRFE1umODEUVnFu', '0402047205', 'Rd. Nuraini Siti Fathonah, S.S., M.Hum., SFPC', NULL, 1);

-- Dumping structure for table bimbingan_online.dosen_role
DROP TABLE IF EXISTS `dosen_role`;
CREATE TABLE IF NOT EXISTS `dosen_role` (
  `dosen_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  `assigned_semester` INT DEFAULT NULL,
  PRIMARY KEY (`dosen_id`,`role_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `dosen_role_ibfk_1` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dosen_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Seed data: DOSEN_ROLE (semua dosen dapat role 'dosen', Roni Andarsyah = kaprodi)
INSERT INTO `dosen_role` (`dosen_id`, `role_id`) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1),
(3, 3); -- Roni Andarsyah = Kaprodi

-- Dumping structure for table bimbingan_online.jadwal_proyek
DROP TABLE IF EXISTS `jadwal_proyek`;
CREATE TABLE IF NOT EXISTS `jadwal_proyek` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` enum('proyek','internship','lainnya') COLLATE utf8mb4_unicode_ci DEFAULT 'proyek',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('active','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `created_by` bigint DEFAULT NULL,
  `semester` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `jadwal_proyek_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `dosen` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table bimbingan_online.kelompok
DROP TABLE IF EXISTS `kelompok`;
CREATE TABLE IF NOT EXISTS `kelompok` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `track` enum('proyek1','proyek2','proyek3','internship1','internship2') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table bimbingan_online.laporan_sidang
DROP TABLE IF EXISTS `laporan_sidang`;
CREATE TABLE IF NOT EXISTS `laporan_sidang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mahasiswa_id` bigint NOT NULL,
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('submitted','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `note` text COLLATE utf8mb4_unicode_ci,
  `approved_by` bigint DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `laporan_sidang_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `laporan_sidang_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `dosen` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table bimbingan_online.mahasiswa
DROP TABLE IF EXISTS `mahasiswa`;
CREATE TABLE IF NOT EXISTS `mahasiswa` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `npm` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_wa` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `angkatan` int DEFAULT NULL,
  `track` enum('proyek1','proyek2','proyek3','internship1','internship2') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kelompok_id` bigint DEFAULT NULL,
  `judul_proyek` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_proposal` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_proposal` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usulan_dosen_id` bigint DEFAULT NULL,
  `dosen_id` bigint DEFAULT NULL,
  `dosen_id_2` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `pending_partner_npm` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table bimbingan_online.role
DROP TABLE IF EXISTS `role`;
CREATE TABLE IF NOT EXISTS `role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nama_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nama_role` (`nama_role`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Seed data: ROLE
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
  `ruangan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('scheduled','ongoing','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  CONSTRAINT `sidang_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table bimbingan_online.sidang_penguji
DROP TABLE IF EXISTS `sidang_penguji`;
CREATE TABLE IF NOT EXISTS `sidang_penguji` (
  `sidang_id` bigint NOT NULL,
  `dosen_id` bigint NOT NULL,
  `peran` enum('pembimbing','penguji1','penguji2','ketua') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`sidang_id`,`dosen_id`),
  KEY `dosen_id` (`dosen_id`),
  CONSTRAINT `sidang_penguji_ibfk_1` FOREIGN KEY (`sidang_id`) REFERENCES `sidang` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sidang_penguji_ibfk_2` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
