import Booking from "../models/Booking.js";
import Business from "../models/Business.js";
import Customer from "../models/Customer.js";
import Availability from "../models/Availability.js";  
import Employee from "../models/Employee.js";
import { generateSlots } from "./availabilityController.js";
import mongoose from "mongoose";


export const createBooking = async (req, res) => {
  try {
    const {
      business_id,
      employee_id,
      service_id, // can be string or array of names
      customer_id,
      booking_date,
      booking_time,
      notes,
    } = req.body;

    // Validate business
    const business = await Business.findById(business_id);
    if (!business) return res.status(400).json({ message: "Invalid business" });

    const employee = await Employee.findById(employee_id);
    if (!employee || employee.business_id.toString() !== business_id) {
      return res.status(400).json({ message: "Invalid employee for this business" });
    }

    // Normalize service_id into an array
    const serviceNames = Array.isArray(service_id) ? service_id : [service_id];

    // Validate services and calculate total price + total duration
    let totalPrice = 0;
    let totalDuration = 0;
    for (const serviceName of serviceNames) {
      const svc = business.services.find(s => s.name === serviceName);
      if (!svc) {
        return res.status(400).json({ message: `Invalid service: ${serviceName}` });
      }
      if (!employee.services.includes(serviceName)) {
        return res.status(400).json({ message: `Employee not authorized for service: ${serviceName}` });
      }
      totalPrice += svc.price;

      // parse duration string into minutes
      if (svc.duration) {
        const lower = svc.duration.toLowerCase();
        if (lower.includes("hour")) {
          const hours = parseInt(lower);
          totalDuration += hours * 60;
        } else {
          totalDuration += parseInt(lower);
        }
      }
    }

    const customer = await Customer.findById(customer_id);
    if (!customer) return res.status(400).json({ message: "Invalid customer" });

    // Get availability for that day
    const dayOfWeek = new Date(booking_date).toLocaleString("en-US", { weekday: "long" });
    const availability = await Availability.findOne({
      business_id,
      employee_id,
      day_of_week: dayOfWeek,
    });
    if (!availability) {
      return res.status(400).json({ message: "No availability for this day" });
    }

    const slotsNeeded = Math.ceil(totalDuration / availability.slot_duration);

    // Generate all slots for the day
    const slots = generateSlots(
      availability.start_time,
      availability.end_time,
      availability.slot_duration
    );

    // Find index of starting slot
    const startIndex = slots.indexOf(booking_time);
    if (startIndex === -1) {
      return res.status(400).json({ message: "Invalid booking time" });
    }

    // Collect required consecutive slots
    const requiredSlots = slots.slice(startIndex, startIndex + slotsNeeded);
    if (requiredSlots.length < slotsNeeded) {
      return res.status(400).json({ message: "Not enough consecutive slots available" });
    }

    // Check if any required slot is already booked
    const existingBookings = await Booking.find({
      business_id,
      employee_id,
      booking_date,
      booking_time: { $in: requiredSlots },
    });
    if (existingBookings.length > 0) {
      return res.status(400).json({ message: "One or more slots already booked" });
    }

    // Create booking
    const booking = await Booking.create({
      business_id,
      employee_id,
      service_id: serviceNames, // always stored as array
      customer_id,
      booking_date,
      booking_time,
      notes,
      price: totalPrice, // store final price
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all bookings for a business
export const getBookingsByBusiness = async (req, res) => {
  try {
    const bookings = await Booking.find({ business_id: req.params.businessId }).populate("customer_id", "name phone");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all bookings for a specific customer (by customer_id string)
export const getBookingsByCustomer = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer_id: req.params.customerId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update booking status (confirm/cancel/complete)
// controllers/bookingController.js
export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate business ownership
    const business = await Business.findById(booking.business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }
    if (business.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this booking" });
    }

    booking.status = req.body.status || booking.status;
    booking.payment_status = req.body.payment_status || booking.payment_status;
    await booking.save();

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// controllers/bookingController.js
export const rescheduleBooking = async (req, res) => {
  try {
    const { new_date, new_time } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate business ownership
    const business = await Business.findById(booking.business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }
    if (business.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to reschedule this booking" });
    }

    // Check availability for the new date
    const dayOfWeek = new Date(new_date).toLocaleString("en-US", { weekday: "long" });
    const availability = await Availability.findOne({
      business_id: booking.business_id,
      day_of_week: dayOfWeek,
    });
    if (!availability) {
      return res.status(400).json({ message: "No availability for this day" });
    }

    // Generate slots
    const slots = generateSlots(
      availability.start_time,
      availability.end_time,
      availability.slot_duration
    );

    if (!slots.includes(new_time)) {
      return res.status(400).json({ message: "Invalid new booking time" });
    }

    // Check if slot is already booked
    const existing = await Booking.findOne({
      business_id: booking.business_id,
      booking_date: new_date,
      booking_time: new_time,
    });
    if (existing) {
      return res.status(400).json({ message: "Slot already booked" });
    }

    // Update booking
    booking.booking_date = new_date;
    booking.booking_time = new_time;
    booking.status = "confirmed"; // reset status after reschedule
    await booking.save();

    res.json({ message: "Booking rescheduled", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// controllers/bookingController.js
export const updatePaymentStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate business ownership
    const business = await Business.findById(booking.business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }
    if (business.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update payment status for this booking" });
    }

    booking.payment_status = req.body.payment_status || booking.payment_status;
    await booking.save();

    res.json({ message: "Payment status updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// controllers/bookingController.js
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const business = await Business.findById(booking.business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }

    // Allow cancellation if:
    // 1. Owner of the business
    // 2. OR the customer who booked it
    const isOwner = business.user_id.toString() === req.user._id.toString();
    const isCustomer = booking.customer_id.toString() === req.user._id.toString();

    if (!isOwner && !isCustomer) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};























// Filter bookings by date range
export const getBookingsByDateRange = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

    const bookings = await Booking.find({
      business_id: businessId,
      booking_date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).populate("customer_id", "name phone");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Booking analytics (total bookings, revenue, occupancy)
export const getBookingAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { month } = req.query; // format: YYYY-MM

    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const analytics = await Booking.aggregate([
      {
        $match: {
          business_id: new mongoose.Types.ObjectId(businessId),
          booking_date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: "$price" }, // assuming price stored in booking
        },
      },
    ]);

    const result = analytics[0] || { totalBookings: 0, totalRevenue: 0 };

    // Occupancy: booked slots vs total slots
    const totalSlots = await Availability.countDocuments({ business_id: businessId });
    const bookedSlots = result.totalBookings;
    const occupancy = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

    res.json({ ...result, occupancy });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
