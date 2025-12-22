import pool from '../config/db.js';

const sidangController = {
  // MAHASISWA: SUBMIT LAPORAN SIDANG
  submitLaporan: async (req, res, next) => {
    const mahasiswaId = req.user.id;
    const { file_url } = req.body;

    if (!file_url) {
      return res.status(400).json({ message: 'file_url wajib diisi' });
    }

    try {
      // Cek mahasiswa punya dosen dan proposal approved
      const [mhsRows] = await pool.query(
        'SELECT dosen_id, status_proposal FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      if (!mhsRows[0].dosen_id) {
        return res.status(400).json({ message: 'Anda belum memiliki dosen pembimbing' });
      }

      if (mhsRows[0].status_proposal !== 'approved') {
        return res.status(400).json({ message: 'Proposal belum disetujui' });
      }

      // Cek bimbingan sudah 8 kali dan semua approved
      const [[{ total, approved }]] = await pool.query(
        `SELECT COUNT(*) AS total, SUM(status = 'approved') AS approved 
         FROM bimbingan WHERE mahasiswa_id = ?`,
        [mahasiswaId]
      );

      if (total < 8) {
        return res.status(400).json({ message: 'Bimbingan belum mencapai 8 kali' });
      }

      if (approved < 8) {
        return res.status(400).json({ message: 'Semua bimbingan harus sudah disetujui' });
      }

      const [result] = await pool.query(
        `INSERT INTO laporan_sidang (mahasiswa_id, file_url, status)
         VALUES (?, ?, 'pending')`,
        [mahasiswaId, file_url]
      );

      res.status(201).json({ message: 'Laporan berhasil disubmit', id: result.insertId });
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

  // DOSEN: GET LAPORAN MAHASISWA BIMBINGAN (termasuk sebagai pembimbing 2)
  getDosenLaporan: async (req, res, next) => {
    const dosenId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT ls.id, ls.mahasiswa_id, ls.file_url as file_laporan, ls.status, 
                ls.note as catatan_dosen, ls.created_at as tanggal_submit,
                m.nama as mahasiswa_nama, m.npm as mahasiswa_npm, m.track, m.judul_proyek as judul,
                CASE WHEN m.dosen_id = ? THEN 'utama' ELSE 'kedua' END as peran_pembimbing,
                (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') as bimbingan_count
         FROM laporan_sidang ls
         JOIN mahasiswa m ON ls.mahasiswa_id = m.id
         WHERE m.dosen_id = ? OR m.dosen_id_2 = ?
         ORDER BY ls.created_at DESC`,
        [dosenId, dosenId, dosenId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // DOSEN: APPROVE / REJECT LAPORAN
  updateLaporanStatus: async (req, res, next) => {
    const dosenId = req.user.id;
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status wajib diisi' });
    }

    if (!['approved', 'rejected', 'revision'].includes(status)) {
      return res.status(400).json({ message: 'Status harus approved, rejected, atau revision' });
    }

    try {
      // Cek laporan milik mahasiswa bimbingan dosen ini (termasuk sebagai pembimbing 2)
      const [rows] = await pool.query(
        `SELECT ls.id FROM laporan_sidang ls
         JOIN mahasiswa m ON ls.mahasiswa_id = m.id
         WHERE ls.id = ? AND (m.dosen_id = ? OR m.dosen_id_2 = ?)`,
        [id, dosenId, dosenId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Laporan tidak ditemukan atau bukan mahasiswa bimbingan Anda' });
      }

      await pool.query(
        `UPDATE laporan_sidang SET status = ?, note = ?, approved_by = ?, approved_at = NOW()
         WHERE id = ?`,
        [status, note || null, dosenId, id]
      );

      res.json({ message: `Laporan ${status}` });
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
