// models/City.js
import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    businesses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Business", // businesses linked to this city
      },
    ],
  },
  { timestamps: true }
);

const City = mongoose.model("City", citySchema);

export default City;