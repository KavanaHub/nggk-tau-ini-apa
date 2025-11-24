import express from "express";
import { upload } from "../middleware/upload.js";
import { uploadFileGCS } from "../utils/gcs.js";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { group_id } = req.body;
    const filename = `proposals/${group_id}/proposal-${Date.now()}.pdf`;

    const fileUrl = await uploadFileGCS(req.file, filename);

    res.json({
      message: "Proposal uploaded successfully",
      file_url: fileUrl,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
