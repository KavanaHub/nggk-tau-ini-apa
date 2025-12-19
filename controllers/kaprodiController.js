import pool from '../config/db.js';
import sharedController from './sharedController.js';

const kaprodiController = {
  // GET PROFILE KAPRODI (dosen dengan jabatan kaprodi)
  getProfile: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, nidn, nama, no_wa, jabatan, is_active, created_at
         FROM dosen WHERE id = ? AND jabatan LIKE '%kaprodi%'`,
        [dosenId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Kaprodi tidak ditemukan" });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },

  // GET SEMUA MAHASISWA - menggunakan shared function
  getAllMahasiswa: sharedController.getAllMahasiswa,

  // GET SEMUA DOSEN - menggunakan shared function
  getAllDosen: sharedController.getAllDosen,

  // GET SEMUA KOORDINATOR - menggunakan shared function
  getAllKoordinator: sharedController.getAllKoordinator,

  // GET SEMUA PENGUJI - menggunakan shared function
  getAllPenguji: sharedController.getAllPenguji,

  // ASSIGN DOSEN KE MAHASISWA - menggunakan shared function
  assignDosen: sharedController.assignDosen,

  // APPROVE / REJECT PROPOSAL MAHASISWA - menggunakan shared function
  updateProposalStatus: sharedController.updateProposalStatus,

  // GET STATISTIK DASHBOARD
  getDashboardStats: async (req, res, next) => {
    try {
      const [[{ total_mahasiswa }]] = await pool.query('SELECT COUNT(*) as total_mahasiswa FROM mahasiswa');
      const [[{ total_dosen }]] = await pool.query('SELECT COUNT(*) as total_dosen FROM dosen WHERE is_active = 1');
      const [[{ mahasiswa_aktif }]] = await pool.query("SELECT COUNT(*) as mahasiswa_aktif FROM mahasiswa WHERE status_proposal = 'approved' AND dosen_id IS NOT NULL");
      const [[{ siap_sidang }]] = await pool.query(`
        SELECT COUNT(*) as siap_sidang FROM mahasiswa m 
        WHERE (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') >= 8
      `);
      const [[{ lulus_semester_ini }]] = await pool.query(`
        SELECT COUNT(*) as lulus_semester_ini FROM sidang 
        WHERE status = 'lulus' AND YEAR(tanggal) = YEAR(CURDATE()) AND MONTH(tanggal) >= IF(MONTH(CURDATE()) > 6, 7, 1)
      `);

      // By status
      const [[{ menunggu_track }]] = await pool.query("SELECT COUNT(*) as c FROM mahasiswa WHERE track IS NULL");
      const [[{ proposal_pending }]] = await pool.query("SELECT COUNT(*) as c FROM mahasiswa WHERE status_proposal = 'pending'");
      const [[{ sedang_bimbingan }]] = await pool.query(`
        SELECT COUNT(*) as c FROM mahasiswa m 
        WHERE status_proposal = 'approved' AND dosen_id IS NOT NULL
        AND (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') < 8
      `);
      const [[{ lulus }]] = await pool.query("SELECT COUNT(*) as c FROM sidang WHERE status = 'lulus'");

      // By angkatan
      const [angkatanRows] = await pool.query(`
        SELECT angkatan, COUNT(*) as count FROM mahasiswa 
        WHERE angkatan IS NOT NULL 
        GROUP BY angkatan ORDER BY angkatan DESC LIMIT 5
      `);
      const by_angkatan = {};
      angkatanRows.forEach(row => { by_angkatan[row.angkatan] = row.count; });

      res.json({
        total_mahasiswa,
        total_dosen,
        mahasiswa_aktif,
        siap_sidang,
        lulus_semester_ini: lulus_semester_ini || 0,
        by_status: {
          "Menunggu Track": menunggu_track,
          "Proposal Pending": proposal_pending,
          "Sedang Bimbingan": sedang_bimbingan,
          "Siap Sidang": siap_sidang,
          "Lulus": lulus
        },
        by_angkatan
      });
    } catch (err) {
      next(err);
    }
  },

  // ASSIGN KOORDINATOR KE SEMESTER
  // 1 koordinator = 1 semester, 1 semester = 1 koordinator
  // Saat di-assign, jabatan dosen berubah menjadi include 'koordinator'
  assignKoordinatorSemester: async (req, res, next) => {
    try {
      const { koordinator_id, semester } = req.body;

      if (!koordinator_id || !semester) {
        return res.status(400).json({ message: 'koordinator_id dan semester wajib diisi' });
      }

      // Validate semester
      const validSemesters = [2, 3, 5, 7, 8];
      if (!validSemesters.includes(parseInt(semester))) {
        return res.status(400).json({ message: 'Semester harus 2, 3, 5, 7, atau 8' });
      }

      // Check if dosen exists
      const [dosenRows] = await pool.query(
        "SELECT id, nama, jabatan FROM dosen WHERE id = ? AND is_active = 1",
        [koordinator_id]
      );
      if (dosenRows.length === 0) {
        return res.status(404).json({ message: 'Dosen tidak ditemukan' });
      }

      // Check if semester already assigned to another koordinator
      const [existingRows] = await pool.query(
        "SELECT id, nama FROM dosen WHERE assigned_semester = ? AND id != ?",
        [semester, koordinator_id]
      );
      if (existingRows.length > 0) {
        return res.status(400).json({
          message: `Semester ${semester} sudah di-assign ke ${existingRows[0].nama}`
        });
      }

      // Update jabatan to include 'koordinator' if not already
      let newJabatan = dosenRows[0].jabatan || 'dosen';
      if (!newJabatan.includes('koordinator')) {
        newJabatan = newJabatan + ',koordinator';
      }

      // Update dosen's jabatan and assigned_semester
      await pool.query(
        'UPDATE dosen SET jabatan = ?, assigned_semester = ? WHERE id = ?',
        [newJabatan, semester, koordinator_id]
      );

      const semesterLabels = {
        2: 'Proyek 1 (Semester 2)',
        3: 'Proyek 2 (Semester 3)',
        5: 'Proyek 3 (Semester 5)',
        7: 'Internship 1 (Semester 7)',
        8: 'Internship 2 (Semester 8)'
      };

      res.json({
        message: `${dosenRows[0].nama} berhasil di-assign ke ${semesterLabels[semester]}`
      });
    } catch (err) {
      next(err);
    }
  },

  // UNASSIGN KOORDINATOR DARI SEMESTER
  // Hapus 'koordinator' dari jabatan dan clear assigned_semester
  unassignKoordinatorSemester: async (req, res, next) => {
    try {
      const { koordinator_id } = req.body;

      if (!koordinator_id) {
        return res.status(400).json({ message: 'koordinator_id wajib diisi' });
      }

      // Get current jabatan
      const [rows] = await pool.query(
        'SELECT jabatan FROM dosen WHERE id = ?',
        [koordinator_id]
      );

      if (rows.length > 0) {
        // Remove 'koordinator' from jabatan
        let jabatan = rows[0].jabatan || 'dosen';
        jabatan = jabatan.replace(',koordinator', '').replace('koordinator,', '').replace('koordinator', 'dosen');
        if (!jabatan || jabatan === '') jabatan = 'dosen';

        await pool.query(
          'UPDATE dosen SET jabatan = ?, assigned_semester = NULL WHERE id = ?',
          [jabatan, koordinator_id]
        );
      }

      res.json({ message: 'Assignment berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  },
};

export default kaprodiController;
