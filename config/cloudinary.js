import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config(); // make sure .env is loaded
console.log("Cloudinary ENV URL:", process.env.CLOUDINARY_URL);
cloudinary.config({
  secure: true, // optional, ensures https URLs
});

export default cloudinary;