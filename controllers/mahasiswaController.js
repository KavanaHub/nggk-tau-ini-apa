import pool from "../config/db.js";
import sharedController from './sharedController.js';

const mahasiswaController = {
  // GET PROFILE MAHASISWA
  getProfile: async (req, res, next) => {
    try {
      const mahasiswaId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, npm, nama, no_wa, angkatan, judul_proyek, 
                file_proposal, status_proposal, dosen_id, created_at
         FROM mahasiswa WHERE id = ?`,
        [mahasiswaId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },

  // UPDATE PROFILE MAHASISWA
  updateProfile: async (req, res, next) => {
    const { nama, no_wa, angkatan } = req.body;
    const mahasiswaId = req.user.id;

    try {
      await pool.query(
        `UPDATE mahasiswa SET nama = COALESCE(?, nama), 
         no_wa = COALESCE(?, no_wa), angkatan = COALESCE(?, angkatan)
         WHERE id = ?`,
        [nama, no_wa, angkatan, mahasiswaId]
      );

      res.json({ message: "Profile updated successfully" });
    } catch (err) {
      next(err);
    }
  },

  // SUBMIT PROPOSAL (judul + file)
  submitProposal: async (req, res, next) => {
    const { judul_proyek, file_url } = req.body;
    const mahasiswaId = req.user.id;

    if (!judul_proyek || !file_url) {
      return res.status(400).json({ message: "judul_proyek dan file_url wajib diisi" });
    }

    try {
      await pool.query(
        `UPDATE mahasiswa SET judul_proyek = ?, file_proposal = ?, status_proposal = 'pending'
         WHERE id = ?`,
        [judul_proyek, file_url, mahasiswaId]
      );

      res.status(201).json({ message: "Proposal submitted successfully" });
    } catch (err) {
      next(err);
    }
  },

  // GET STATUS PROPOSAL
  getProposalStatus: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT judul_proyek, file_proposal, status_proposal FROM mahasiswa WHERE id = ?`,
        [mahasiswaId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },

  // GET DOSEN PEMBIMBING INFO
  getDosen: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT d.id, d.nama, d.nidn, d.no_wa, d.email, d.jabatan
         FROM mahasiswa m
         JOIN dosen d ON m.dosen_id = d.id
         WHERE m.id = ?`,
        [mahasiswaId]
      );

      if (rows.length === 0) {
        return res.json({ message: "Belum ada dosen pembimbing yang ditugaskan", data: null });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },

  // GET BIMBINGAN LIST
  getBimbinganList: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT b.*, d.nama as dosen_nama
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

  // GET ALL DOSEN (untuk pilih pembimbing) - menggunakan shared function
  getAllDosen: sharedController.getActiveDosen,
};

export default mahasiswaController;
