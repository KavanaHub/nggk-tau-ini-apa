import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import bimbinganController from '../controllers/bimbinganController.js';
import { parseMultipart } from '../middleware/upload.js';
import { uploadToGCS } from '../utils/gcs.js';

const router = express.Router();

// Get detail bimbingan by ID
router.get('/:id', auth, bimbinganController.getBimbinganById);

// Upload file bimbingan
router.post(
  "/upload",
  auth,
  parseMultipart,
  async (req, res) => {
    try {
      const { mahasiswa_id, bimbingan_id } = req.body;

      // Allow direct Drive link submission (no upload)
      if (req.body.file_url) {
        const link = String(req.body.file_url).trim();
        return res.json({
          message: "Lampiran bimbingan link saved successfully",
          file_url: link,
        });
      }

      const filename = `bimbingan/${mahasiswa_id}/session-${bimbingan_id}-${Date.now()}.${req.file.originalname.split(".").pop()}`;

      const fileUrl = await uploadToGCS(req.file, filename);

      res.json({
        message: "Lampiran bimbingan uploaded successfully",
        file_url: fileUrl,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);

export default router;
