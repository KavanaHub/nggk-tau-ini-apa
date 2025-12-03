import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";
import { parseMultipart } from "../middleware/upload.js";
import pool from "../config/db.js";
import { uploadToGCS } from "../utils/gcs.js";

const router = express.Router();

// Upload laporan sidang
router.post(
  "/upload",
  auth,
  requireRole("mahasiswa"),
  parseMultipart,
  async (req, res) => {
    try {
      const mahasiswaId = req.user.id;

      if (!req.file) {
        return res.status(400).json({ error: "Tidak ada file yang diupload" });
      }

      const ext = req.file.originalname.split(".").pop().toLowerCase();
      if (ext !== "pdf") {
        return res.status(400).json({ error: "Format file harus PDF" });
      }

      const filename = `reports/${mahasiswaId}/report-${Date.now()}.pdf`;
      const fileUrl = await uploadToGCS(req.file, filename);

      res.json({
        message: "Report uploaded successfully",
        file_url: fileUrl,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);

export default router;
