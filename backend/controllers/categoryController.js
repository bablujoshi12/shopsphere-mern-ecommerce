const mongoose = require("mongoose");
const Category = require("../model/Category");
const Product = require("../model/Product");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

const uploadToCloudinary = require("../utils/uploadToCloudinary");

const {
  deleteFromCloudinary,
  getPublicId,
} = require("../utils/deleteFromCloudinary");

// POST /api/category
// Create category with Cloudinary image upload
const createCategory = wrapAsync(async (req, res) => {
  const { name, slug, description, isActive } = req.body;

  // Validate required fields
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof slug !== "string" ||
    !slug.trim()
  ) {
    throw new ExpressError(400, "Category name and slug are required");
  }

  // Image required during category creation
  if (!req.file) {
    throw new ExpressError(400, "Category image is required");
  }

  // Validate status from FormData
  if (isActive !== undefined && !["true", "false"].includes(String(isActive))) {
    throw new ExpressError(400, "Invalid category status");
  }

  const categoryName = name.trim();
  const categorySlug = slug.trim().toLowerCase();

  // Check duplicate name or slug
  const existingCategory = await Category.findOne({
    $or: [{ name: categoryName }, { slug: categorySlug }],
  });

  if (existingCategory) {
    throw new ExpressError(409, "Category name or slug already exists");
  }

  // Upload image to Cloudinary
  const uploadedImage = await uploadToCloudinary(req.file.buffer);

  const category = await Category.create({
    name: categoryName,
    slug: categorySlug,
    description: typeof description === "string" ? description.trim() : "",
    image: uploadedImage.secure_url,
    isActive: isActive === undefined ? true : String(isActive) === "true",
  });

  return res.status(201).json({
    success: true,
    message: "Category successfully created",
    category,
  });
});

// GET /api/category
// GET /api/category/admin/all
// Get categories with product count
const getAllCategories = wrapAsync(async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: Product.collection.name,
        localField: "_id",
        foreignField: "category",
        as: "categoryProducts",
      },
    },
    {
      $addFields: {
        productCount: {
          $size: "$categoryProducts",
        },
      },
    },
    {
      $project: {
        categoryProducts: 0,
      },
    },
    {
      $sort: {
        name: 1,
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    count: categories.length,
    message: "Categories fetched successfully",
    categories,
  });
});

// GET /api/category/:id
// Get single category
const getCategoryById = wrapAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid category ID");
  }

  const categories = await Category.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: Product.collection.name,
        localField: "_id",
        foreignField: "category",
        as: "categoryProducts",
      },
    },
    {
      $addFields: {
        productCount: {
          $size: "$categoryProducts",
        },
      },
    },
    {
      $project: {
        categoryProducts: 0,
      },
    },
  ]);

  if (!categories.length) {
    throw new ExpressError(404, "Category not found");
  }

  return res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    category: categories[0],
  });
});

// PATCH /api/category/:id
// Update category with optional Cloudinary image upload
const updateCategory = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, isActive } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new ExpressError(404, "Category not found");
  }

  const updates = {};

  // Validate name
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      throw new ExpressError(400, "Valid category name is required");
    }

    updates.name = name.trim();
  }

  // Validate slug
  if (slug !== undefined) {
    if (typeof slug !== "string" || !slug.trim()) {
      throw new ExpressError(400, "Valid category slug is required");
    }

    updates.slug = slug.trim().toLowerCase();
  }

  // Validate description
  if (description !== undefined) {
    if (typeof description !== "string") {
      throw new ExpressError(400, "Description must be a string");
    }

    updates.description = description.trim();
  }

  // Validate active status from FormData
  if (isActive !== undefined) {
    if (!["true", "false"].includes(String(isActive))) {
      throw new ExpressError(400, "Invalid category status");
    }

    updates.isActive = String(isActive) === "true";
  }

  // Check duplicate name or slug
  const duplicateConditions = [];

  if (updates.name !== undefined) {
    duplicateConditions.push({
      name: updates.name,
    });
  }

  if (updates.slug !== undefined) {
    duplicateConditions.push({
      slug: updates.slug,
    });
  }

  if (duplicateConditions.length > 0) {
    const duplicateCategory = await Category.findOne({
      _id: { $ne: category._id },
      $or: duplicateConditions,
    });

    if (duplicateCategory) {
      throw new ExpressError(409, "Category name or slug already exists");
    }
  }

  // Upload new image if selected
  let oldImage = null;

  if (req.file) {
    const uploadedImage = await uploadToCloudinary(req.file.buffer);

    oldImage = category.image;
    updates.image = uploadedImage.secure_url;
  }

  Object.assign(category, updates);

  // Save database changes before deleting old image
  await category.save();

  // Delete previous Cloudinary image after successful save
  if (oldImage) {
    try {
      const publicId = getPublicId(oldImage);

      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    } catch (error) {
      console.error("Failed to delete old category image:", error.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Category updated successfully",
    category,
  });
});

// DELETE /api/category/:id
// Delete category and its Cloudinary image
const deleteCategory = wrapAsync(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError(400, "Invalid category ID");
  }

  const category = await Category.findById(id);

  if (!category) {
    throw new ExpressError(404, "Category not found");
  }

  // Prevent deletion if products use this category
  const productExists = await Product.exists({
    category: category._id,
  });

  if (productExists) {
    throw new ExpressError(
      409,
      "Cannot delete category because products are using it",
    );
  }

  // Delete image from Cloudinary first
  if (category.image) {
    const publicId = getPublicId(category.image);

    if (publicId) {
      const result = await deleteFromCloudinary(publicId);

      if (result.result !== "ok" && result.result !== "not found") {
        throw new ExpressError(
          500,
          "Failed to delete category image from Cloudinary",
        );
      }
    }
  }

  await Category.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Category and its image deleted successfully",
  });
});

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
