// routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import imagekit from "../config/imagekit.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await imagekit.upload({
      file: req.file.buffer, // file buffer
      fileName: req.file.originalname,
      folder: "uploads",
    });

    res.json({ url: result.url });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

export default router;