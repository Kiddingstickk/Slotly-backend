// testCloudinary.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

console.log("CLOUDINARY_URL:", process.env.CLOUDINARY_URL);

cloudinary.config({ secure: true });

console.log("Cloudinary config check:", cloudinary.config());