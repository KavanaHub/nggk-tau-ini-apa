import pool from '../config/db.js';

const sidangController = {
  // mahasiswa upload laporan untuk diajukan sidang
  submitReport: async (req, res, next) => {
    const { group_id, file_url } = req.body;

    try {
      const [result] = await pool.query(
        'INSERT INTO reports (group_id, file_url, status) VALUES (?, ?, "submitted")',
        [group_id, file_url]
      );

      res.status(201).json({ message: 'Report submitted', id: result.insertId });
    } catch (err) {
      next(err);
    }
  },

  // dosen pembimbing approve / reject laporan
  approveReport: async (req, res, next) => {
    const { id } = req.params;
    const { status, note } = req.body; // 'approved' / 'rejected'
    const userId = req.user.id;

    try {
      const [dosenRows] = await pool.query('SELECT id FROM dosen WHERE user_id = ?', [userId]);
      if (dosenRows.length === 0) {
        return res.status(400).json({ message: 'Dosen not found' });
      }
      const dosenId = dosenRows[0].id;

      await pool.query(
        `
        UPDATE reports
        SET status = ?, note = ?, approved_by = ?, approved_at = NOW()
        WHERE id = ?
        `,
        [status, note || null, dosenId, id]
      );

      res.json({ message: 'Report updated' });
    } catch (err) {
      next(err);
    }
  },

  // dosen (pembimbing / penguji) menginput nilai sidang
  inputGrade: async (req, res, next) => {
    const { defense_id, role, grade, note } = req.body; // role: 'pembimbing' / 'penguji_1' / 'penguji_2'
    const userId = req.user.id;

    try {
      const [dosenRows] = await pool.query('SELECT id FROM dosen WHERE user_id = ?', [userId]);
      if (dosenRows.length === 0) {
        return res.status(400).json({ message: 'Dosen not found' });
      }
      const dosenId = dosenRows[0].id;

      // kalau mau ON DUPLICATE KEY UPDATE, pastikan ada UNIQUE KEY (defense_id, dosen_id, role)
      await pool.query(
        `
        INSERT INTO defense_examiners (defense_id, dosen_id, role, grade, note)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE grade = VALUES(grade), note = VALUES(note)
        `,
        [defense_id, dosenId, role, grade, note || null]
      );

      res.json({ message: 'Grade saved' });
    } catch (err) {
      next(err);
    }
  },
};

export default sidangController;
