import Customer from "../models/Customer.js";

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

  