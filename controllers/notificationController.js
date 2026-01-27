import pool from '../config/db.js';

const notificationController = {
    // GET NOTIFICATION STATS
    getStats: async (req, res, next) => {
        const { id, role } = req.user;
        let stats = {};

        try {
            if (role === 'dosen' || role === 'kaprodi' || role === 'koordinator') {
                const dosenId = id;

                // 1. DOSEN: Pending Bimbingan
                // Count where bimbingan is waiting/pending AND belongs to this dosen (as pembimbing 1 or 2)
                const [[{ pending_bimbingan }]] = await pool.query(
                    `SELECT COUNT(*) as pending_bimbingan 
           FROM bimbingan b
           JOIN mahasiswa m ON b.mahasiswa_id = m.id
           WHERE (m.dosen_id = ? OR m.dosen_id_2 = ?)
           AND b.status IN ('waiting', 'pending')`,
                    [dosenId, dosenId]
                );
                stats['mahasiswa-bimbingan'] = pending_bimbingan;

                // 2. DOSEN: Pending Laporan
                const [[{ pending_laporan }]] = await pool.query(
                    `SELECT COUNT(*) as pending_laporan
           FROM laporan_sidang ls
           JOIN mahasiswa m ON ls.mahasiswa_id = m.id
           WHERE (m.dosen_id = ? OR m.dosen_id_2 = ?)
           AND ls.status = 'submitted'`,
                    [dosenId, dosenId]
                );
                stats['laporan-approve'] = pending_laporan;
            }

            if (role === 'koordinator' || role === 'kaprodi') {
                // 3. KOORDINATOR: Pending Proposal Validation
                const [[{ pending_proposal }]] = await pool.query(
                    `SELECT COUNT(*) as pending_proposal FROM mahasiswa WHERE status_proposal = 'pending'`
                );
                stats['validasi-proposal'] = pending_proposal;

                // 4. KOORDINATOR: Menunggu Pembimbing (Approved but no dosen)
                const [[{ unassigned_dosen }]] = await pool.query(
                    `SELECT COUNT(*) as unassigned_dosen FROM mahasiswa WHERE status_proposal = 'approved' AND dosen_id IS NULL`
                );
                stats['approve-pembimbing'] = unassigned_dosen;
            }

            // 5. MAHASISWA: (Optional -maybe Revision Needed?)
            if (role === 'mahasiswa') {
                // Maybe count 'rejected' status as "Action Needed"
                // Proposal Rejected
                const [[{ proposal_revisi }]] = await pool.query(
                    `SELECT COUNT(*) as proposal_revisi FROM mahasiswa WHERE id = ? AND status_proposal = 'rejected'`,
                    [id]
                );
                if (proposal_revisi > 0) stats['proposal'] = 1;

                // Bimbingan Rejected (Action Needed: Fix and Re-submit) - might be too noisy if many
                // Laporan Rejected
                const [[{ laporan_revisi }]] = await pool.query(
                    `SELECT COUNT(*) as laporan_revisi FROM laporan_sidang WHERE mahasiswa_id = ? AND status = 'rejected'`,
                    [id]
                );
                if (laporan_revisi > 0) stats['laporan'] = 1;
            }

            res.json(stats);
        } catch (err) {
            next(err);
        }
    }
};

export default notificationController;
