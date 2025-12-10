import pool from '../config/db.js';

/**
 * Shared controller functions untuk menghindari duplikasi kode
 * antar kaprodiController, koordinatorController, dan lainnya
 */
const sharedController = {
    // GET SEMUA MAHASISWA (dengan info dosen)
    getAllMahasiswa: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT m.id, m.npm, m.nama, m.email, m.no_wa, m.angkatan, 
                m.judul_proyek, m.status_proposal, m.dosen_id,
                d.nama as dosen_nama
         FROM mahasiswa m
         LEFT JOIN dosen d ON m.dosen_id = d.id
         ORDER BY m.angkatan DESC, m.nama ASC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // GET SEMUA DOSEN (full info)
    getAllDosen: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, nidn, nama, email, no_wa, jabatan, prodi, is_active FROM dosen ORDER BY nama ASC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // GET SEMUA DOSEN (active only, untuk list pilihan)
    getActiveDosen: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, nama, nidn, no_wa, jabatan, prodi FROM dosen WHERE is_active = 1 ORDER BY nama ASC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // GET SEMUA KOORDINATOR
    getAllKoordinator: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, nidn, nama, email, no_wa, is_active FROM koordinator ORDER BY nama ASC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // GET SEMUA PENGUJI
    getAllPenguji: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, nidn, nama, email, no_wa, is_active FROM penguji ORDER BY nama ASC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // ASSIGN DOSEN KE MAHASISWA
    assignDosen: async (req, res, next) => {
        const { mahasiswa_id, dosen_id } = req.body;

        if (!mahasiswa_id || !dosen_id) {
            return res.status(400).json({ message: 'mahasiswa_id dan dosen_id wajib diisi' });
        }

        try {
            // Cek mahasiswa ada
            const [mhsRows] = await pool.query('SELECT id FROM mahasiswa WHERE id = ?', [mahasiswa_id]);
            if (mhsRows.length === 0) {
                return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
            }

            // Cek dosen ada
            const [dosenRows] = await pool.query('SELECT id FROM dosen WHERE id = ?', [dosen_id]);
            if (dosenRows.length === 0) {
                return res.status(404).json({ message: 'Dosen tidak ditemukan' });
            }

            await pool.query(
                'UPDATE mahasiswa SET dosen_id = ? WHERE id = ?',
                [dosen_id, mahasiswa_id]
            );

            res.json({ message: 'Dosen pembimbing berhasil ditugaskan' });
        } catch (err) {
            next(err);
        }
    },

    // UPDATE STATUS PROPOSAL (APPROVE / REJECT)
    updateProposalStatus: async (req, res, next) => {
        const { mahasiswa_id, status } = req.body;

        if (!mahasiswa_id || !status) {
            return res.status(400).json({ message: 'mahasiswa_id dan status wajib diisi' });
        }

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Status harus approved atau rejected' });
        }

        try {
            // Cek mahasiswa ada
            const [mhsRows] = await pool.query('SELECT id FROM mahasiswa WHERE id = ?', [mahasiswa_id]);
            if (mhsRows.length === 0) {
                return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
            }

            await pool.query(
                'UPDATE mahasiswa SET status_proposal = ? WHERE id = ?',
                [status, mahasiswa_id]
            );

            res.json({ message: `Proposal ${status}` });
        } catch (err) {
            next(err);
        }
    },
};

export default sharedController;
