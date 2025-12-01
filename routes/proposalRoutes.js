import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";
import { upload } from "../middleware/upload.js";
import pool from "../config/db.js";
import { uploadToGCS } from "../utils/gcs.js";

const router = express.Router();

// Pastikan mahasiswa yang upload adalah anggota group yang bersangkutan
async function ensureGroupMember(req, res, next) {
  const { group_id } = req.body;

  if (!group_id) {
    return res.status(400).json({ message: "group_id wajib diisi" });
  }

  try {
    const [[mhsRow]] = await pool.query(
      "SELECT id FROM mahasiswa WHERE user_id = ?",
      [req.user.id]
    );
    if (!mhsRow) {
      return res.status(403).json({ message: "Mahasiswa tidak ditemukan" });
    }

    const [[memberRow]] = await pool.query(
      "SELECT 1 FROM group_members WHERE group_id = ? AND mahasiswa_id = ?",
      [group_id, mhsRow.id]
    );

    if (!memberRow) {
      return res
        .status(403)
        .json({ message: "Kamu bukan anggota group ini" });
    }

    next();
  } catch (err) {
    next(err);
  }
}

router.post(
  "/upload",
  auth,
  requireRole("mahasiswa"),
  upload.single("file"),
  ensureGroupMember,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File wajib diunggah" });
      }

      const isPdf =
        req.file.mimetype === "application/pdf" ||
        req.file.originalname?.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        return res.status(400).json({ message: "File harus berformat PDF" });
      }

      const { group_id } = req.body;
      const filename = `proposals/${group_id}/proposal-${Date.now()}.pdf`;

      const fileUrl = await uploadToGCS(req.file, filename);

      res.json({
        message: "Proposal uploaded successfully",
        file_url: fileUrl,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);

export default router;
