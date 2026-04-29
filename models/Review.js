import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    business_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    author: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    body: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Review", reviewSchema);
