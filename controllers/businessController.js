// controllers/businessController.js
import Booking from "../models/Booking.js";
import Business from "../models/Business.js";
import Category from "../models/Category.js";
import City from "../models/City.js";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";


export const createBusiness = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const {
      name,
      category_id,
      bio,
      phone,
      whatsapp,
      instagram_url,
      address,
      city_id,
    } = req.body;

    // Parse services (stringified JSON array)
    // Accept services directly (array or stringified JSON)
    let services = [];
    if (req.body.services) {
      if (typeof req.body.services === "string") {
        try {
          services = JSON.parse(req.body.services);
        } catch (err) {
          console.error("Failed to parse services:", err);
          services = [];
        }
      } else {
        services = req.body.services; // already an array
      }
    }

    // Validate category
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Validate city
    const city = await City.findById(city_id);
    if (!city) {
      return res.status(400).json({ message: "Invalid city" });
    }

    // Handle logo upload if provided

    let logoUrl = req.body.logo || null;
    if (req.files?.logo) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "business_logos" },
          (error, uploaded) => (error ? reject(error) : resolve(uploaded))
        );
        stream.end(req.files.logo[0].buffer);
      });
      logoUrl = result.secure_url;
    }

    let heroImageUrl = req.body.heroImage || null;
if (req.files?.heroImage) {
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "business_hero_images" },
      (error, uploaded) => (error ? reject(error) : resolve(uploaded))
    );
    stream.end(req.files.heroImage[0].buffer);
  });
  heroImageUrl = result.secure_url;
}

    // Handle gallery images: either from payload or uploaded files
    let imageUrls = Array.isArray(req.body.images) ? req.body.images : [];
    if (req.files?.images) {
      for (const file of req.files.images) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "business_images" },
            (error, uploaded) => (error ? reject(error) : resolve(uploaded))
          );
          stream.end(file.buffer);
        });
        imageUrls.push(result.secure_url);
      }
    }

    // Create business
    const business = await Business.create({
      name,
      category_id,
      bio,
      phone,
      whatsapp,
      instagram_url,
      logo: logoUrl,
      address,
      city_id,
      user_id: req.user._id,
      services,
      images: imageUrls,
      heroImage: heroImageUrl,
    });

    // Link business to category + city
    category.business_id = category.business_id || [];
    category.business_id.push(business._id);
    await category.save();

    city.business_id = city.business_id || [];
    city.business_id.push(business._id);
    await city.save();

    // Reverse populate: link business to user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.business_id = user.business_id || [];
    user.business_id.push(business._id);
    await user.save();

    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getBusinesses = async (req, res) => {
  try {
    const businesses = await Business.find({})
      .populate("category_id")
      .populate("city_id")
      .populate("user_id", "-password");

    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get single business by ID
export const getBusinessById = async (req, res) => {
    try {
      const business = await Business.findById(req.params.id)
        .populate("category_id")
        .populate("city_id")
        .populate("user_id", "-password");
  
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
  
      res.json(business);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  


export const uploadBusinessImage = async (req, res) => {
  try {
    const { businessId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "business_images",
    });

    // Save URL in business model
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    business.images = business.images || [];
    business.images.push(result.secure_url);
    await business.save();

    res.json({ message: "Image uploaded successfully", url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getBusinessByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user and populate their business_id field
    const user = await User.findById(userId).populate({
      path: "business_id",
      populate: [
        { path: "category_id" },
        { path: "city_id" },
        { path: "user_id", select: "-password" },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the businesses array (could be empty if none registered yet)
    res.json({ businesses: user.business_id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};













// Add a new service to a business
export const addServiceToBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { name, price, duration, description } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    business.services.push({ name, price, duration, description });
    await business.save();

    res.status(201).json({ message: "Service added", services: business.services });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a service inside a business
export const updateServiceInBusiness = async (req, res) => {
  try {
    const { businessId, serviceName } = req.params; // identify service by name
    const updates = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const service = business.services.find(s => s.name === serviceName);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    Object.assign(service, updates);
    await business.save();

    res.json({ message: "Service updated", service });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a service from a business
export const deleteServiceFromBusiness = async (req, res) => {
  try {
    const { businessId, serviceName } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    business.services = business.services.filter(s => s.name !== serviceName);
    await business.save();

    res.json({ message: "Service deleted", services: business.services });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all services for a business
export const getServicesForBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json(business.services);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Analytics: monthly bookings per service
export const getServiceAnalytics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { month } = req.query; // format: YYYY-MM

    const start = new Date(`${month}-01`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    // Get bookings grouped by service_id (which is stored as service name)
    const analytics = await Booking.aggregate([
      {
        $match: {
          business_id: new mongoose.Types.ObjectId(businessId),
          booking_date: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$service_id", // service name
          bookings: { $sum: 1 },
        },
      },
      { $sort: { bookings: -1 } },
    ]);

    // Fetch business services to enrich analytics with price/duration
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const enriched = analytics.map(a => {
      const svc = business.services.find(s => s.name === a._id);
      return {
        service: a._id,
        bookings: a.bookings,
        price: svc?.price || null,
        duration: svc?.duration || null,
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
























// Update business info
export const updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    Object.assign(business, updates);
    await business.save();

    res.json({ message: "Business updated", business });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete business
export const deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    const business = await Business.findById(id);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    // Unlink from category
    await Category.updateOne(
      { _id: business.category_id },
      { $pull: { business_id: business._id } }
    );

    // Unlink from city
    await City.updateOne(
      { _id: business.city_id },
      { $pull: { business_id: business._id } }
    );

    // Unlink from user
    await User.updateOne(
      { _id: business.user_id },
      { $pull: { business_id: business._id } }
    );

    await business.deleteOne();

    res.json({ message: "Business deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
