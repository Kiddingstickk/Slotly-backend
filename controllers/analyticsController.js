import Booking from "../models/Booking.js";
import Customer from "../models/Customer.js";
import Review from "../models/Review.js";
//import Service from "../models/Service.js";
import mongoose from "mongoose";

// Get revenue KPIs (daily, weekly, monthly, yearly)
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { range = "month" } = req.query; // default monthly

    const match = { business_id: new mongoose.Types.ObjectId(businessId) };

    const bookings = await Booking.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    res.json(bookings[0] || { totalRevenue: 0, totalBookings: 0 });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get occupancy (slots vs booked)
export const getOccupancyAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date } = req.query;

    const totalSlots = await Booking.countDocuments({ business_id: businessId, booking_date: date });
    // For simplicity, assume availability slots are precomputed
    const bookedSlots = await Booking.countDocuments({ business_id: businessId, booking_date: date });

    const occupancy = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

    res.json({ occupancy });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get client analytics (new, returning, total)
export const getClientAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    const totalClients = await Customer.countDocuments({ business_id: businessId });

    const newClients = await Customer.countDocuments({
      business_id: businessId,
      createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
    });

    // Returning clients = those with >1 booking
    const returningClients = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      { $group: { _id: "$customer_id", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "returning" },
    ]);

    res.json({
      totalClients,
      newClients,
      returningClients: returningClients[0]?.returning || 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get review analytics (average rating + distribution)
export const getReviewAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    const reviews = await Review.find({ business_id: businessId });

    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

    const distribution = [1, 2, 3, 4, 5].map(stars => ({
      stars,
      count: reviews.filter(r => r.rating === stars).length,
    }));

    res.json({ average: avg, total, distribution });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get top services by bookings
export const getTopServices = async (req, res) => {
  try {
    const { businessId } = req.params;

    const topServices = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      { $group: { _id: "$service_id", bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
    ]);

    res.json(topServices);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};






















// Employee analytics: bookings per employee
export const getEmployeeAnalytics = async (req, res) => {
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
          _id: "$employee_id",
          bookings: { $sum: 1 },
        },
      },
      { $sort: { bookings: -1 } },
    ]);

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Combined overview KPIs
export const getOverviewAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    // Revenue
    const revenueRes = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
          totalBookings: { $sum: 1 },
        },
      },
    ]);
    const revenue = revenueRes[0] || { totalRevenue: 0, totalBookings: 0 };

    // Occupancy
    const totalSlots = await Booking.countDocuments({ business_id: businessId });
    const bookedSlots = revenue.totalBookings;
    const occupancy = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

    // Clients
    const totalClients = await Customer.countDocuments({ business_id: businessId });
    const newClients = await Customer.countDocuments({
      business_id: businessId,
      createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
    });

    // Reviews
    const reviews = await Review.find({ business_id: businessId });
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    // Top services
    const topServices = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      { $group: { _id: "$service_id", bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
    ]);

    res.json({
      revenue,
      occupancy: { occupancy },
      clients: { totalClients, newClients },
      reviews: { average: avgRating, total: reviews.length },
      topServices,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

