import Review from "../models/Review.js";
import Business from "../models/Business.js";

// Batch create reviews (up to 4)
export const createBatchReviews = async (req, res) => {
  try {
    const { business_id, reviews } = req.body;

    // Validate business
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(400).json({ message: "Invalid business" });
    }

    // Check existing reviews count
    const existingCount = await Review.countDocuments({ business_id });
    if (existingCount + reviews.length > 4) {
      return res.status(400).json({
        message: "Max 4 reviews allowed per business",
        existingCount,
      });
    }

    // Insert batch
    const created = await Review.insertMany(
      reviews.map((r) => ({ ...r, business_id }))
    );

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get reviews for a business (limit 4)
export const getReviewsByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const reviews = await Review.find({ business_id: businessId }).limit(4);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
