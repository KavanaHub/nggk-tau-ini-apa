import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import bimbinganController from '../controllers/bimbinganController.js';
import { upload } from '../middleware/upload.js';
import { uploadToGCS } from '../utils/gcs.js';

const router = express.Router();

router.post('/', auth, requireRole('mahasiswa'), bimbinganController.createSession);
router.patch('/:id/status', auth, requireRole('dosen'), bimbinganController.updateSessionStatus);
router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const { group_id, session_id } = req.body;
      const filename = `bimbingan/${group_id}/session-${session_id}-${Date.now()}.${req.file.originalname.split(".").pop()}`;

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
