// routes/employeeRoutes.js
import express from "express";
import {
  createEmployee,
  getEmployeesByBusiness,
  getEmployeeById,
} from "../controllers/employeeController.js";

const router = express.Router();

// Create a new employee
router.post("/create", createEmployee);

// Get all employees for a business
router.get("/business/:businessId", getEmployeesByBusiness);

// Get single employee by ID
router.get("/:id", getEmployeeById);

export default router;
