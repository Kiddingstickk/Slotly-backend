// models/Business.js
import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },   
    price: { type: Number, required: true },  
    duration: { type: String },               
    description: { type: String },            
  },
  { _id: false } 
);

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", 
      required: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    whatsapp: {
      type: String,
    },
    instagram_url: {
      type: String,
    },
    logo: {
      type: String, 
    },
    images: [
      String
    ],
    heroImage: [
      String
    ],
    address: {
      type: String,
      required: true,
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City", 
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    services: [serviceSchema], 
  },
  { timestamps: true }
);

const Business = mongoose.model("Business", businessSchema);

export default Business;