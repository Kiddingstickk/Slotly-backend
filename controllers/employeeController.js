// controllers/employeeController.js
import Employee from "../models/Employee.js";
import Business from "../models/Business.js";

// Create a new employee
export const createEmployee = async (req, res) => {
  try {
    const { business_id, name, role, phone, services } = req.body;

    // Validate business
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }

    // Validate services against business pool
    const businessServiceNames = business.services.map(s => s.name);
    const invalidServices = services.filter(s => !businessServiceNames.includes(s));
    if (invalidServices.length > 0) {
      return res.status(400).json({
        message: "Invalid services for this business",
        invalid: invalidServices,
      });
    }

    // Create employee
    const employee = await Employee.create({
      business_id,
      name,
      role,
      phone,
      services,
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all employees for a business
export const getEmployeesByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const employees = await Employee.find({ business_id: businessId });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
