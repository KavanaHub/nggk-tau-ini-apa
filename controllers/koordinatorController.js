import pool from "../config/db.js";

const koordinatorController = {
  // LIST PROPOSAL PER TRACK (bisa dipakai di dashboard koordinator)
  listProposalsByTrack: async (req, res, next) => {
    const { track_id } = req.query;

    try {
      const [rows] = await pool.query(
        `
        SELECT p.id AS proposal_id,
                p.status,
                p.file_url,
                g.id AS group_id,
                g.title,
                t.name AS track_name
        FROM proposals p
        JOIN student_groups g ON p.group_id = g.id
        JOIN tracks t ON g.track_id = t.id
        WHERE g.track_id = ?
        `,
        [track_id]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // VALIDASI PROPOSAL (ACC / TOLAK)
  validateProposal: async (req, res, next) => {
    const { id } = req.params; // proposal id
    const { status, note } = req.body; // 'approved' / 'rejected'
    const userId = req.user.id;

    try {
      const [dosenRows] = await pool.query(
        "SELECT id FROM dosen WHERE user_id = ?",
        [userId]
      );
      if (dosenRows.length === 0) {
        return res
          .status(400)
          .json({ message: "Koordinator tidak terdaftar sebagai dosen" });
      }
      const dosenId = dosenRows[0].id;

      await pool.query(
        `
        UPDATE proposals
        SET status = ?, note = ?, validated_by = ?, validated_at = NOW()
        WHERE id = ?
        `,
        [status, note || null, dosenId, id]
      );

      res.json({ message: "Proposal updated" });
    } catch (err) {
      next(err);
    }
  },

  // KOORDINATOR MENG-ACC USULAN DOSBIM DARI MAHASISWA
  approveSupervisorRequests: async (req, res, next) => {
    const { id } = req.params; // proposal_id
    const { request_ids } = req.body; // array of id dari proposal_supervisor_requests

    if (!Array.isArray(request_ids) || request_ids.length === 0) {
      return res
        .status(400)
        .json({ message: "request_ids wajib diisi (array id usulan)" });
    }

    const userId = req.user.id;

    try {
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      // cari dosen_id koordinator dari user_id
      const [dosenRows] = await conn.query(
        "SELECT id FROM dosen WHERE user_id = ?",
        [userId]
      );
      if (dosenRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res
          .status(400)
          .json({ message: "Koordinator tidak terdaftar sebagai dosen" });
      }
      const koorDosenId = dosenRows[0].id;

      // ambil proposal untuk tahu group_id
      const [proposalRows] = await conn.query(
        "SELECT group_id FROM proposals WHERE id = ?",
        [id]
      );
      if (proposalRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(404).json({ message: "Proposal tidak ditemukan" });
      }
      const groupId = proposalRows[0].group_id;

      // ambil usulan dosbim yang dipilih koordinator
      const [requestRows] = await conn.query(
        `
        SELECT id, dosen_id, role
        FROM proposal_supervisor_requests
        WHERE proposal_id = ? AND id IN (?)
        `,
        [id, request_ids]
      );

      if (requestRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res
          .status(400)
          .json({
            message: "Tidak ada usulan dosbim yang cocok dengan request_ids",
          });
      }

      // insert ke supervisor_assignments (pembimbing resmi)
      for (const r of requestRows) {
        await conn.query(
          `
          INSERT INTO supervisor_assignments (group_id, dosen_id, role, assigned_by)
          VALUES (?, ?, ?, ?)
          `,
          [groupId, r.dosen_id, r.role, koorDosenId]
        );
      }

      await conn.commit();
      conn.release();

      res.json({
        message: "Dosen pembimbing berhasil di-ACC dari usulan mahasiswa",
      });
    } catch (err) {
      next(err);
    }
  },
};

export default koordinatorController;
