import express from "express";
import { upload } from "../middlewares/upload.js";
import { uploadFileGCS } from "../utils/gcs.js";
import authMiddleware from "../middlewares/auth.js"; 

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "user_id wajib diisi" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Tidak ada file yang diupload" });
      }

      const ext = req.file.originalname.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png"];

      if (!allowed.includes(ext)) {
        return res.status(400).json({ error: "Format file tidak didukung. Gunakan JPG/PNG." });
      }

      const filename = `profile/${user_id}/avatar-${Date.now()}.${ext}`;

      const fileUrl = await uploadFileGCS(req.file, filename);

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
