// controllers/availabilityController.js
import Availability from "../models/Availability.js";
import Business from "../models/Business.js";
import Booking from "../models/Booking.js";
import { startOfDay, endOfDay } from "date-fns";



export function generateSlots(startTime, endTime, slotDuration) {
  const slots = [];
  let [startHour, startMin] = startTime.split(":").map(Number);
  let [endHour, endMin] = endTime.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMin, 0, 0);

  let end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  while (current < end) {
    const hh = String(current.getHours()).padStart(2, "0");
    const mm = String(current.getMinutes()).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    current.setMinutes(current.getMinutes() + slotDuration);
  }

  return slots;
}




// Create availability for a business
export const createAvailability = async (req, res) => {
  try {
    const { business_id, day_of_week, start_time, end_time, slot_duration } = req.body;

    // Validate business
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }

    const availability = await Availability.create({
      business_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration,
    });

    res.status(201).json(availability);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all availability for a business
export const getAvailabilityByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    const availability = await Availability.find({ business_id: businessId });
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single availability slot by ID
export const getAvailabilityById = async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getAvailabilitySlots = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { day, date } = req.query; // day = "Monday", date = "2026-03-09"

    const availability = await Availability.findOne({
      business_id: businessId,
      day_of_week: day,
    });

    if (!availability) {
      return res.json({ slots: [] });
    }

    // Generate all slots
    const slots = generateSlots(
      availability.start_time,
      availability.end_time,
      availability.slot_duration
    );

    // If booking_date is a Date in your model:
    const selectedDate = new Date(date); // frontend must pass ?date=YYYY-MM-DD
    const booked = await Booking.find({
      business_id: businessId,
      booking_date: {
        $gte: startOfDay(selectedDate),
        $lte: endOfDay(selectedDate),
      },
    }).select("booking_time");

    const bookedTimes = booked.map(b => b.booking_time);

    // Return slots with booked flag
    const result = slots.map(s => ({
      time: s,
      booked: bookedTimes.includes(s),
    }));

    res.json({ slots: result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const createWeeklyAvailability = async (req, res) => {
  try {
    const { business_id, availability } = req.body;

    // Validate business
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }

    // Check ownership
    if (business.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to set availability for this business" });
    }
    

    // Validate payload
    if (!Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({ message: "Availability array required" });
    }

    // Insert all records in one go
    const records = availability.map((a) => ({
      business_id,
      day_of_week: a.day_of_week,
      start_time: a.start_time,
      end_time: a.end_time,
      slot_duration: a.slot_duration,
    }));

    const created = await Availability.insertMany(records);

    res.status(201).json({ message: "Availability created", availability: created });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};