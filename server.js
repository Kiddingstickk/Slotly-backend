import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
// Load env vars BEFORE importing cloudinary
dotenv.config();

import cloudinary from "./config/cloudinary.js";

const app = express();

// Middleware
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: "https://slotlyy.netlify.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());


// Routes
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/test", testRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);

// Connect Database
connectDB();

// Simple test route
app.get("/api/ping", (req, res) => {
  res.json({ message: "Slotly backend is alive!" });
});


app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));