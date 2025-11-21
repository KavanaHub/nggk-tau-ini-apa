import pool from '../config/db.js';

const kaprodiController = {
  // KAPRODI SET KOORDINATOR UNTUK TRACK (PROYEK / INTERNSHIP)
  setKoordinator: async (req, res, next) => {
    const { track_id, dosen_id } = req.body;
    const userId = req.user.id; // user kaprodi

    if (!track_id || !dosen_id) {
      return res.status(400).json({ message: 'track_id dan dosen_id wajib diisi' });
    }

    try {
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      // cari dosen_id dari user yang login
      const [dosenUserRows] = await conn.query(
        'SELECT id, prodi_id FROM dosen WHERE user_id = ?',
        [userId]
      );
      if (dosenUserRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'User ini tidak terdaftar sebagai dosen' });
      }
      const myDosenId = dosenUserRows[0].id;

      // cari track untuk tahu prodi_id Track (Proyek/Internship prodi mana)
      const [trackRows] = await conn.query(
        'SELECT id, prodi_id FROM tracks WHERE id = ?',
        [track_id]
      );
      if (trackRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'Track tidak ditemukan' });
      }
      const trackProdiId = trackRows[0].prodi_id;

      // cek apakah dosen ini kaprodi untuk prodi tersebut
      const [kaprodiRows] = await conn.query(
        `
        SELECT id FROM kaprodi
        WHERE dosen_id = ? AND prodi_id = ? AND is_active = 1
        `,
        [myDosenId, trackProdiId]
      );
      if (kaprodiRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(403).json({
          message: 'Hanya Kaprodi prodi terkait yang boleh memilih koordinator untuk track ini',
        });
      }

      // set koordinator
      await conn.query(
        'INSERT INTO koordinator (dosen_id, track_id, is_active) VALUES (?, ?, 1)',
        [dosen_id, track_id]
      );

      await conn.commit();
      conn.release();

      res.status(201).json({ message: 'Koordinator set successfully' });
    } catch (err) {
      next(err);
    }
  },
};

export default kaprodiController;
