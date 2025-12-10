import pool from '../config/db.js';

const kelompokController = {
    // CREATE KELOMPOK (Mahasiswa membuat kelompok baru)
    createKelompok: async (req, res, next) => {
        const mahasiswaId = req.user.id;
        const { nama } = req.body;

        if (!nama) {
            return res.status(400).json({ message: 'Nama kelompok wajib diisi' });
        }

        try {
            // Cek mahasiswa sudah punya track
            const [mhsRows] = await pool.query(
                'SELECT track, kelompok_id FROM mahasiswa WHERE id = ?',
                [mahasiswaId]
            );

            if (mhsRows.length === 0) {
                return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
            }

            if (!mhsRows[0].track) {
                return res.status(400).json({ message: 'Anda harus memilih track terlebih dahulu' });
            }

            if (mhsRows[0].kelompok_id) {
                return res.status(400).json({ message: 'Anda sudah tergabung dalam kelompok' });
            }

            const track = mhsRows[0].track;

            // Internship tidak perlu kelompok (1 orang)
            if (track.startsWith('internship')) {
                return res.status(400).json({ message: 'Track internship tidak memerlukan kelompok' });
            }

            // Buat kelompok
            const [result] = await pool.query(
                'INSERT INTO kelompok (nama, track) VALUES (?, ?)',
                [nama, track]
            );

            const kelompokId = result.insertId;

            // Assign mahasiswa ke kelompok
            await pool.query(
                'UPDATE mahasiswa SET kelompok_id = ? WHERE id = ?',
                [kelompokId, mahasiswaId]
            );

            res.status(201).json({
                message: 'Kelompok berhasil dibuat',
                kelompok_id: kelompokId,
                nama: nama
            });
        } catch (err) {
            next(err);
        }
    },

    // JOIN KELOMPOK (Mahasiswa bergabung ke kelompok existing)
    joinKelompok: async (req, res, next) => {
        const mahasiswaId = req.user.id;
        const { kelompok_id } = req.body;

        if (!kelompok_id) {
            return res.status(400).json({ message: 'kelompok_id wajib diisi' });
        }

        try {
            // Cek mahasiswa
            const [mhsRows] = await pool.query(
                'SELECT track, kelompok_id FROM mahasiswa WHERE id = ?',
                [mahasiswaId]
            );

            if (mhsRows.length === 0) {
                return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
            }

            if (!mhsRows[0].track) {
                return res.status(400).json({ message: 'Anda harus memilih track terlebih dahulu' });
            }

            if (mhsRows[0].kelompok_id) {
                return res.status(400).json({ message: 'Anda sudah tergabung dalam kelompok' });
            }

            const track = mhsRows[0].track;

            // Cek kelompok
            const [kelompokRows] = await pool.query(
                'SELECT id, track FROM kelompok WHERE id = ?',
                [kelompok_id]
            );

            if (kelompokRows.length === 0) {
                return res.status(404).json({ message: 'Kelompok tidak ditemukan' });
            }

            // Cek track sama
            if (kelompokRows[0].track !== track) {
                return res.status(400).json({ message: 'Track kelompok tidak sesuai dengan track Anda' });
            }

            // Cek jumlah anggota (max 2 untuk proyek)
            const [[{ count }]] = await pool.query(
                'SELECT COUNT(*) as count FROM mahasiswa WHERE kelompok_id = ?',
                [kelompok_id]
            );

            if (count >= 2) {
                return res.status(400).json({ message: 'Kelompok sudah penuh (maksimal 2 anggota)' });
            }

            // Join kelompok
            await pool.query(
                'UPDATE mahasiswa SET kelompok_id = ? WHERE id = ?',
                [kelompok_id, mahasiswaId]
            );

            res.json({ message: 'Berhasil bergabung ke kelompok' });
        } catch (err) {
            next(err);
        }
    },

    // GET MY KELOMPOK (Mahasiswa lihat kelompok sendiri)
    getMyKelompok: async (req, res, next) => {
        const mahasiswaId = req.user.id;

        try {
            const [rows] = await pool.query(
                `SELECT k.*, 
          (SELECT COUNT(*) FROM mahasiswa WHERE kelompok_id = k.id) as jumlah_anggota
         FROM mahasiswa m
         JOIN kelompok k ON m.kelompok_id = k.id
         WHERE m.id = ?`,
                [mahasiswaId]
            );

            if (rows.length === 0) {
                return res.json({ message: 'Anda belum tergabung dalam kelompok', data: null });
            }

            // Get anggota kelompok
            const [members] = await pool.query(
                'SELECT id, nama, npm, email FROM mahasiswa WHERE kelompok_id = ?',
                [rows[0].id]
            );

            res.json({
                kelompok: rows[0],
                anggota: members
            });
        } catch (err) {
            next(err);
        }
    },

    // GET ALL KELOMPOK (untuk koordinator/kaprodi)
    getAllKelompok: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT k.*, 
          (SELECT COUNT(*) FROM mahasiswa WHERE kelompok_id = k.id) as jumlah_anggota
         FROM kelompok k
         ORDER BY k.created_at DESC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // GET AVAILABLE KELOMPOK (untuk mahasiswa yang mau join)
    getAvailableKelompok: async (req, res, next) => {
        const mahasiswaId = req.user.id;

        try {
            // Get track mahasiswa
            const [mhsRows] = await pool.query(
                'SELECT track FROM mahasiswa WHERE id = ?',
                [mahasiswaId]
            );

            if (mhsRows.length === 0 || !mhsRows[0].track) {
                return res.status(400).json({ message: 'Pilih track terlebih dahulu' });
            }

            const track = mhsRows[0].track;

            // Get kelompok yang belum penuh dengan track yang sama
            const [rows] = await pool.query(
                `SELECT k.*, 
          (SELECT COUNT(*) FROM mahasiswa WHERE kelompok_id = k.id) as jumlah_anggota
         FROM kelompok k
         WHERE k.track = ?
         HAVING jumlah_anggota < 2
         ORDER BY k.created_at DESC`,
                [track]
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },
};

export default kelompokController;
