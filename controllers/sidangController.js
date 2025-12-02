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
      // Cek mahasiswa punya dosen pembimbing dan proposal approved
      const [mhsRows] = await pool.query(
        'SELECT dosen_pembimbing_id, status_proposal FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      if (!mhsRows[0].dosen_pembimbing_id) {
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
         VALUES (?, ?, 'submitted')`,
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

  // DOSEN: GET LAPORAN MAHASISWA BIMBINGAN
  getDosenLaporan: async (req, res, next) => {
    const dosenId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT ls.*, m.nama as mahasiswa_nama, m.npm
         FROM laporan_sidang ls
         JOIN mahasiswa m ON ls.mahasiswa_id = m.id
         WHERE m.dosen_pembimbing_id = ?
         ORDER BY ls.created_at DESC`,
        [dosenId]
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

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status harus approved atau rejected' });
    }

    try {
      // Cek laporan milik mahasiswa bimbingan dosen ini
      const [rows] = await pool.query(
        `SELECT ls.id FROM laporan_sidang ls
         JOIN mahasiswa m ON ls.mahasiswa_id = m.id
         WHERE ls.id = ? AND m.dosen_pembimbing_id = ?`,
        [id, dosenId]
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
  // Penguji 1 = Dosen Pembimbing mahasiswa (otomatis dari data mahasiswa)
  // Penguji 2 = Penguji utama/asli (dipilih)
  scheduleSidang: async (req, res, next) => {
    const { mahasiswa_id, tanggal, waktu, ruangan, penguji_id } = req.body;

    if (!mahasiswa_id || !tanggal || !waktu || !ruangan || !penguji_id) {
      return res.status(400).json({ message: 'mahasiswa_id, tanggal, waktu, ruangan, dan penguji_id wajib diisi' });
    }

    try {
      // Cek mahasiswa dan ambil dosen pembimbingnya
      const [mhsRows] = await pool.query(
        'SELECT dosen_pembimbing_id FROM mahasiswa WHERE id = ?',
        [mahasiswa_id]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      if (!mhsRows[0].dosen_pembimbing_id) {
        return res.status(400).json({ message: 'Mahasiswa belum memiliki dosen pembimbing' });
      }

      const dosenPembimbingId = mhsRows[0].dosen_pembimbing_id;

      // Cek mahasiswa punya laporan approved
      const [laporanRows] = await pool.query(
        "SELECT id FROM laporan_sidang WHERE mahasiswa_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 1",
        [mahasiswa_id]
      );

      if (laporanRows.length === 0) {
        return res.status(400).json({ message: 'Mahasiswa belum memiliki laporan yang disetujui' });
      }

      // Cek penguji ada
      const [pengujiRows] = await pool.query('SELECT id FROM penguji WHERE id = ?', [penguji_id]);

      if (pengujiRows.length === 0) {
        return res.status(404).json({ message: 'Penguji tidak ditemukan' });
      }

      const [result] = await pool.query(
        `INSERT INTO sidang (mahasiswa_id, tanggal, waktu, ruangan, dosen_pembimbing_id, penguji_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [mahasiswa_id, tanggal, waktu, ruangan, dosenPembimbingId, penguji_id]
      );

      res.status(201).json({ message: 'Sidang berhasil dijadwalkan', id: result.insertId });
    } catch (err) {
      next(err);
    }
  },

  // GET SEMUA SIDANG
  getAllSidang: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT s.*, m.nama as mahasiswa_nama, m.npm, m.judul_proyek,
                dp.nama as dosen_pembimbing_nama,
                p.nama as penguji_nama
         FROM sidang s
         JOIN mahasiswa m ON s.mahasiswa_id = m.id
         JOIN dosen_pembimbing dp ON s.dosen_pembimbing_id = dp.id
         JOIN penguji p ON s.penguji_id = p.id
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
        `SELECT s.*, dp.nama as dosen_pembimbing_nama, p.nama as penguji_nama
         FROM sidang s
         JOIN dosen_pembimbing dp ON s.dosen_pembimbing_id = dp.id
         JOIN penguji p ON s.penguji_id = p.id
         WHERE s.mahasiswa_id = ?`,
        [mahasiswaId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // DOSEN PEMBIMBING: INPUT NILAI (sebagai penguji 1)
  inputNilaiPembimbing: async (req, res, next) => {
    const dosenId = req.user.id;
    const { sidang_id, nilai, catatan } = req.body;

    if (!sidang_id || nilai === undefined) {
      return res.status(400).json({ message: 'sidang_id dan nilai wajib diisi' });
    }

    try {
      // Cek dosen adalah pembimbing di sidang ini
      const [sidangRows] = await pool.query(
        'SELECT id FROM sidang WHERE id = ? AND dosen_pembimbing_id = ?',
        [sidang_id, dosenId]
      );

      if (sidangRows.length === 0) {
        return res.status(403).json({ message: 'Anda bukan dosen pembimbing di sidang ini' });
      }

      // Insert atau update nilai
      await pool.query(
        `INSERT INTO nilai_sidang (sidang_id, role, nilai, catatan)
         VALUES (?, 'pembimbing', ?, ?)
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), catatan = VALUES(catatan)`,
        [sidang_id, nilai, catatan || null]
      );

      res.json({ message: 'Nilai pembimbing berhasil disimpan' });
    } catch (err) {
      next(err);
    }
  },

  // PENGUJI: INPUT NILAI (penguji utama)
  inputNilai: async (req, res, next) => {
    const pengujiId = req.user.id;
    const { sidang_id, nilai, catatan } = req.body;

    if (!sidang_id || nilai === undefined) {
      return res.status(400).json({ message: 'sidang_id dan nilai wajib diisi' });
    }

    try {
      // Cek penguji adalah penguji di sidang ini
      const [sidangRows] = await pool.query(
        'SELECT id FROM sidang WHERE id = ? AND penguji_id = ?',
        [sidang_id, pengujiId]
      );

      if (sidangRows.length === 0) {
        return res.status(403).json({ message: 'Anda bukan penguji di sidang ini' });
      }

      // Insert atau update nilai
      await pool.query(
        `INSERT INTO nilai_sidang (sidang_id, role, nilai, catatan)
         VALUES (?, 'penguji', ?, ?)
         ON DUPLICATE KEY UPDATE nilai = VALUES(nilai), catatan = VALUES(catatan)`,
        [sidang_id, nilai, catatan || null]
      );

      res.json({ message: 'Nilai penguji berhasil disimpan' });
    } catch (err) {
      next(err);
    }
  },

  // GET NILAI SIDANG
  getNilaiSidang: async (req, res, next) => {
    const { sidang_id } = req.params;

    try {
      const [sidangRows] = await pool.query(
        `SELECT s.dosen_pembimbing_id, s.penguji_id, 
                dp.nama as dosen_pembimbing_nama, p.nama as penguji_nama
         FROM sidang s
         JOIN dosen_pembimbing dp ON s.dosen_pembimbing_id = dp.id
         JOIN penguji p ON s.penguji_id = p.id
         WHERE s.id = ?`,
        [sidang_id]
      );

      if (sidangRows.length === 0) {
        return res.status(404).json({ message: 'Sidang tidak ditemukan' });
      }

      const [nilaiRows] = await pool.query(
        `SELECT * FROM nilai_sidang WHERE sidang_id = ?`,
        [sidang_id]
      );

      const nilai = {
        sidang_id: parseInt(sidang_id),
        dosen_pembimbing: {
          id: sidangRows[0].dosen_pembimbing_id,
          nama: sidangRows[0].dosen_pembimbing_nama,
          nilai: null,
          catatan: null
        },
        penguji: {
          id: sidangRows[0].penguji_id,
          nama: sidangRows[0].penguji_nama,
          nilai: null,
          catatan: null
        }
      };

      // Map nilai ke struktur response
      nilaiRows.forEach(row => {
        if (row.role === 'pembimbing') {
          nilai.dosen_pembimbing.nilai = row.nilai;
          nilai.dosen_pembimbing.catatan = row.catatan;
        } else if (row.role === 'penguji') {
          nilai.penguji.nilai = row.nilai;
          nilai.penguji.catatan = row.catatan;
        }
      });

      res.json(nilai);
    } catch (err) {
      next(err);
    }
  },
};

export default sidangController;
