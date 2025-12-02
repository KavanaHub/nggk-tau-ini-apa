import express from "express";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/role.js";
import { upload } from "../middleware/upload.js";
import pool from "../config/db.js";
import { uploadToGDrive } from "../utils/gdrive.js";

const router = express.Router();

// Upload proposal file
router.post(
  "/upload",
  auth,
  requireRole("mahasiswa"),
  upload.single("file"),
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

      const filename = `proposals/${mahasiswaId}/proposal-${Date.now()}.pdf`;
      const fileUrl = await uploadToGDrive(req.file, filename);

      // Update file_proposal di mahasiswa
      await pool.query(
        "UPDATE mahasiswa SET file_proposal = ? WHERE id = ?",
        [fileUrl, mahasiswaId]
      );

      res.json({
        message: "Proposal uploaded successfully",
        file_url: fileUrl,
      });
    } catch (err) {
      console.error("Upload proposal error:", err);
      res.status(500).json({ 
        message: "Internal server error",
        error: err.message || String(err)
      });
    }
  }
);

export default router;
