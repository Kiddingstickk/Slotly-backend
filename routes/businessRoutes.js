import express from "express";
import {  createBusiness, 
          getBusinesses, 
          getBusinessById , 
          uploadBusinessImage , 
          getBusinessByUserId , 
          updateBusiness,
          deleteBusiness,
          addServiceToBusiness,
          updateServiceInBusiness,
          deleteServiceFromBusiness,
          getServicesForBusiness,
          getServiceAnalytics,
} from "../controllers/businessController.js";
import { protect } from "../middleware/authmiddleware.js";
import multer from "multer";


const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Register a business (protected)
router.post(
    "/create",
    protect,
    upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "images", maxCount: 10 }
    ]),
    createBusiness
  );

// Fetch all businesses
router.get("/", getBusinesses);

router.get("/:id", getBusinessById);

router.post("/:businessId/upload", upload.single("image"), uploadBusinessImage);

router.get("/user/:userId", getBusinessByUserId);


// New routes
router.put("/:id", updateBusiness);
router.delete("/:id", deleteBusiness);


// Services inside Business
router.post("/:businessId/services", addServiceToBusiness);
router.put("/:businessId/services/:serviceName", updateServiceInBusiness);
router.delete("/:businessId/services/:serviceName", deleteServiceFromBusiness);
router.get("/:businessId/services", getServicesForBusiness);
router.get("/:businessId/services/analytics", getServiceAnalytics);


export default router;
