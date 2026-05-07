import Booking from "../models/Booking.js";
import Customer from "../models/Customer.js";
import Review from "../models/Review.js";
import Business from "../models/Business.js";
import mongoose from "mongoose";

// Revenue summary (totals)
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    const bookings = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
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

// Revenue trend (daily breakdown)
export const getRevenueTrend = async (req, res) => {
  try {
    const { businessId } = req.params;

    const trend = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      {
        $group: {
          _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$booking_date" } } },
          value: { $sum: "$price" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);

    res.json(trend.map(t => ({ day: t._id.day, value: t.value })));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Revenue by category (accurate: service price × count)
export const getRevenueByCategory = async (req, res) => {
  try {
    const { businessId } = req.params;

    const byCategory = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      { $unwind: "$service_id" }, // assuming Booking stores service_id(s)
      {
        $lookup: {
          from: "businesses", // join with Business collection
          localField: "business_id",
          foreignField: "_id",
          as: "business"
        }
      },
      { $unwind: "$business" },
      { $unwind: "$business.services" },
      {
        $match: { $expr: { $eq: ["$service_id", "$business.services.name"] } }
        // adjust if Booking stores ObjectId instead of name
      },
      {
        $group: {
          _id: "$business.services.name",
          bookings: { $sum: 1 },
          revenue: { $sum: "$business.services.price" }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    res.json(byCategory.map(c => ({
      category: c._id,
      bookings: c.bookings,
      value: c.revenue
    })));
  } catch (error) {
    console.error("Error in getRevenueByCategory:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Payment methods (requires payment_method field in Booking)
export const getPaymentAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    const payments = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      {
        $group: {
          _id: "$payment_method",
          value: { $sum: "$price" },
        },
      },
    ]);

    res.json(payments.map(p => ({ name: p._id, value: p.value })));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Occupancy
export const getOccupancyAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date } = req.query;

    const bookedSlots = await Booking.countDocuments({ business_id: businessId, booking_date: date });
    const totalSlots = bookedSlots; // placeholder until availability slots are modeled

    const occupancy = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
    res.json({ occupancy });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Clients
export const getClientAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    const totalClients = await Customer.countDocuments({ business_id: businessId });
    const newClients = await Customer.countDocuments({
      business_id: businessId,
      createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
    });

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

// Reviews
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

// Top services (accurate: service price × count)
export const getTopServices = async (req, res) => {
  try {
    const { businessId } = req.params;

    const topServices = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      { $unwind: "$service_id" },
      {
        $lookup: {
          from: "businesses",
          localField: "business_id",
          foreignField: "_id",
          as: "business"
        }
      },
      { $unwind: "$business" },
      { $unwind: "$business.services" },
      {
        $match: { $expr: { $eq: ["$service_id", "$business.services.name"] } }
        // adjust if Booking stores ObjectId instead of name
      },
      {
        $group: {
          _id: "$business.services.name",
          bookings: { $sum: 1 },
          revenue: { $sum: "$business.services.price" }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    res.json(topServices.map(s => ({
      service: s._id,
      bookings: s.bookings,
      revenue: s.revenue
    })));
  } catch (error) {
    console.error("Error in getTopServices:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Employee analytics
export const getEmployeeAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { month } = req.query;

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
      { $group: { _id: "$employee_id", bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
    ]);

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Combined overview
export const getOverviewAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;

    const revenueRes = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      { $group: { _id: null, totalRevenue: { $sum: "$price" }, totalBookings: { $sum: 1 } } },
    ]);
    const revenue = revenueRes[0] || { totalRevenue: 0, totalBookings: 0 };

    const totalSlots = await Booking.countDocuments({ business_id: businessId });
    const bookedSlots = revenue.totalBookings;
    const occupancy = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

    const totalClients = await Customer.countDocuments({ business_id: businessId });
    const newClients = await Customer.countDocuments({
      business_id: businessId,
      createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
    });

    const reviews = await Review.find({ business_id: businessId });
    const avgRating = reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    const topServices = await Booking.aggregate([
      { $match: { business_id: new mongoose.Types.ObjectId(businessId) } },
      { $unwind: "$service_id" },
      { $group: { _id: "$service_id", bookings: { $sum: 1 }, revenue: { $sum: "$price" } } },
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

