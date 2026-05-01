import express from "express";
import {
  getRevenueAnalytics,
  getOccupancyAnalytics,
  getClientAnalytics,
  getReviewAnalytics,
  getTopServices,
  getEmployeeAnalytics,
  getOverviewAnalytics,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/:businessId/revenue", getRevenueAnalytics);
router.get("/:businessId/occupancy", getOccupancyAnalytics);
router.get("/:businessId/clients", getClientAnalytics);
router.get("/:businessId/reviews", getReviewAnalytics);
router.get("/:businessId/top-services", getTopServices);

// New routes
router.get("/:businessId/employees", getEmployeeAnalytics);
router.get("/:businessId/overview", getOverviewAnalytics);

export default router;
