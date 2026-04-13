import express from "express";
import { createBusiness, getBusinesses, getBusinessById , uploadBusinessImage , getBusinessByUserId} from "../controllers/businessController.js";
import { protect } from "../middleware/authmiddleware.js";
import multer from "multer";


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Register a business (protected)
router.post(
    "/create",
    protect,
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "images", maxCount: 10 }
    ]),
    createBusiness
  );

// Fetch all businesses
router.get("/", getBusinesses);

router.get("/:id", getBusinessById);

router.post("/:businessId/upload", upload.single("image"), uploadBusinessImage);

router.get("/user/:userId", getBusinessByUserId);

export default router;
