import pool from '../config/db.js';
import sharedController from './sharedController.js';

const kaprodiController = {
  // GET PROFILE KAPRODI (dosen with kaprodi role)
  getProfile: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT d.id, d.email, d.nidn, d.nama, d.no_wa, d.is_active, d.created_at,
         (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr 
          JOIN role r ON dr.role_id = r.id 
          WHERE dr.dosen_id = d.id) as roles
         FROM dosen d
         JOIN dosen_role dr ON d.id = dr.dosen_id
         JOIN role r ON dr.role_id = r.id
         WHERE d.id = ? AND r.nama_role = 'kaprodi'`,
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
      const [[{ total_dosen }]] = await pool.query('SELECT COUNT(*) as total_dosen FROM dosen');

      // Mahasiswa aktif - handle if is_active column doesn't exist
      let mahasiswa_aktif = total_mahasiswa; // default to all
      try {
        const [[result]] = await pool.query("SELECT COUNT(*) as mahasiswa_aktif FROM mahasiswa WHERE is_active = true");
        mahasiswa_aktif = result.mahasiswa_aktif || total_mahasiswa;
      } catch (e) { console.log('is_active column may not exist:', e.message); }

      // Lulus count - handle if sidang table doesn't exist
      let lulus_semester_ini = 0;
      try {
        const [[result]] = await pool.query(`
          SELECT COUNT(*) as lulus FROM sidang 
          WHERE status = 'lulus' 
          AND YEAR(tanggal) = YEAR(CURRENT_DATE())
        `);
        lulus_semester_ini = result.lulus || 0;
      } catch (e) { console.log('Sidang table may not exist:', e.message); }

      let siap_sidang = 0;
      try {
        const [[result]] = await pool.query(`
          SELECT COUNT(*) as siap_sidang FROM mahasiswa m 
          WHERE (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') >= 8
        `);
        siap_sidang = result.siap_sidang || 0;
      } catch (e) { console.log('Bimbingan count query failed:', e.message); }

      // Additional stats
      const [[{ proyek }]] = await pool.query("SELECT COUNT(*) as proyek FROM mahasiswa WHERE track LIKE '%proyek%'");
      const [[{ internship }]] = await pool.query("SELECT COUNT(*) as internship FROM mahasiswa WHERE track LIKE '%internship%'");

      // By status
      const [[{ menunggu_track }]] = await pool.query("SELECT COUNT(*) as c FROM mahasiswa WHERE track IS NULL");
      const [[{ proposal_pending }]] = await pool.query("SELECT COUNT(*) as c FROM mahasiswa WHERE status_proposal = 'pending'");
      const [[{ sedang_bimbingan }]] = await pool.query(`
        SELECT COUNT(*) as c FROM mahasiswa m 
        WHERE status_proposal = 'approved' AND dosen_id IS NOT NULL
        AND (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') < 8
      `);

      // By angkatan
      const [angkatanRows] = await pool.query(`
        SELECT angkatan, COUNT(*) as count FROM mahasiswa 
        WHERE angkatan IS NOT NULL 
        GROUP BY angkatan ORDER BY angkatan DESC LIMIT 5
      `);
      const by_angkatan = {};
      angkatanRows.forEach(row => { by_angkatan[row.angkatan] = row.count; });

      res.json({
        // Main stats for dashboard cards
        total_mahasiswa,
        total_dosen,
        mahasiswa_aktif,
        siap_sidang,
        lulus_semester_ini,
        // Additional stats
        proyek,
        internship,
        by_status: {
          "Menunggu Track": menunggu_track,
          "Proposal Pending": proposal_pending,
          "Sedang Bimbingan": sedang_bimbingan,
          "Siap Sidang": siap_sidang,
          "Lulus": lulus_semester_ini
        },
        by_angkatan
      });
    } catch (err) {
      next(err);
    }
  },

  getRecentActivities: async (req, res, next) => {
    try {
      const activities = [];

      // 1. New student registrations (in last 30 days)
      try {
        const [newStudents] = await pool.query(`
          SELECT m.nama, m.created_at as time,
                 CONCAT(m.nama, ' mendaftar ke sistem') as description
          FROM mahasiswa m
          WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY m.created_at DESC LIMIT 3
        `);
        newStudents.forEach(s => activities.push({
          type: 'register',
          desc: s.description,
          time: s.time
        }));
      } catch (e) { console.log('New students query error:', e.message); }

      // 2. Track selection (students who selected track)
      try {
        const [trackSelect] = await pool.query(`
          SELECT m.nama, m.updated_at as time, m.track,
                 CONCAT(m.nama, ' memilih track ', COALESCE(m.track, '-')) as description
          FROM mahasiswa m
          WHERE m.track IS NOT NULL 
          AND m.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY m.updated_at DESC LIMIT 3
        `);
        trackSelect.forEach(t => activities.push({
          type: 'track',
          desc: t.description,
          time: t.time
        }));
      } catch (e) { console.log('Track select query error:', e.message); }

      // 3. Proposals submitted (pending)
      try {
        const [proposalsPending] = await pool.query(`
          SELECT m.nama, m.created_at as time,
                 CONCAT(m.nama, ' mengajukan proposal') as description
          FROM mahasiswa m
          WHERE m.status_proposal = 'pending' 
          AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY m.created_at DESC LIMIT 3
        `);
        proposalsPending.forEach(p => activities.push({
          type: 'proposal',
          desc: p.description,
          time: p.time
        }));
      } catch (e) { console.log('Proposals pending query error:', e.message); }

      // 4. Proposals approved
      try {
        const [proposalsApproved] = await pool.query(`
          SELECT m.nama, m.updated_at as time,
                 CONCAT(m.nama, ' proposal disetujui') as description
          FROM mahasiswa m
          WHERE m.status_proposal = 'approved' 
          AND m.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY m.updated_at DESC LIMIT 3
        `);
        proposalsApproved.forEach(p => activities.push({
          type: 'approved',
          desc: p.description,
          time: p.time
        }));
      } catch (e) { console.log('Proposals approved query error:', e.message); }

      // 5. Bimbingan submitted (waiting for approval)
      try {
        const [bimbinganWaiting] = await pool.query(`
          SELECT m.nama, b.created_at as time, b.minggu_ke,
                 CONCAT(m.nama, ' mengajukan bimbingan ke-', COALESCE(b.minggu_ke, '-')) as description
          FROM bimbingan b
          JOIN mahasiswa m ON b.mahasiswa_id = m.id
          WHERE b.status = 'waiting' 
          AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY b.created_at DESC LIMIT 3
        `);
        bimbinganWaiting.forEach(b => activities.push({
          type: 'bimbingan_waiting',
          desc: b.description,
          time: b.time
        }));
      } catch (e) { console.log('Bimbingan waiting query error:', e.message); }

      // 6. Bimbingan approved
      try {
        const [bimbinganApproved] = await pool.query(`
          SELECT m.nama, COALESCE(b.approved_at, b.created_at) as time, b.minggu_ke,
                 CONCAT(m.nama, ' bimbingan ke-', COALESCE(b.minggu_ke, '-'), ' disetujui') as description
          FROM bimbingan b
          JOIN mahasiswa m ON b.mahasiswa_id = m.id
          WHERE b.status = 'approved' 
          AND (b.approved_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) OR b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY))
          ORDER BY COALESCE(b.approved_at, b.created_at) DESC LIMIT 5
        `);
        bimbinganApproved.forEach(b => activities.push({
          type: 'bimbingan',
          desc: b.description,
          time: b.time
        }));
      } catch (e) { console.log('Bimbingan approved query error:', e.message); }

      // 7. Sidang results
      try {
        const [sidang] = await pool.query(`
          SELECT m.nama, s.tanggal as time, s.status,
                 CASE WHEN s.status = 'lulus' 
                      THEN CONCAT(m.nama, ' lulus sidang')
                      ELSE CONCAT(m.nama, ' mengikuti sidang')
                 END as description
          FROM sidang s
          JOIN mahasiswa m ON s.mahasiswa_id = m.id
          WHERE s.tanggal >= DATE_SUB(NOW(), INTERVAL 60 DAY)
          ORDER BY s.tanggal DESC LIMIT 3
        `);
        sidang.forEach(s => activities.push({
          type: 'sidang',
          desc: s.description,
          time: s.time
        }));
      } catch (e) { console.log('Sidang query error:', e.message); }

      // 8. Dosen assignments
      try {
        const [pembimbing] = await pool.query(`
          SELECT m.nama as mhs_nama, d.nama as dosen_nama, m.updated_at as time,
                 CONCAT(m.nama, ' ditugaskan ke ', d.nama) as description
          FROM mahasiswa m
          JOIN dosen d ON m.dosen_id = d.id
          WHERE m.dosen_id IS NOT NULL 
          AND m.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ORDER BY m.updated_at DESC LIMIT 3
        `);
        pembimbing.forEach(p => activities.push({
          type: 'pembimbing',
          desc: p.description,
          time: p.time
        }));
      } catch (e) { console.log('Pembimbing query error:', e.message); }

      // Sort all by time (newest first) and take top 15
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      res.json(activities.slice(0, 15));
    } catch (err) {
      next(err);
    }
  },

  // ASSIGN KOORDINATOR KE SEMESTER
  // Dosen mendapat role 'koordinator' via dosen_role dengan assigned_semester
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
        "SELECT id, nama FROM dosen WHERE id = ? AND is_active = 1",
        [koordinator_id]
      );
      if (dosenRows.length === 0) {
        return res.status(404).json({ message: 'Dosen tidak ditemukan' });
      }

      // Check if semester already assigned to another koordinator in dosen_role
      const [existingRows] = await pool.query(
        `SELECT d.id, d.nama FROM dosen d
         JOIN dosen_role dr ON d.id = dr.dosen_id
         JOIN role r ON dr.role_id = r.id
         WHERE r.nama_role = 'koordinator' AND dr.assigned_semester = ? AND d.id != ?`,
        [semester, koordinator_id]
      );
      if (existingRows.length > 0) {
        return res.status(400).json({
          message: `Semester ${semester} sudah di-assign ke ${existingRows[0].nama}`
        });
      }

      // Add 'koordinator' role with assigned_semester to dosen
      await pool.query(
        `INSERT INTO dosen_role (dosen_id, role_id, assigned_semester)
         SELECT ?, id, ? FROM role WHERE nama_role = 'koordinator'
         ON DUPLICATE KEY UPDATE assigned_semester = ?`,
        [koordinator_id, semester, semester]
      );

      const semesterLabels = {
        2: 'Proyek 1 (Semester 2)',
        3: 'Proyek 2 (Semester 3)',
        5: 'Proyek 3 (Semester 5)',
        7: 'Internship 1 (Semester 7)',
        8: 'Internship 2 (Semester 8)'
      };

      res.json({
        message: `${dosenRows[0].nama} berhasil di-assign sebagai koordinator ${semesterLabels[semester]}`
      });
    } catch (err) {
      next(err);
    }
  },

  // UNASSIGN KOORDINATOR DARI SEMESTER
  // Remove 'koordinator' role from dosen_role (includes assigned_semester)
  unassignKoordinatorSemester: async (req, res, next) => {
    try {
      const { koordinator_id } = req.body;

      if (!koordinator_id) {
        return res.status(400).json({ message: 'koordinator_id wajib diisi' });
      }

      // Remove 'koordinator' role from dosen_role (this also removes assigned_semester)
      await pool.query(
        `DELETE dr FROM dosen_role dr
         JOIN role r ON dr.role_id = r.id
         WHERE dr.dosen_id = ? AND r.nama_role = 'koordinator'`,
        [koordinator_id]
      );

      res.json({ message: 'Assignment berhasil dihapus' });
    } catch (err) {
      next(err);
    }
  },
};

export default kaprodiController;
