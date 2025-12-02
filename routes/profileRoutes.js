import express from "express";
import { upload } from "../middleware/upload.js";
import { uploadToGDrive } from "../utils/gdrive.js";
import authMiddleware from "../middleware/auth.js"; 

const router = express.Router();

// Upload foto profil (untuk semua role)
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      if (!req.file) {
        return res.status(400).json({ error: "Tidak ada file yang diupload" });
      }

      const ext = req.file.originalname.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png"];

      if (!allowed.includes(ext)) {
        return res.status(400).json({ error: "Format file tidak didukung. Gunakan JPG/PNG." });
      }

      const filename = `profile/${role}/${userId}/avatar-${Date.now()}.${ext}`;
      const fileUrl = await uploadToGDrive(req.file, filename);

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
