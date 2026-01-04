import pool from "../config/db.js";

const adminController = {
    // GET ADMIN PROFILE
    getProfile: async (req, res) => {
        res.json({
            nama: 'Administrator',
            email: process.env.ADMIN_EMAIL || 'admin@kavanahub.com',
            role: 'admin'
        });
    },

    // GET SYSTEM STATS
    getStats: async (req, res, next) => {
        try {
            let total_mahasiswa = 0, total_dosen = 0, total_koordinator = 0, sidang_bulan_ini = 0;
            let proposal_pending = 0, bimbingan_aktif = 0, laporan_pending = 0, sidang_scheduled = 0, users_inactive = 0;

            try {
                const [[result]] = await pool.query('SELECT COUNT(*) as total_mahasiswa FROM mahasiswa');
                total_mahasiswa = result.total_mahasiswa || 0;
            } catch (e) { console.log('Error counting mahasiswa:', e.message); }

            try {
                const [[result]] = await pool.query('SELECT COUNT(*) as total_dosen FROM dosen');
                total_dosen = result.total_dosen || 0;
            } catch (e) { console.log('Error counting dosen:', e.message); }

            try {
                const [[result]] = await pool.query(`
                    SELECT COUNT(DISTINCT dr.dosen_id) as total_koordinator 
                    FROM dosen_role dr 
                    JOIN role r ON dr.role_id = r.id 
                    WHERE r.nama_role = 'koordinator'
                `);
                total_koordinator = result.total_koordinator || 0;
            } catch (e) { console.log('Error counting koordinator:', e.message); }

            // Sidang bulan ini
            try {
                const [[result]] = await pool.query(`
                    SELECT COUNT(*) as sidang_bulan_ini FROM sidang 
                    WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())
                `);
                sidang_bulan_ini = result.sidang_bulan_ini || 0;
            } catch (e) { console.log('Error counting sidang bulan ini:', e.message); }

            // System overview
            try {
                const [[result]] = await pool.query("SELECT COUNT(*) as proposal_pending FROM mahasiswa WHERE status_proposal = 'pending'");
                proposal_pending = result.proposal_pending || 0;
            } catch (e) { }

            try {
                const [[result]] = await pool.query("SELECT COUNT(*) as bimbingan_aktif FROM bimbingan WHERE status = 'pending'");
                bimbingan_aktif = result.bimbingan_aktif || 0;
            } catch (e) { }

            try {
                const [[result]] = await pool.query("SELECT COUNT(*) as laporan_pending FROM laporan_sidang WHERE status = 'pending'");
                laporan_pending = result.laporan_pending || 0;
            } catch (e) { }

            try {
                const [[result]] = await pool.query("SELECT COUNT(*) as sidang_scheduled FROM sidang WHERE status = 'scheduled'");
                sidang_scheduled = result.sidang_scheduled || 0;
            } catch (e) { }

            try {
                const [[result]] = await pool.query("SELECT COUNT(*) as users_inactive FROM mahasiswa WHERE is_active = false");
                users_inactive = result.users_inactive || 0;
            } catch (e) { }

            res.json({
                total_mahasiswa,
                total_dosen,
                total_koordinator,
                sidang_bulan_ini,
                proposal_pending,
                bimbingan_aktif,
                laporan_pending,
                sidang_scheduled,
                users_inactive
            });
        } catch (err) {
            next(err);
        }
    },

    // GET RECENT ACTIVITY
    getRecentActivity: async (req, res, next) => {
        try {
            // Combine recent activities from different tables
            const activities = [];

            // Recent mahasiswa registrations
            const [newMahasiswa] = await pool.query(
                `SELECT 'user_register' as type, CONCAT(nama, ' mendaftar sebagai mahasiswa') as message, created_at 
         FROM mahasiswa ORDER BY created_at DESC LIMIT 3`
            );
            activities.push(...newMahasiswa);

            // Recent proposals
            const [newProposals] = await pool.query(
                `SELECT 'proposal_submit' as type, CONCAT(nama, ' mengajukan proposal') as message, created_at 
         FROM mahasiswa WHERE judul_proyek IS NOT NULL ORDER BY created_at DESC LIMIT 3`
            );
            activities.push(...newProposals);

            // Recent sidang schedules
            try {
                const [newSidang] = await pool.query(
                    `SELECT 'sidang_scheduled' as type, CONCAT('Sidang dijadwalkan untuk ', m.nama) as message, s.created_at 
           FROM sidang s JOIN mahasiswa m ON s.mahasiswa_id = m.id ORDER BY s.created_at DESC LIMIT 3`
                );
                activities.push(...newSidang);
            } catch (e) { }

            // Sort by date and limit
            activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            res.json(activities.slice(0, 10));
        } catch (err) {
            next(err);
        }
    },

    // GET ALL USERS (combined view)
    getAllUsers: async (req, res, next) => {
        try {
            let mahasiswa = [];
            let dosen = [];

            try {
                const [rows] = await pool.query(
                    `SELECT id, nama, email, npm, 'mahasiswa' as role, created_at FROM mahasiswa`
                );
                mahasiswa = rows;
            } catch (e) { console.log('Error fetching mahasiswa:', e.message); }

            try {
                const [rows] = await pool.query(
                    `SELECT d.id, d.nama, d.email, d.nidn,
                     (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id) as roles,
                     CASE 
                       WHEN EXISTS (SELECT 1 FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id AND r.nama_role = 'kaprodi') THEN 'kaprodi'
                       WHEN EXISTS (SELECT 1 FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id AND r.nama_role = 'koordinator') THEN 'koordinator'
                       ELSE 'dosen' END as role,
                     d.created_at FROM dosen d`
                );
                dosen = rows;
            } catch (e) { console.log('Error fetching dosen:', e.message); }

            res.json({ mahasiswa, dosen });
        } catch (err) {
            next(err);
        }
    },

    // GET ALL DOSEN
    getAllDosen: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT d.id, d.nama, d.email, d.nidn, d.is_active, d.created_at,
                        (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id) as roles
         FROM dosen d ORDER BY d.nama ASC`
            );
            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // CREATE DOSEN
    createDosen: async (req, res, next) => {
        const { email, password, nidn, nama, no_wa, roles } = req.body;

        try {
            const [existing] = await pool.query('SELECT id FROM dosen WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ message: 'Email sudah terdaftar' });
            }

            const { hashPassword } = await import('../utils/password.js');
            const password_hash = await hashPassword(password || 'password123');

            const [result] = await pool.query(
                `INSERT INTO dosen (email, password_hash, nidn, nama, no_wa) 
         VALUES (?, ?, ?, ?, ?)`,
                [email, password_hash, nidn, nama, no_wa || null]
            );

            const dosenId = result.insertId;

            // Add default 'dosen' role
            await pool.query(
                `INSERT INTO dosen_role (dosen_id, role_id)
                 SELECT ?, id FROM role WHERE nama_role = 'dosen'`,
                [dosenId]
            );

            // Add additional roles if specified
            if (roles && Array.isArray(roles)) {
                for (const roleName of roles) {
                    if (roleName !== 'dosen') {
                        await pool.query(
                            `INSERT IGNORE INTO dosen_role (dosen_id, role_id)
                             SELECT ?, id FROM role WHERE nama_role = ?`,
                            [dosenId, roleName]
                        );
                    }
                }
            }

            res.status(201).json({ message: 'Dosen berhasil ditambahkan', id: dosenId });
        } catch (err) {
            next(err);
        }
    },

    // GET ALL MAHASISWA  
    getAllMahasiswa: async (req, res, next) => {
        try {
            const [rows] = await pool.query(
                `SELECT m.id, m.nama, m.email, m.npm, m.angkatan, m.track, m.status_proposal,
                m.is_active, m.created_at, d.nama as dosen_nama
         FROM mahasiswa m
         LEFT JOIN dosen d ON m.dosen_id = d.id
         ORDER BY m.nama ASC`
            );
            res.json(rows);
        } catch (err) {
            next(err);
        }
    },

    // UPDATE USER STATUS
    updateUserStatus: async (req, res, next) => {
        const { id } = req.params;
        const { role, is_active } = req.body;

        try {
            let table = role === 'mahasiswa' ? 'mahasiswa' : 'dosen';
            await pool.query(`UPDATE ${table} SET is_active = ? WHERE id = ?`, [is_active, id]);
            res.json({ message: 'Status updated successfully' });
        } catch (err) {
            next(err);
        }
    },

    // DELETE USER
    deleteUser: async (req, res, next) => {
        const { id } = req.params;
        const { role } = req.body;

        try {
            let table = role === 'mahasiswa' ? 'mahasiswa' : 'dosen';
            await pool.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            next(err);
        }
    },

    // GET SYSTEM REPORT
    getSystemReport: async (req, res, next) => {
        try {
            const [[{ total_mahasiswa }]] = await pool.query('SELECT COUNT(*) as total_mahasiswa FROM mahasiswa');
            const [[{ total_dosen }]] = await pool.query('SELECT COUNT(*) as total_dosen FROM dosen');
            const [[{ total_bimbingan }]] = await pool.query('SELECT COUNT(*) as total_bimbingan FROM bimbingan');

            let total_sidang = 0;
            try {
                const [[result]] = await pool.query('SELECT COUNT(*) as total_sidang FROM sidang');
                total_sidang = result.total_sidang;
            } catch (e) { }

            res.json({
                total_mahasiswa,
                total_dosen,
                total_bimbingan,
                total_sidang,
                generated_at: new Date().toISOString()
            });
        } catch (err) {
            next(err);
        }
    }
};

export default adminController;
