import express from "express";
import {
  createBooking,
  getBookingsByBusiness,
  getBookingsByCustomer,
  updateBookingStatus,
  rescheduleBooking,
  updatePaymentStatus,
  cancelBooking,
  getBookingsByDateRange,
  getBookingAnalytics,
} from "../controllers/bookingController.js";

import { protect } from "../middleware/authmiddleware.js";


const router = express.Router();

// Create booking
router.post("/create", createBooking);

// Get bookings for a business
router.get("/business/:businessId", getBookingsByBusiness);

// Get bookings for a customer (by customer_id string)
router.get("/customer/:customerId", getBookingsByCustomer);

// Update booking status (owner only)
router.put("/:id/status", protect, updateBookingStatus);

// Reschedule booking (owner only)
router.put("/:id/reschedule", protect, rescheduleBooking);

router.put("/:id/payment", protect, updatePaymentStatus);

router.put("/:id/cancel", protect, cancelBooking);



router.get("/business/:businessId/date-range", getBookingsByDateRange);
router.get("/business/:businessId/analytics", getBookingAnalytics);

export default router;