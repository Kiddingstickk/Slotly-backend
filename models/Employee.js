// models/Employee.js
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    business_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String, // stylist, therapist, etc.
    },
    phone: {
      type: String,
    },
    services: [
        {
          type: String, // store service name directly
        },
      ],
    },
    { timestamps: true }
  );
  
const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;