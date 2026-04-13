// models/Availability.js
import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema(
  {
    business_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business", // link to the business
      required: true,
    },
    day_of_week: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    start_time: {
      type: String, // e.g. "09:00"
      required: true,
    },
    end_time: {
      type: String, // e.g. "17:00"
      required: true,
    },
    slot_duration: {
      type: Number, // in minutes (e.g. 30, 60)
      required: true,
    },
  },
  { timestamps: true }
);

const Availability = mongoose.model("Availability", availabilitySchema);

export default Availability;