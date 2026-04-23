// routes/availabilityRoutes.js
import express from "express";
import {
  createAvailability,
  getAvailabilityByBusiness,
  getAvailabilityById,
  getAvailabilitySlots,
  createWeeklyAvailability,
  createBatchAvailability
} from "../controllers/availabilityController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

// Create availability (protected)
router.post("/create", protect, createAvailability);

// Get all availability for a business
router.get("/business/:businessId", getAvailabilityByBusiness);

router.get("/business/:businessId/slots", getAvailabilitySlots);

// Get single availability by ID
router.get("/:id", getAvailabilityById);

// routes/availabilityRoutes.js
router.post("/batch", protect, createBatchAvailability);


export default router;