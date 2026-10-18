const Banner = require("../model/Banner");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const {
  deleteFromCloudinary,
  getPublicId,
} = require("../utils/deleteFromCloudinary");

// GET: Active banners for everyone
module.exports.getActiveBanners = wrapAsync(async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({
    displayOrder: 1,
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: banners.length,
    banners,
  });
});

// GET: All banners for admin
module.exports.getAllBanners = wrapAsync(async (req, res) => {
  const banners = await Banner.find().sort({
    displayOrder: 1,
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    count: banners.length,
    banners,
  });
});

// GET: Single banner for admin
module.exports.getBannerById = wrapAsync(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    throw new ExpressError(404, "Banner not found");
  }

  res.status(200).json({
    success: true,
    banner,
  });
});

// POST: Create banner with Cloudinary image upload
module.exports.createBanner = wrapAsync(async (req, res) => {
  const { title, description, link, isActive, displayOrder } = req.body;

  if (typeof title !== "string" || !title.trim()) {
    throw new ExpressError(400, "Title is required");
  }

  if (!req.file) {
    throw new ExpressError(400, "Banner image is required");
  }

  const order = displayOrder === undefined ? 0 : Number(displayOrder);

  if (!Number.isFinite(order) || order < 0) {
    throw new ExpressError(400, "Invalid display order");
  }

  if (isActive !== undefined && !["true", "false"].includes(String(isActive))) {
    throw new ExpressError(400, "Invalid banner status");
  }

  const uploadedImage = await uploadToCloudinary(req.file.buffer);

  const banner = await Banner.create({
    title: title.trim(),
    description,
    image: uploadedImage.secure_url,
    link,
    isActive: isActive === undefined ? true : String(isActive) === "true",
    displayOrder: order,
  });

  res.status(201).json({
    success: true,
    message: "Banner created successfully",
    banner,
  });
});

// PATCH: Update banner with optional image upload
module.exports.updateBanner = wrapAsync(async (req, res) => {
  const { title, description, link, isActive, displayOrder } = req.body;

  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    throw new ExpressError(404, "Banner not found");
  }

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      throw new ExpressError(400, "Title cannot be empty");
    }

    banner.title = title.trim();
  }

  if (description !== undefined) banner.description = description;
  if (link !== undefined) banner.link = link;

  if (isActive !== undefined) {
    if (!["true", "false"].includes(String(isActive))) {
      throw new ExpressError(400, "Invalid banner status");
    }

    banner.isActive = String(isActive) === "true";
  }

  if (displayOrder !== undefined) {
    const order = Number(displayOrder);

    if (!Number.isFinite(order) || order < 0) {
      throw new ExpressError(400, "Invalid display order");
    }

    banner.displayOrder = order;
  }

  if (req.file) {
    const uploadedImage = await uploadToCloudinary(req.file.buffer);
    const oldImage = banner.image;

    banner.image = uploadedImage.secure_url;

    await banner.save();

    // Delete old Cloudinary image after successful database save
    if (oldImage) {
      try {
        const publicId = getPublicId(oldImage);

        if (publicId) {
          await deleteFromCloudinary(publicId);
        }
      } catch (error) {
        console.error("Failed to delete old banner image:", error.message);
      }
    }
  } else {
    await banner.save();
  }

  res.status(200).json({
    success: true,
    message: "Banner updated successfully",
    banner,
  });
});

// PATCH: Activate or deactivate banner
module.exports.toggleBannerStatus = wrapAsync(async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw new ExpressError(400, "isActive must be true or false");
  }

  const banner = await Banner.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive } },
    { new: true, runValidators: true },
  );

  if (!banner) {
    throw new ExpressError(404, "Banner not found");
  }

  res.status(200).json({
    success: true,
    message: `Banner ${isActive ? "activated" : "deactivated"} successfully`,
    banner,
  });
});

// DELETE: Delete banner and its Cloudinary image
module.exports.deleteBanner = wrapAsync(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    throw new ExpressError(404, "Banner not found");
  }

  if (banner.image) {
    const publicId = getPublicId(banner.image);

    if (publicId) {
      const result = await deleteFromCloudinary(publicId);

      if (result.result !== "ok" && result.result !== "not found") {
        throw new ExpressError(
          500,
          "Failed to delete banner image from Cloudinary",
        );
      }
    }
  }

  await Banner.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Banner and its image deleted successfully",
  });
});
