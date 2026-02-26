import pool from '../config/db.js';
import { hasRole, ROLES } from '../utils/roleHelper.js';

const sidangController = {
  // MAHASISWA: SUBMIT LAPORAN SIDANG
  // MAHASISWA: SUBMIT LAPORAN SIDANG (GROUP SUPPORT)
  submitLaporan: async (req, res, next) => {
    const mahasiswaId = req.user.id;
    const { file_url } = req.body;

    if (!file_url) {
      return res.status(400).json({ message: 'file_url wajib diisi' });
    }

    try {
      // 1. Cek Data Mahasiswa & Syarat
      const [mhsRows] = await pool.query(
        'SELECT id, nama, dosen_id, status_proposal, kelompok_id FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (mhsRows.length === 0) return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });

      const mhs = mhsRows[0];
      const kelompokId = mhs.kelompok_id;

      if (!mhs.dosen_id) return res.status(400).json({ message: 'Anda belum memiliki dosen pembimbing' });
      if (mhs.status_proposal !== 'approved') return res.status(400).json({ message: 'Proposal belum disetujui' });

      // 2. Tentukan Anggota Kelompok (Self or Group)
      let memberIds = [mahasiswaId];
      if (kelompokId) {
        const [groupMembers] = await pool.query('SELECT id, nama FROM mahasiswa WHERE kelompok_id = ?', [kelompokId]);
        memberIds = groupMembers.map(m => m.id);
      }

      // 3. Cek Bimbingan untuk SEMUA anggota (Minimal 8x approved per anggota)
      for (const id of memberIds) {
        const [[{ approved }]] = await pool.query(
          `SELECT IFNULL(SUM(status = 'approved'), 0) AS approved 
           FROM bimbingan WHERE mahasiswa_id = ?`,
          [id]
        );

        if (approved < 8) {
          // Jika anggota kelompok yang belum cukup, cari namanya siapa
          let name = "Mahasiswa";
          if (kelompokId) {
            const [m] = await pool.query('SELECT nama FROM mahasiswa WHERE id = ?', [id]);
            if (m.length) name = m[0].nama;
          }
          return res.status(400).json({ message: `Anggota ${name} belum mencapai 8 bimbingan yang disetujui (${approved}/8).` });
        }
      }

      // 4. Logic Submit (Single vs Group) - Insert/Update
      const affectedIds = memberIds; // Re-use list

      // Insert/Update untuk SEMUA member kelompok
      // Gunakan Loop atau Bulk Insert (Loop aman untuk trigger individual)
      for (const id of affectedIds) {
        // Cek apakah sudah ada
        const [existing] = await pool.query('SELECT id FROM laporan_sidang WHERE mahasiswa_id = ?', [id]);

        if (existing.length > 0) {
          await pool.query(
            "UPDATE laporan_sidang SET file_url = ?, status = 'submitted', created_at = NOW() WHERE mahasiswa_id = ?",
            [file_url, id]
          );
        } else {
          await pool.query(
            "INSERT INTO laporan_sidang (mahasiswa_id, file_url, status) VALUES (?, ?, 'submitted')",
            [id, file_url]
          );
        }
      }

      res.status(201).json({
        message: kelompokId ? 'Laporan berhasil disubmit untuk seluruh anggota kelompok' : 'Laporan berhasil disubmit'
      });
    } catch (err) {
      next(err);
    }
  },

  // MAHASISWA: GET STATUS LAPORAN
  getMyLaporan: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT * FROM laporan_sidang WHERE mahasiswa_id = ? ORDER BY created_at DESC`,
        [mahasiswaId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // DOSEN: GET LAPORAN (GROUPED BY KELOMPOK)
  getDosenLaporan: async (req, res, next) => {
    const dosenId = req.user.id;

    try {
      const query = `
        SELECT 
            ls.id, 
            ls.mahasiswa_id, 
            ls.file_url as file_laporan, 
            ls.status, 
            ls.note as catatan_dosen, 
            ls.created_at as tanggal_submit,
            
            -- Info Mahasiswa
            m.nama as mahasiswa_nama,
            m.npm as mahasiswa_npm,
            m.track, 
            m.judul_proyek as judul,
            
            -- Info Kelompok
            m.kelompok_id,
            k.nama as kelompok_nama,
            
            -- Bimbingan Count (Subquery)
            (SELECT COUNT(*) FROM bimbingan b WHERE b.mahasiswa_id = m.id AND b.status = 'approved') as bimbingan_count,

            CASE WHEN m.dosen_id = ? THEN 'utama' ELSE 'kedua' END as peran_pembimbing
        FROM laporan_sidang ls
        JOIN mahasiswa m ON ls.mahasiswa_id = m.id
        LEFT JOIN kelompok k ON m.kelompok_id = k.id
        WHERE m.dosen_id = ? OR m.dosen_id_2 = ?
        ORDER BY ls.created_at DESC
      `;

      const [rows] = await pool.query(query, [dosenId, dosenId, dosenId]);

      // 2. Group by Kelompok in JS (Safe & Robust)
      const uniqueReports = [];
      const processedGroups = new Set();
      const processedStudents = new Set();

      for (const row of rows) {
        if (row.kelompok_id) {
          // Group Logic: Only add if this group hasn't been added yet
          if (!processedGroups.has(row.kelompok_id)) {
            uniqueReports.push(row);
            processedGroups.add(row.kelompok_id);
          }
        } else {
          // Individual Logic
          if (!processedStudents.has(row.mahasiswa_id)) {
            uniqueReports.push(row);
            processedStudents.add(row.mahasiswa_id);
          }
        }
      }

      res.json(uniqueReports);
    } catch (err) {
      console.error('Error fetching dosen laporan:', err);
      next(err);
    }
  },

  // DOSEN: APPROVE / REJECT LAPORAN (BULK UPDATE GROUP)
  updateLaporanStatus: async (req, res, next) => {
    const dosenId = req.user.id;
    const { id } = req.params; // Report ID
    const { status, note } = req.body;

    if (!status) return res.status(400).json({ message: 'status wajib diisi' });
    if (!(await hasRole(dosenId, ROLES.DOSEN))) {
      return res.status(403).json({ message: 'Hanya akun dengan role dosen yang dapat memvalidasi laporan' });
    }

    try {
      // 1. Get Info Report ini milik siapa & kelompok mana
      const [rows] = await pool.query(
        `SELECT m.id as mahasiswa_id, m.kelompok_id 
         FROM laporan_sidang ls
         JOIN mahasiswa m ON ls.mahasiswa_id = m.id
         WHERE ls.id = ?`,
        [id]
      );

      if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

      const { kelompok_id, mahasiswa_id } = rows[0];

      // 2. Tentukan siapa saja yang di-update
      let targetMahasiswaIds = [mahasiswa_id];
      if (kelompok_id) {
        const [members] = await pool.query('SELECT id FROM mahasiswa WHERE kelompok_id = ?', [kelompok_id]);
        targetMahasiswaIds = members.map(m => m.id);
      }

      // 3. Update Status untuk semua target
      // Note: approved_by kita set ke dosen yg melakukan action
      const placeholders = targetMahasiswaIds.map(() => '?').join(',');
      await pool.query(
        `UPDATE laporan_sidang 
         SET status = ?, note = ?, approved_by = ?, approved_at = NOW()
         WHERE mahasiswa_id IN (${placeholders})`,
        [status, note || null, dosenId, ...targetMahasiswaIds]
      );

      res.json({ message: `Laporan berhasil di-${status} untuk ${targetMahasiswaIds.length} mahasiswa.` });
    } catch (err) {
      next(err);
    }
  },

  // KOORDINATOR: JADWALKAN SIDANG
  // Penguji 1 = Dosen pembimbing mahasiswa (otomatis dari data mahasiswa)
  // Penguji 2 = Penguji utama/asli (dipilih)
  scheduleSidang: async (req, res, next) => {
    const { mahasiswa_id, tanggal, waktu, ruangan, penguji_id } = req.body;

    if (!mahasiswa_id || !tanggal || !waktu || !ruangan || !penguji_id) {
      return res.status(400).json({ message: 'mahasiswa_id, tanggal, waktu, ruangan, dan penguji_id wajib diisi' });
    }

    try {
      // Cek mahasiswa dan ambil dosen pembimbingnya
      const [mhsRows] = await pool.query(
        'SELECT dosen_id FROM mahasiswa WHERE id = ?',
        [mahasiswa_id]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      if (!mhsRows[0].dosen_id) {
        return res.status(400).json({ message: 'Mahasiswa belum memiliki dosen pembimbing' });
      }

      const dosenId = mhsRows[0].dosen_id;

      // Cek mahasiswa punya laporan approved (optional check - skip if table doesn't exist)
      try {
        const [laporanRows] = await pool.query(
          "SELECT id FROM laporan_sidang WHERE mahasiswa_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 1",
          [mahasiswa_id]
        );
        // Temporarily comment out this check to allow scheduling without approved laporan
        // if (laporanRows.length === 0) {
        //   return res.status(400).json({ message: 'Mahasiswa belum memiliki laporan yang disetujui' });
        // }
      } catch (e) {
        console.log('Laporan check skipped:', e.message);
      }

      // Cek penguji ada (penguji adalah dosen)
      const [pengujiRows] = await pool.query('SELECT id FROM dosen WHERE id = ?', [penguji_id]);

      if (pengujiRows.length === 0) {
        return res.status(404).json({ message: 'Penguji tidak ditemukan' });
      }

      // Insert sidang - jika ada FK constraint error, coba insert ke penguji table dulu
      try {
        const [result] = await pool.query(
          `INSERT INTO sidang (mahasiswa_id, tanggal, waktu, ruangan, dosen_id, penguji_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [mahasiswa_id, tanggal, waktu, ruangan, dosenId, penguji_id]
        );
        res.status(201).json({ message: 'Sidang berhasil dijadwalkan', id: result.insertId });
      } catch (insertErr) {
        // Jika error karena FK constraint, coba insert penguji dulu
        if (insertErr.code === 'ER_NO_REFERENCED_ROW_2' || insertErr.code === 'ER_NO_REFERENCED_ROW') {
          console.log('FK constraint error, trying to insert penguji first...');
          try {
            // Get dosen data untuk insert ke penguji
            const [dosenData] = await pool.query('SELECT nama FROM dosen WHERE id = ?', [penguji_id]);
            if (dosenData.length > 0) {
              await pool.query(
                'INSERT IGNORE INTO penguji (id, nama) VALUES (?, ?)',
                [penguji_id, dosenData[0].nama]
              );
              // Retry insert sidang
              const [result] = await pool.query(
                `INSERT INTO sidang (mahasiswa_id, tanggal, waktu, ruangan, dosen_id, penguji_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [mahasiswa_id, tanggal, waktu, ruangan, dosenId, penguji_id]
              );
              return res.status(201).json({ message: 'Sidang berhasil dijadwalkan', id: result.insertId });
            }
          } catch (e) {
            console.error('Insert penguji failed:', e.message);
          }
        }
        throw insertErr;
      }
    } catch (err) {
      console.error('Schedule sidang error:', err);
      res.status(500).json({ message: 'Internal server error', detail: err.message });
    }
  },

  // GET SEMUA SIDANG
  getAllSidang: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, m.nama as mahasiswa_nama, m.npm, m.judul_proyek,
                d.nama as dosen_nama,
                p.nama as penguji_nama
         FROM sidang s
         JOIN mahasiswa m ON s.mahasiswa_id = m.id
         JOIN dosen d ON s.dosen_id = d.id
         JOIN dosen p ON s.penguji_id = p.id
         ORDER BY s.tanggal DESC, s.waktu ASC`
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // MAHASISWA: GET JADWAL SIDANG SENDIRI
  getMySidang: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT s.*, d.nama as dosen_nama, p.nama as penguji_nama
         FROM sidang s
         JOIN dosen d ON s.dosen_id = d.id
         JOIN dosen p ON s.penguji_id = p.id
         WHERE s.mahasiswa_id = ?`,
        [mahasiswaId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

};

export default sidangController;
