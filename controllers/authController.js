import pool from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

// Hardcoded admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kavanahub.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const authController = {
  // Register Mahasiswa (hanya mahasiswa yang bisa register sendiri)
  registerMahasiswa: async (req, res, next) => {
    const { email, password, npm, nama, no_wa, angkatan } = req.body;

    try {
      const [existing] = await pool.query('SELECT id FROM mahasiswa WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const [existingNpm] = await pool.query('SELECT id FROM mahasiswa WHERE npm = ?', [npm]);
      if (existingNpm.length > 0) {
        return res.status(400).json({ message: 'NPM already registered' });
      }

      const password_hash = await hashPassword(password);

      await pool.query(
        'INSERT INTO mahasiswa (email, password_hash, npm, nama, no_wa, angkatan) VALUES (?, ?, ?, ?, ?, ?)',
        [email, password_hash, npm, nama, no_wa || null, angkatan || null]
      );

      res.status(201).json({ message: 'Mahasiswa registered successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Login (multi-role)
  login: async (req, res, next) => {
    const { email, password } = req.body;

    try {
      // Check hardcoded admin
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = generateToken({ id: 0, email: ADMIN_EMAIL, role: 'admin' });
        return res.json({ token, role: 'admin', user_id: 0 });
      }

      let rows = [];

      // Check mahasiswa
      [rows] = await pool.query('SELECT id, email, password_hash, "mahasiswa" as role FROM mahasiswa WHERE email = ?', [email]);

      // Check dosen (bisa kaprodi atau dosen biasa berdasarkan jabatan)
      if (rows.length === 0) {
        [rows] = await pool.query(
          `SELECT id, email, password_hash, jabatan,
           CASE 
             WHEN jabatan LIKE '%kaprodi%' THEN 'kaprodi'
             ELSE 'dosen'
           END as role
           FROM dosen WHERE email = ?`,
          [email]
        );
      }

      // Check koordinator
      if (rows.length === 0) {
        [rows] = await pool.query('SELECT id, email, password_hash, "koordinator" as role FROM koordinator WHERE email = ?', [email]);
      }

      // Check penguji
      if (rows.length === 0) {
        [rows] = await pool.query('SELECT id, email, password_hash, "penguji" as role FROM penguji WHERE email = ?', [email]);
      }

      if (rows.length === 0) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const user = rows[0];
      const match = await comparePassword(password, user.password_hash);
      if (!match) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      res.json({ token, role: user.role, user_id: user.id });
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
