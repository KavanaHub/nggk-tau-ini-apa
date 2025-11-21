import pool from '../config/db.js';

const dosenController = {
  // list semua dosen (buat mahasiswa milih pembimbing)
  listDosen: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, nama, no_wa FROM dosen'
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
};

export default dosenController;
