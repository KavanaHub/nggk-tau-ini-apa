import pool from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

const authController = {
  // Register Mahasiswa
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

  // Register Dosen Pembimbing
  registerDosenPembimbing: async (req, res, next) => {
    const { email, password, nidn, nama, no_wa } = req.body;

    try {
      const [existing] = await pool.query('SELECT id FROM dosen_pembimbing WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const password_hash = await hashPassword(password);

      await pool.query(
        'INSERT INTO dosen_pembimbing (email, password_hash, nidn, nama, no_wa) VALUES (?, ?, ?, ?, ?)',
        [email, password_hash, nidn || null, nama, no_wa || null]
      );

      res.status(201).json({ message: 'Dosen Pembimbing registered successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Register Koordinator
  registerKoordinator: async (req, res, next) => {
    const { email, password, nidn, nama, no_wa } = req.body;

    try {
      const [existing] = await pool.query('SELECT id FROM koordinator WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const password_hash = await hashPassword(password);

      await pool.query(
        'INSERT INTO koordinator (email, password_hash, nidn, nama, no_wa) VALUES (?, ?, ?, ?, ?)',
        [email, password_hash, nidn || null, nama, no_wa || null]
      );

      res.status(201).json({ message: 'Koordinator registered successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Register Penguji
  registerPenguji: async (req, res, next) => {
    const { email, password, nidn, nama, no_wa } = req.body;

    try {
      const [existing] = await pool.query('SELECT id FROM penguji WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const password_hash = await hashPassword(password);

      await pool.query(
        'INSERT INTO penguji (email, password_hash, nidn, nama, no_wa) VALUES (?, ?, ?, ?, ?)',
        [email, password_hash, nidn || null, nama, no_wa || null]
      );

      res.status(201).json({ message: 'Penguji registered successfully' });
    } catch (err) {
      next(err);
    }
  },

  // Login (multi-role)
  login: async (req, res, next) => {
    const { email, password } = req.body;

    try {
      // Check mahasiswa
      let [rows] = await pool.query('SELECT id, email, password_hash, "mahasiswa" as role FROM mahasiswa WHERE email = ?', [email]);
      
      // Check dosen_pembimbing
      if (rows.length === 0) {
        [rows] = await pool.query('SELECT id, email, password_hash, "dosen_pembimbing" as role FROM dosen_pembimbing WHERE email = ?', [email]);
      }
      
      // Check koordinator
      if (rows.length === 0) {
        [rows] = await pool.query('SELECT id, email, password_hash, "koordinator" as role FROM koordinator WHERE email = ?', [email]);
      }
      
      // Check kaprodi
      if (rows.length === 0) {
        [rows] = await pool.query('SELECT id, email, password_hash, "kaprodi" as role FROM kaprodi WHERE email = ?', [email]);
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
