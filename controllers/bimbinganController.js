import pool from '../config/db.js';

const bimbinganController = {
  // MAHASISWA: CREATE BIMBINGAN
  createBimbingan: async (req, res, next) => {
    const mahasiswaId = req.user.id;
    const { tanggal, minggu_ke, topik, catatan } = req.body;

    if (!tanggal || !minggu_ke || !topik) {
      return res.status(400).json({ message: 'tanggal, minggu_ke, dan topik wajib diisi' });
    }

    try {
      // 1. Cek mahasiswa + track + kelompok + dosen pembimbing
      const [mhsRows] = await pool.query(
        'SELECT id, track, kelompok_id, dosen_id FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      const requester = mhsRows[0];
      if (!requester.dosen_id) {
        return res.status(400).json({ message: 'Anda belum memiliki dosen pembimbing' });
      }

      // 2. Tentukan target submit:
      //    - Proyek + punya kelompok => 1 submit perwakilan, tersimpan untuk semua anggota kelompok
      //    - Internship / tidak berkelompok => tetap individual
      let targets = [requester];
      const isProyek = String(requester.track || '').includes('proyek');
      if (isProyek && requester.kelompok_id) {
        const [members] = await pool.query(
          'SELECT id, dosen_id FROM mahasiswa WHERE kelompok_id = ?',
          [requester.kelompok_id]
        );
        if (members.length > 0) {
          targets = members;
        }
      }

      // 3. Validasi semua target: max 8 + 1 minggu maksimal 1 bimbingan non-rejected
      for (const target of targets) {
        const [[{ total }]] = await pool.query(
          'SELECT COUNT(*) AS total FROM bimbingan WHERE mahasiswa_id = ?',
          [target.id]
        );

        if (total >= 8) {
          return res.status(400).json({
            message: 'Bimbingan sudah mencapai batas maksimal (8 kali)',
            mahasiswa_id: target.id,
          });
        }

        const [existingWeek] = await pool.query(
          `SELECT id, tanggal FROM bimbingan 
           WHERE mahasiswa_id = ? 
           AND status != 'rejected'
           AND YEARWEEK(tanggal, 1) = YEARWEEK(?, 1)`,
          [target.id, tanggal]
        );

        if (existingWeek.length > 0) {
          return res.status(400).json({
            message: 'Sudah ada bimbingan di minggu ini. Mohon ajukan di minggu berikutnya.',
            mahasiswa_id: target.id,
            existingDate: existingWeek[0].tanggal,
          });
        }
      }

      // 4. Insert ke semua target (proyek: semua anggota, internship: 1 mahasiswa)
      const insertedIds = [];
      for (const target of targets) {
        const [result] = await pool.query(
          `INSERT INTO bimbingan (mahasiswa_id, dosen_id, tanggal, minggu_ke, topik, catatan, status)
           VALUES (?, ?, ?, ?, ?, ?, 'waiting')`,
          [target.id, target.dosen_id || requester.dosen_id, tanggal, minggu_ke, topik, catatan || null]
        );
        insertedIds.push(result.insertId);
      }

      res.status(201).json({
        message: targets.length > 1
          ? 'Bimbingan kelompok berhasil dibuat (submit perwakilan)'
          : 'Bimbingan berhasil dibuat',
        id: insertedIds[0],
        ids: insertedIds,
      });
    } catch (err) {
      next(err);
    }
  },

  // MAHASISWA: GET LIST BIMBINGAN SENDIRI
  getMyBimbingan: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT b.id, b.tanggal, b.minggu_ke, b.topik, b.catatan, b.status, 
                b.approved_at, b.created_at, d.nama as dosen_nama
         FROM bimbingan b
         JOIN dosen d ON b.dosen_id = d.id
         WHERE b.mahasiswa_id = ?
         ORDER BY b.minggu_ke ASC`,
        [mahasiswaId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // DOSEN: GET LIST BIMBINGAN DARI MAHASISWA BIMBINGAN
  getDosenBimbingan: async (req, res, next) => {
    const dosenId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT b.id, b.mahasiswa_id, b.tanggal, b.minggu_ke, b.topik, b.catatan, b.status,
                b.approved_at, b.created_at, m.nama as mahasiswa_nama, m.npm,
                m.track, m.kelompok_id, k.nama as kelompok_nama
         FROM bimbingan b
         JOIN mahasiswa m ON b.mahasiswa_id = m.id
         LEFT JOIN kelompok k ON m.kelompok_id = k.id
         WHERE m.dosen_id = ? OR m.dosen_id_2 = ?
         ORDER BY 
           CASE b.status WHEN 'waiting' THEN 1 WHEN 'pending' THEN 2 ELSE 3 END,
           b.created_at DESC`,
        [dosenId, dosenId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // DOSEN: APPROVE / REJECT BIMBINGAN
  updateBimbinganStatus: async (req, res, next) => {
    const dosenId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status wajib diisi' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status harus approved atau rejected' });
    }

    try {
      // Cek bimbingan milik dosen ini + info kelompok
      const [rows] = await pool.query(
        `SELECT b.id, b.mahasiswa_id, b.minggu_ke, b.tanggal, b.topik,
                m.track, m.kelompok_id
         FROM bimbingan b
         JOIN mahasiswa m ON b.mahasiswa_id = m.id
         WHERE b.id = ? AND b.dosen_id = ?`,
        [id, dosenId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Bimbingan tidak ditemukan atau bukan milik Anda' });
      }

      const target = rows[0];
      const isProyekGroup = String(target.track || '').includes('proyek') && !!target.kelompok_id;

      const approvedAt = status === 'approved' ? 'NOW()' : 'NULL';

      if (isProyekGroup) {
        // Sinkronkan status untuk seluruh anggota kelompok pada entri yang sama (minggu/tanggal/topik).
        // Ini menjaga model "submit perwakilan" untuk track proyek.
        await pool.query(
          `UPDATE bimbingan b
           JOIN mahasiswa m ON b.mahasiswa_id = m.id
           SET b.status = ?, b.approved_at = ${approvedAt}
           WHERE m.kelompok_id = ?
             AND b.dosen_id = ?
             AND b.minggu_ke = ?
             AND DATE(b.tanggal) = DATE(?)
             AND b.topik = ?`,
          [status, target.kelompok_id, dosenId, target.minggu_ke, target.tanggal, target.topik]
        );
      } else {
        await pool.query(
          `UPDATE bimbingan SET status = ?, approved_at = ${approvedAt} WHERE id = ?`,
          [status, id]
        );
      }

      res.json({ message: `Bimbingan ${status}` });
    } catch (err) {
      next(err);
    }
  },

  // GET DETAIL BIMBINGAN
  getBimbinganById: async (req, res, next) => {
    const { id } = req.params;

    try {
      const [rows] = await pool.query(
        `SELECT b.*, m.nama as mahasiswa_nama, m.npm, d.nama as dosen_nama
         FROM bimbingan b
         JOIN mahasiswa m ON b.mahasiswa_id = m.id
         JOIN dosen d ON b.dosen_id = d.id
         WHERE b.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Bimbingan tidak ditemukan' });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },
};

export default bimbinganController;
