// controllers/availabilityController.js
import Availability from "../models/Availability.js";
import Business from "../models/Business.js";
import Booking from "../models/Booking.js";
import Employee from "../models/Employee.js";
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
    const { business_id, employee_id, day_of_week, start_time, end_time, slot_duration } = req.body;

    // Validate business
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }

    const employee = await Employee.findById(employee_id);
    if (!employee || employee.business_id.toString() !== business_id) {
      return res.status(400).json({ message: "Invalid employee for this business" });
    }

    const availability = await Availability.create({
      business_id,
      employee_id,
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
    const { employeeId } = req.query;

    const filter = { business_id: businessId };
    if (employeeId) filter.employee_id = employeeId;

    const availability = await Availability.find(filter);
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


// Get slots for a specific employee
export const getAvailabilitySlots = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { employeeId, day, date } = req.query;

    const availability = await Availability.findOne({
      business_id: businessId,
      employee_id: employeeId,
      day_of_week: day,
    });

    if (!availability) {
      return res.json({ slots: [] });
    }

    // Generate slots
    const slots = generateSlots(
      availability.start_time,
      availability.end_time,
      availability.slot_duration
    );

    // Check bookings for that employee
    const selectedDate = new Date(date);
    const booked = await Booking.find({
      business_id: businessId,
      employee_id: employeeId,
      booking_date: {
        $gte: startOfDay(selectedDate),
        $lte: endOfDay(selectedDate),
      },
    }).select("booking_time");

    const bookedTimes = booked.map(b => b.booking_time);

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



export const createBatchAvailability = async (req, res) => {
  try {
    const { business_id, availability } = req.body;
    // availability = [{ day_of_week, start_time, end_time, slot_duration }]

    // Validate business
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }

    // Fetch all employees for this business
    const employees = await Employee.find({ business_id });
    if (!employees.length) {
      return res.status(400).json({ message: "No employees found for this business" });
    }

    // Build availability records for each employee
    const records = [];
    for (const emp of employees) {
      for (const day of availability) {
        records.push({
          business_id,
          employee_id: emp._id,
          day_of_week: day.day_of_week,
          start_time: day.start_time,
          end_time: day.end_time,
          slot_duration: day.slot_duration,
        });
      }
    }

    // Insert all in one go
    const saved = await Availability.insertMany(records);

    res.status(201).json({ message: "Availability created for all employees", data: saved });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
























// Update availability by ID
export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const availability = await Availability.findById(id);
    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    Object.assign(availability, updates);
    await availability.save();

    res.json({ message: "Availability updated", availability });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete availability by ID
export const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const availability = await Availability.findById(id);
    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }

    await availability.deleteOne();
    res.json({ message: "Availability deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
