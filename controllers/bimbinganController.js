import pool from '../config/db.js';

const bimbinganController = {
  createSession: async (req, res, next) => {
    const { group_id, tanggal, minggu_ke, topik, catatan, dosen_id } = req.body;

    try {
      const [rows] = await pool.query(
        'SELECT COUNT(*) AS total FROM guidance_sessions WHERE group_id = ?',
        [group_id]
      );

      if (rows[0].total >= 8) {
        return res.status(400).json({ message: 'Bimbingan sudah mencapai 8 kali' });
      }

      const [result] = await pool.query(
        `
        INSERT INTO guidance_sessions (group_id, dosen_id, tanggal, minggu_ke, topik, catatan, status)
        VALUES (?, ?, ?, ?, ?, ?, 'waiting')
        `,
        [group_id, dosen_id, tanggal, minggu_ke, topik, catatan]
      );

      res.status(201).json({ message: 'Bimbingan created', id: result.insertId });
    } catch (err) {
      next(err);
    }
  },

  updateSessionStatus: async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const userId = req.user.id;

    try {
      const [dosenRows] = await pool.query('SELECT id FROM dosen WHERE user_id = ?', [userId]);
      if (dosenRows.length === 0) {
        return res.status(400).json({ message: 'Dosen not found' });
      }
      const dosenId = dosenRows[0].id;

      await pool.query(
        `
        UPDATE guidance_sessions
        SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE NULL END
        WHERE id = ? AND dosen_id = ?
        `,
        [status, status, id, dosenId]
      );

      res.json({ message: 'Bimbingan updated' });
    } catch (err) {
      next(err);
    }
  },
};

export default bimbinganController;
