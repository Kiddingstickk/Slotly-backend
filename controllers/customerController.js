import Customer from "../models/Customer.js";
import Booking from "../models/Booking.js";

export const registerCustomer = async (req, res) => {
    try {
      const { name, phone } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }
  
      const existing = await Customer.findOne({ phone });
      if (existing) {
        return res.status(400).json({ message: "Customer already registered" });
      }
  
      const customer = new Customer({ name, phone });
      await customer.save();
      res.status(201).json({ message: "Customer registered", customer });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err });
    }
  };
  

export const loginCustomer = async (req, res) => {
try {
    const { name, phone } = req.body;
    if (!name || !phone) {
    return res.status(400).json({ message: "Name and phone are required" });
    }

    const customer = await Customer.findOne({ name, phone });
    if (!customer) {
    return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ message: "Login successful", customer });
} catch (err) {
    res.status(500).json({ message: "Server error", error: err });
}
};

  





















export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    Object.assign(customer, updates);
    await customer.save();

    res.json({ message: "Customer updated", customer });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await customer.deleteOne();
    res.json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all customers for a business
export const getCustomersByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const customers = await Customer.find({ business_id: businessId });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Analytics: total, new, returning clients
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
