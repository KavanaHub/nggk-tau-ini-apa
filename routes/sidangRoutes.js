import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import sidangController from '../controllers/sidangController.js';
import { upload } from '../middleware/upload.js';
import { uploadToGCS } from '../utils/gcs.js';

const router = express.Router();

// Get all sidang (public)
router.get('/', auth, sidangController.getAllSidang);

// Get nilai sidang
router.get('/:sidang_id/nilai', auth, sidangController.getNilaiSidang);

// Penguji input nilai
router.post('/nilai', auth, requireRole('penguji'), sidangController.inputNilai);

// Upload berkas sidang
router.post(
  "/upload",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      const { mahasiswa_id } = req.body;
      const filename = `sidang/${mahasiswa_id}/sidang-${Date.now()}.pdf`;

      const fileUrl = await uploadToGCS(req.file, filename);

      res.json({
        message: "Berkas sidang uploaded successfully",
        file_url: fileUrl,
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);

export default router;
