import pool from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

// Hardcoded admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@kavanahub.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const authController = {
  // Register Mahasiswa (hanya mahasiswa yang bisa register sendiri - prodi D4 saja)
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

  // Login (multi-role) - support email dan NPM
  login: async (req, res, next) => {
    const { email, password } = req.body;
    const identifier = email; // bisa email atau NPM

    try {
      // Check hardcoded admin
      if (identifier === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = generateToken({ id: 0, email: ADMIN_EMAIL, role: 'admin' });
        return res.json({ token, role: 'admin', user_id: 0 });
      }

      let rows = [];

      // Detect if identifier is NPM (all digits) or email
      const isNPM = /^\d+$/.test(identifier);

      // Check mahasiswa (by email or NPM)
      if (isNPM) {
        [rows] = await pool.query('SELECT id, email, password_hash, "mahasiswa" as role FROM mahasiswa WHERE npm = ?', [identifier]);
      } else {
        [rows] = await pool.query('SELECT id, email, password_hash, "mahasiswa" as role FROM mahasiswa WHERE email = ?', [identifier]);
      }

      // Check dosen (kaprodi, koordinator, atau dosen biasa berdasarkan dosen_role)
      // Prioritas: 1. kaprodi, 2. koordinator, 3. dosen
      if (rows.length === 0) {
        [rows] = await pool.query(
          `SELECT d.id, d.email, d.password_hash,
           (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr 
            JOIN role r ON dr.role_id = r.id 
            WHERE dr.dosen_id = d.id) as roles,
           CASE 
             WHEN EXISTS (SELECT 1 FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id AND r.nama_role = 'kaprodi') THEN 'kaprodi'
             WHEN EXISTS (SELECT 1 FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id AND r.nama_role = 'koordinator') THEN 'koordinator'
             ELSE 'dosen'
           END as role
           FROM dosen d WHERE d.email = ?`,
          [email]
        );
      }

      // Check penguji (tabel terpisah untuk penguji sidang)
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

  // GET Profile (multi-role)
  getProfile: async (req, res, next) => {
    const { id, role } = req.user;

    try {
      let rows = [];

      if (role === 'mahasiswa') {
        [rows] = await pool.query(
          'SELECT id, nama, email, npm, angkatan, no_wa as whatsapp FROM mahasiswa WHERE id = ?',
          [id]
        );
      } else if (role === 'dosen' || role === 'kaprodi') {
        [rows] = await pool.query(
          `SELECT d.id, d.nama, d.email, d.nidn as nip, d.no_wa,
           (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id) as roles
           FROM dosen d WHERE d.id = ?`,
          [id]
        );
      } else if (role === 'koordinator') {
        [rows] = await pool.query(
          'SELECT id, nama, email, nip, foto_profil FROM koordinator WHERE id = ?',
          [id]
        );
      } else if (role === 'penguji') {
        [rows] = await pool.query(
          'SELECT id, nama, email, nip, foto_profil FROM penguji WHERE id = ?',
          [id]
        );
      } else if (role === 'admin') {
        return res.json({ nama: 'Administrator', email: ADMIN_EMAIL, role: 'admin' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ ...rows[0], role });
    } catch (err) {
      next(err);
    }
  },

  // UPDATE Profile (multi-role)
  updateProfile: async (req, res, next) => {
    const { id, role } = req.user;
    const { nama, email, whatsapp } = req.body;

    try {
      let result;

      if (role === 'mahasiswa') {
        [result] = await pool.query(
          'UPDATE mahasiswa SET nama = ?, email = ?, no_wa = ? WHERE id = ?',
          [nama, email, whatsapp || null, id]
        );
      } else if (role === 'dosen' || role === 'kaprodi') {
        [result] = await pool.query(
          'UPDATE dosen SET nama = ?, email = ? WHERE id = ?',
          [nama, email, id]
        );
      } else if (role === 'koordinator') {
        [result] = await pool.query(
          'UPDATE koordinator SET nama = ?, email = ? WHERE id = ?',
          [nama, email, id]
        );
      } else if (role === 'penguji') {
        [result] = await pool.query(
          'UPDATE penguji SET nama = ?, email = ? WHERE id = ?',
          [nama, email, id]
        );
      } else {
        return res.status(400).json({ message: 'Cannot update profile for this role' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'Profile updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  // CHANGE Password (multi-role)
  changePassword: async (req, res, next) => {
    const { id, role } = req.user;
    const { old_password, new_password } = req.body;

    try {
      if (!old_password || !new_password) {
        return res.status(400).json({ message: 'Old password and new password are required' });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      let rows = [];
      let table = '';

      if (role === 'mahasiswa') {
        table = 'mahasiswa';
        [rows] = await pool.query('SELECT password_hash FROM mahasiswa WHERE id = ?', [id]);
      } else if (role === 'dosen' || role === 'kaprodi') {
        table = 'dosen';
        [rows] = await pool.query('SELECT password_hash FROM dosen WHERE id = ?', [id]);
      } else if (role === 'koordinator') {
        table = 'koordinator';
        [rows] = await pool.query('SELECT password_hash FROM koordinator WHERE id = ?', [id]);
      } else if (role === 'penguji') {
        table = 'penguji';
        [rows] = await pool.query('SELECT password_hash FROM penguji WHERE id = ?', [id]);
      } else {
        return res.status(400).json({ message: 'Cannot change password for this role' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const match = await comparePassword(old_password, rows[0].password_hash);
      if (!match) {
        return res.status(401).json({ message: 'Old password is incorrect' });
      }

      const new_password_hash = await hashPassword(new_password);
      await pool.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [new_password_hash, id]);

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  },
};

export default authController;
