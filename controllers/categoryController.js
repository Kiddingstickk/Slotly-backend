// controllers/categoryController.js
import Category from "../models/Category.js";
import Business from "../models/Business.js";
// Seed fixed categories (run once)
export const seedCategories = async (req, res) => {
  try {
    const fixedCategories = ["Hair", "Nails", "Lashes", "Tattoos"];

    const existing = await Category.find({});
    if (existing.length > 0) {
      return res.status(400).json({ message: "Categories already seeded" });
    }

    const categories = await Category.insertMany(
      fixedCategories.map((name) => ({ name }))
    );

    res.status(201).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Fetch all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).populate("businesses");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};