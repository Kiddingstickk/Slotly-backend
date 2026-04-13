import multer from "multer";

const storage = multer.memoryStorage(); // keep files in memory
const upload = multer({ storage });

export default upload;