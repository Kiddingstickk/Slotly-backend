// controllers/cityController.js
import City from "../models/City.js";
import Business from "../models/Business.js";
export const createCity = async (req, res) => {
  try {
    const { name, state, country } = req.body;

    const city = await City.create({ name, state, country });
    res.status(201).json(city);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getCities = async (req, res) => {
  try {
    const cities = await City.find({}).populate("businesses");
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};