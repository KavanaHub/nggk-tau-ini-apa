import pool from "../config/db.js";

const mahasiswaController = {
  // BUAT KELOMPOK (GROUP) UNTUK PROYEK / INTERNSHIP
  createGroup: async (req, res, next) => {
    const { track_id, title, anggota_ids } = req.body;
    // anggota_ids = array mahasiswa_id (1 atau 2)

    if (
      !track_id ||
      !title ||
      !Array.isArray(anggota_ids) ||
      anggota_ids.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "track_id, title, dan anggota_ids wajib diisi" });
    }

    try {
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      // cek track untuk tahu ini proyek atau internship
      const [trackRows] = await conn.query(
        "SELECT id, type FROM tracks WHERE id = ?",
        [track_id]
      );

      if (trackRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: "Track tidak ditemukan" });
      }

      const track = trackRows[0];
      const isInternship = track.type === "internship";

      // VALIDASI JUMLAH ANGGOTA
      if (isInternship) {
        // Internship: wajib 1 orang
        if (anggota_ids.length !== 1) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({
            message:
              "Untuk internship, kelompok harus terdiri dari tepat 1 mahasiswa",
          });
        }
      } else {
        // Proyek: boleh 1 atau 2 orang
        if (anggota_ids.length < 1 || anggota_ids.length > 2) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({
            message: "Untuk proyek, anggota minimal 1 dan maksimal 2 mahasiswa",
          });
        }
      }

      // (opsional) Pastikan pembuat request adalah salah satu anggota
      // req.user.id = user_id → cari mahasiswa_id
      const userId = req.user.id;
      const [mhsRows] = await conn.query(
        "SELECT id FROM mahasiswa WHERE user_id = ?",
        [userId]
      );

      if (mhsRows.length > 0) {
        const myMhsId = mhsRows[0].id;
        if (!anggota_ids.includes(myMhsId)) {
          await conn.rollback();
          conn.release();
          return res.status(403).json({
            message:
              "Mahasiswa pembuat kelompok harus menjadi salah satu anggota",
          });
        }
      }

      // INSERT KELOMPOK
      const [groupResult] = await conn.query(
        "INSERT INTO student_groups (track_id, title, is_internship) VALUES (?, ?, ?)",
        [track_id, title, isInternship ? 1 : 0]
      );
      const groupId = groupResult.insertId;

      // INSERT ANGGOTA
      for (let i = 0; i < anggota_ids.length; i++) {
        const mhsId = anggota_ids[i];
        await conn.query(
          "INSERT INTO group_members (group_id, mahasiswa_id, is_leader) VALUES (?, ?, ?)",
          [groupId, mhsId, i === 0 ? 1 : 0] // anggota pertama = ketua
        );
      }

      await conn.commit();
      conn.release();

      res.status(201).json({ message: "Group created", group_id: groupId });
    } catch (err) {
      next(err);
    }
  },

  // MAHASISWA SUBMIT PROPOSAL + USULAN DOSBIM
  submitProposal: async (req, res, next) => {
    const { group_id, file_url, proposed_supervisors } = req.body;
    // proposed_supervisors = [{ dosen_id, role }, ...]

    if (!group_id || !file_url) {
      return res
        .status(400)
        .json({ message: "group_id dan file_url wajib diisi" });
    }

    try {
      const conn = await pool.getConnection();
      await conn.beginTransaction();

      // Pastikan mahasiswa pemilik token adalah anggota group yang akan submit
      const userId = req.user.id;
      const [[mhsRow]] = await conn.query(
        "SELECT id FROM mahasiswa WHERE user_id = ?",
        [userId]
      );
      if (!mhsRow) {
        await conn.rollback();
        conn.release();
        return res.status(403).json({ message: "Mahasiswa tidak ditemukan" });
      }

      const mahasiswaId = mhsRow.id;
      const [[memberRow]] = await conn.query(
        "SELECT 1 FROM group_members WHERE group_id = ? AND mahasiswa_id = ?",
        [group_id, mahasiswaId]
      );
      if (!memberRow) {
        await conn.rollback();
        conn.release();
        return res.status(403).json({
          message: "Kamu bukan anggota group ini, tidak bisa submit proposal",
        });
      }

      // pastikan group ada
      const [groupRows] = await conn.query(
        "SELECT id FROM student_groups WHERE id = ?",
        [group_id]
      );
      if (groupRows.length === 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: "Group tidak ditemukan" });
      }

      // buat proposal
      const [result] = await conn.query(
        'INSERT INTO proposals (group_id, file_url, status) VALUES (?, ?, "submitted")',
        [group_id, file_url]
      );
      const proposalId = result.insertId;

      // simpan usulan dosen pembimbing (jika ada)
      if (
        Array.isArray(proposed_supervisors) &&
        proposed_supervisors.length > 0
      ) {
        for (const ps of proposed_supervisors) {
          if (!ps.dosen_id || !ps.role) continue; // skip yang tidak lengkap
          await conn.query(
            `
            INSERT INTO proposal_supervisor_requests (proposal_id, dosen_id, role)
            VALUES (?, ?, ?)
            `,
            [proposalId, ps.dosen_id, ps.role]
          );
        }
      }

      await conn.commit();
      conn.release();

      res.status(201).json({
        message: "Proposal submitted",
        proposal_id: proposalId,
      });
    } catch (err) {
      next(err);
    }
  },

  // MAHASISWA LIHAT PEMBIMBING RESMI YANG SUDAH DI-ACC KOORDINATOR
  getSupervisorsByGroup: async (req, res, next) => {
    const { group_id } = req.params;

    try {
      const [rows] = await pool.query(
        `
        SELECT sa.role, d.nama, d.no_wa
        FROM supervisor_assignments sa
        JOIN dosen d ON sa.dosen_id = d.id
        WHERE sa.group_id = ?
        `,
        [group_id]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
};

export default mahasiswaController;
