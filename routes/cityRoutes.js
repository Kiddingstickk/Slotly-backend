// routes/cityRoutes.js
import express from "express";
import { createCity, getCities } from "../controllers/cityController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/create", protect, createCity); // only logged-in users can add cities
router.get("/", getCities);

export default router;