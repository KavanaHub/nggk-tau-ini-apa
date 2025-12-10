import express from "express";
import { parseMultipart } from "../middleware/upload.js";
import { uploadToGCS } from "../utils/gcs.js";
import authMiddleware from "../middleware/auth.js";
import pool from "../config/db.js";

const router = express.Router();

// Upload foto profil (untuk semua role)
router.post(
  "/upload",
  authMiddleware,
  parseMultipart,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      if (!req.file) {
        return res.status(400).json({ error: "Tidak ada file yang diupload" });
      }

      // Query nama dari database berdasarkan role
      let nama = "unknown";
      try {
        let rows;
        if (role === "mahasiswa") {
          [rows] = await pool.query("SELECT nama FROM mahasiswa WHERE id = ?", [userId]);
        } else if (role === "dosen" || role === "kaprodi") {
          [rows] = await pool.query("SELECT nama FROM dosen WHERE id = ?", [userId]);
        } else if (role === "koordinator") {
          [rows] = await pool.query("SELECT nama FROM koordinator WHERE id = ?", [userId]);
        } else if (role === "penguji") {
          [rows] = await pool.query("SELECT nama FROM penguji WHERE id = ?", [userId]);
        } else if (role === "admin") {
          nama = "admin";
        }
        if (rows && rows.length > 0) {
          nama = rows[0].nama;
        }
      } catch (dbErr) {
        console.log("Warning: Could not fetch nama:", dbErr.message);
      }

      // Sanitize nama untuk filename (hapus karakter spesial)
      const safeName = nama.replace(/[^a-zA-Z0-9]/g, "_");

      const ext = req.file.originalname.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png"];

      if (!allowed.includes(ext)) {
        return res.status(400).json({ error: "Format file tidak didukung. Gunakan JPG/PNG." });
      }

      const filename = `profile/${role}/${safeName}.${ext}`;
      const fileUrl = await uploadToGCS(req.file, filename);

      return res.json({
        message: "Foto profil berhasil diupload",
        file_url: fileUrl
      });
    } catch (err) {
      return res.status(500).json({ error: String(err) });
    }
  }
);

export default router;
