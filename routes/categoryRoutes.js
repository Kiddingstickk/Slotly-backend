// routes/categoryRoutes.js
import express from "express";
import { seedCategories, getCategories } from "../controllers/categoryController.js";

const router = express.Router();

router.post("/seed", seedCategories);   // run once to insert fixed categories
router.get("/", getCategories);         // fetch all categories

export default router;