import pool from '../config/db.js';

/**
 * Shared controller functions untuk menghindari duplikasi kode
 * antar kaprodiController, koordinatorController, dan lainnya
 */
const sharedController = {
    // GET SEMUA MAHASISWA (dengan info dosen, usulan dosen, dan bimbingan count)
    getAllMahasiswa: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT m.id, m.npm, m.nama, m.email, m.no_wa, m.angkatan, m.track,
                m.judul_proyek, m.status_proposal, m.dosen_id, m.usulan_dosen_id,
                d.nama as dosen_nama,
                ud.nama as usulan_dosen_nama,
                (SELECT COUNT(*) FROM bimbingan b WHERE b.mahasiswa_id = m.id AND b.status = 'approved') as bimbingan_count
         FROM mahasiswa m
         LEFT JOIN dosen d ON m.dosen_id = d.id
         LEFT JOIN dosen ud ON m.usulan_dosen_id = ud.id
         ORDER BY m.angkatan DESC, m.nama ASC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // GET SEMUA DOSEN (full info dengan mahasiswa_count)
    getAllDosen: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT d.id, d.nidn as nip, d.nama, d.email, d.no_wa, d.jabatan, d.is_active,
                        (SELECT COUNT(*) FROM mahasiswa WHERE dosen_id = d.id OR dosen_id_2 = d.id) as mahasiswa_count,
                        10 as max_quota
                 FROM dosen d 
                 ORDER BY d.nama ASC`
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
                `SELECT id, nama, nidn, no_wa, jabatan FROM dosen WHERE is_active = 1 ORDER BY nama ASC`
            );

            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // GET SEMUA DOSEN UNTUK ASSIGN KOORDINATOR
    // Menampilkan semua dosen aktif, dengan flag apakah sudah jadi koordinator
    getAllKoordinator: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT id, nidn, nama, email, no_wa, jabatan, is_active, assigned_semester 
                 FROM dosen 
                 WHERE is_active = 1 AND jabatan NOT LIKE '%kaprodi%'
                 ORDER BY nama ASC`
            );

            // Add semester label and is_koordinator flag
            const semesterLabels = {
                2: 'Proyek 1',
                3: 'Proyek 2',
                5: 'Proyek 3',
                7: 'Internship 1',
                8: 'Internship 2'
            };

            const result = rows.map(k => ({
                ...k,
                is_koordinator: k.jabatan?.includes('koordinator') || false,
                semester_label: k.assigned_semester ? semesterLabels[k.assigned_semester] : null
            }));

            res.json(result);
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

    // ASSIGN DOSEN KE MAHASISWA (support 2 pembimbing untuk internship)
    assignDosen: async (req, res, next) => {
        const { mahasiswa_id, dosen_id, dosen_id_2 } = req.body;

        if (!mahasiswa_id || !dosen_id) {
            return res.status(400).json({ message: 'mahasiswa_id dan dosen_id wajib diisi' });
        }

        try {
            // Cek mahasiswa dan track-nya
            const [mhsRows] = await pool.query('SELECT id, track FROM mahasiswa WHERE id = ?', [mahasiswa_id]);
            if (mhsRows.length === 0) {
                return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
            }

            const track = mhsRows[0].track;
            const isInternship = track && track.startsWith('internship');

            // Untuk internship, wajib 2 pembimbing
            if (isInternship && !dosen_id_2) {
                return res.status(400).json({ message: 'Track internship memerlukan 2 pembimbing (dosen_id dan dosen_id_2)' });
            }

            // Cek dosen utama ada
            const [dosenRows] = await pool.query('SELECT id FROM dosen WHERE id = ?', [dosen_id]);
            if (dosenRows.length === 0) {
                return res.status(404).json({ message: 'Dosen pembimbing utama tidak ditemukan' });
            }

            // Cek dosen 2 jika ada
            if (dosen_id_2) {
                const [dosen2Rows] = await pool.query('SELECT id FROM dosen WHERE id = ?', [dosen_id_2]);
                if (dosen2Rows.length === 0) {
                    return res.status(404).json({ message: 'Dosen pembimbing 2 tidak ditemukan' });
                }

                if (dosen_id === dosen_id_2) {
                    return res.status(400).json({ message: 'Dosen pembimbing utama dan dosen pembimbing 2 tidak boleh sama' });
                }
            }

            await pool.query(
                'UPDATE mahasiswa SET dosen_id = ?, dosen_id_2 = ? WHERE id = ?',
                [dosen_id, dosen_id_2 || null, mahasiswa_id]
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
