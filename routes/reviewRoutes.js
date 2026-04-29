import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import {
  createBatchReviews,
  getReviewsByBusiness,
} from "../controllers/reviewController.js";

const router = express.Router();

// Batch create reviews
router.post("/batch", protect , createBatchReviews);

// Get reviews for a business
router.get("/business/:businessId", protect , getReviewsByBusiness);

export default router;
