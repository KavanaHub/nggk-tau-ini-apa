import pool from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

const authController = {
  registerMahasiswa: async (req, res, next) => {
    const { email, password, npm, nama, prodi_id, no_wa, angkatan } = req.body;

    try {
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: 'Email already registered' });
      }

      const password_hash = await hashPassword(password);

      const [userResult] = await conn.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, password_hash, 'mahasiswa']
      );

      const userId = userResult.insertId;

      await conn.query(
        'INSERT INTO mahasiswa (user_id, npm, nama, prodi_id, no_wa, angkatan) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, npm, nama, prodi_id, no_wa || null, angkatan || null]
      );

      await conn.commit();
      conn.release();

      res.status(201).json({ message: 'Mahasiswa registered successfully' });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    const { email, password } = req.body;

    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const user = rows[0];
      const match = await comparePassword(password, user.password_hash);
      if (!match) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user);
      res.json({ token, role: user.role, user_id: user.id });
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
