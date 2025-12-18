import pool from "../config/db.js";
import sharedController from './sharedController.js';

const mahasiswaController = {
  // GET PROFILE MAHASISWA
  getProfile: async (req, res, next) => {
    try {
      const mahasiswaId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, npm, nama, no_wa, angkatan, track, kelompok_id,
                judul_proyek, file_proposal, status_proposal, 
                dosen_id, dosen_id_2, usulan_dosen_id, created_at
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

  // SET TRACK (proyek1/2/3 atau internship1/2)
  setTrack: async (req, res, next) => {
    const mahasiswaId = req.user.id;
    const { track } = req.body;

    const validTracks = ['proyek1', 'proyek2', 'proyek3', 'internship1', 'internship2'];

    if (!track || !validTracks.includes(track)) {
      return res.status(400).json({
        message: 'Track tidak valid. Pilih: proyek1, proyek2, proyek3, internship1, atau internship2'
      });
    }

    try {
      // Cek apakah sudah punya track
      const [mhsRows] = await pool.query(
        'SELECT track, kelompok_id FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      if (mhsRows[0].track && mhsRows[0].kelompok_id) {
        return res.status(400).json({ message: 'Tidak dapat mengubah track setelah bergabung kelompok' });
      }

      await pool.query(
        'UPDATE mahasiswa SET track = ? WHERE id = ?',
        [track, mahasiswaId]
      );

      res.json({ message: `Track berhasil diset ke ${track}` });
    } catch (err) {
      next(err);
    }
  },

  // SUBMIT PROPOSAL (judul + file + usulan dosen)
  submitProposal: async (req, res, next) => {
    const { judul_proyek, file_url, usulan_dosen_id } = req.body;
    const mahasiswaId = req.user.id;

    if (!judul_proyek || !file_url) {
      return res.status(400).json({ message: "judul_proyek dan file_url wajib diisi" });
    }

    try {
      // Cek track sudah dipilih
      const [mhsRows] = await pool.query(
        'SELECT track FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (!mhsRows[0]?.track) {
        return res.status(400).json({ message: 'Pilih track terlebih dahulu' });
      }

      // Validasi usulan dosen jika ada
      if (usulan_dosen_id) {
        const [dosenRows] = await pool.query(
          'SELECT id FROM dosen WHERE id = ? AND is_active = 1',
          [usulan_dosen_id]
        );

        if (dosenRows.length === 0) {
          return res.status(400).json({ message: 'Dosen yang diusulkan tidak ditemukan' });
        }
      }

      await pool.query(
        `UPDATE mahasiswa SET judul_proyek = ?, file_proposal = ?, status_proposal = 'pending',
         usulan_dosen_id = ?
         WHERE id = ?`,
        [judul_proyek, file_url, usulan_dosen_id || null, mahasiswaId]
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
        `SELECT judul_proyek, file_proposal, status_proposal, usulan_dosen_id FROM mahasiswa WHERE id = ?`,
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

  // GET DOSEN PEMBIMBING INFO (termasuk pembimbing 2 untuk internship)
  getDosen: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT m.dosen_id, m.dosen_id_2, m.track,
                d1.nama as dosen_nama, d1.nidn as dosen_nidn, d1.no_wa as dosen_wa, d1.email as dosen_email,
                d2.nama as dosen2_nama, d2.nidn as dosen2_nidn, d2.no_wa as dosen2_wa, d2.email as dosen2_email
         FROM mahasiswa m
         LEFT JOIN dosen d1 ON m.dosen_id = d1.id
         LEFT JOIN dosen d2 ON m.dosen_id_2 = d2.id
         WHERE m.id = ?`,
        [mahasiswaId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
      }

      const data = rows[0];

      const result = {
        track: data.track,
        pembimbing_utama: data.dosen_id ? {
          id: data.dosen_id,
          nama: data.dosen_nama,
          nidn: data.dosen_nidn,
          no_wa: data.dosen_wa,
          email: data.dosen_email
        } : null,
        pembimbing_2: data.dosen_id_2 ? {
          id: data.dosen_id_2,
          nama: data.dosen2_nama,
          nidn: data.dosen2_nidn,
          no_wa: data.dosen2_wa,
          email: data.dosen2_email
        } : null
      };

      res.json(result);
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

  // GET PERIODE AKTIF - cek apakah ada periode aktif untuk semester mahasiswa
  getPeriodeAktif: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      // Get mahasiswa's angkatan
      const [mhsRows] = await pool.query(
        'SELECT angkatan FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      const angkatan = mhsRows[0].angkatan;
      if (!angkatan) {
        return res.json({ active: false, periode: null, message: 'Angkatan belum diset' });
      }

      // Calculate current semester based on angkatan
      // Kalender akademik: Ganjil = Oktober-Februari, Genap = Maret-September
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      // Calculate how many semesters since start
      // Mahasiswa masuk Oktober tahun angkatan = semester 1
      const yearsElapsed = currentYear - angkatan;
      let semester;

      if (currentMonth >= 10 || currentMonth <= 2) {
        // Semester GANJIL (Oktober - Februari)
        if (currentMonth >= 10) {
          // Okt-Des = tahun sama
          semester = (yearsElapsed * 2) + 1;
        } else {
          // Jan-Feb = tahun berikutnya, masih semester ganjil
          semester = ((yearsElapsed - 1) * 2) + 1;
        }
      } else {
        // Semester GENAP (Maret - September)
        semester = yearsElapsed * 2;
      }

      // Check if there's an active period for this semester
      const [periodeRows] = await pool.query(
        `SELECT id, nama, tipe, semester, start_date, end_date, status
         FROM jadwal_proyek
         WHERE semester = ? AND status = 'active' AND CURDATE() BETWEEN start_date AND end_date`,
        [semester]
      );

      if (periodeRows.length === 0) {
        return res.json({
          active: false,
          periode: null,
          semester: semester,
          message: `Tidak ada periode aktif untuk semester ${semester}`
        });
      }

      res.json({
        active: true,
        periode: periodeRows[0],
        semester: semester
      });
    } catch (err) {
      next(err);
    }
  },
};

export default mahasiswaController;
