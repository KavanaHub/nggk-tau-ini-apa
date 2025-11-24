import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import sidangController from '../controllers/sidangController.js';

const router = express.Router();

// mahasiswa upload laporan
router.post(
  '/reports',
  auth,
  requireRole('mahasiswa'),
  sidangController.submitReport
);

// dosen pembimbing approve / reject laporan
router.patch(
  '/reports/:id/approve',
  auth,
  requireRole('dosen'),
  sidangController.approveReport
);

// dosen pembimbing/penguji input nilai sidang
router.post(
  '/grades',
  auth,
  requireRole('dosen'),
  sidangController.inputGrade
);

router.post(
  "/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const { group_id } = req.body;
      const filename = `sidang/${group_id}/sidang-${Date.now()}.pdf`;

      const fileUrl = await uploadFileGCS(req.file, filename);

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
