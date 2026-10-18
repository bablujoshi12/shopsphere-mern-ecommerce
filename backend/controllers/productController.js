const Product = require("../model/Product");
const Category = require("../model/Category");
const Review = require("../model/Review");
const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const {
  deleteFromCloudinary,
  getPublicId,
} = require("../utils/deleteFromCloudinary");

// Create Product
const createProduct = wrapAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    discountPrice,
    costPrice,
    category,
    stock,
    brand,
    sku,
    specifications,
    isActive,
  } = req.body;

  const imagePaths = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer);
      imagePaths.push(result.secure_url);
    }
  }

  const categoryExists = await Category.findById(category);

  if (!categoryExists) {
    return next(new ExpressError(404, "Category not found"));
  }

  if (!categoryExists.isActive) {
    return next(new ExpressError(400, "Category is inactive"));
  }

  const product = new Product({
    name,
    description,
    price,
    discountPrice,
    costPrice,
    category,
    images: imagePaths,
    stock,
    brand,
    sku,
    specifications,
    isActive,
  });

  await product.save();

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
});

// Get All Products
const getAllProducts = wrapAsync(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    minRating,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  // Validate rating filter
  let numericRating;

  if (minRating !== undefined && minRating !== "") {
    numericRating = Number(minRating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }
  }

  // Active categories
  const activeCategories = await Category.find({
    isActive: true,
  }).distinct("_id");

  // Active products in active categories
  const filter = {
    isActive: true,
    category: { $in: activeCategories },
  };

  // Search Filter
  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  // Category Filter
  if (category) {
    const categoryData = await Category.findOne({
      name: { $regex: `^${category}$`, $options: "i" },
      isActive: true,
    });

    if (!categoryData) {
      return res.status(200).json({
        success: true,
        message: "No products found in this category",
        count: 0,
        totalProducts: 0,
        currentPage: 1,
        totalPages: 0,
        products: [],
      });
    }

    filter.category = categoryData._id;
  }

  // Price Filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined && minPrice !== "") {
      const minimum = Number(minPrice);

      if (!Number.isFinite(minimum) || minimum < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum price must be a valid non-negative number",
        });
      }

      filter.price.$gte = minimum;
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      const maximum = Number(maxPrice);

      if (!Number.isFinite(maximum) || maximum < 0) {
        return res.status(400).json({
          success: false,
          message: "Maximum price must be a valid non-negative number",
        });
      }

      filter.price.$lte = maximum;
    }

    if (
      filter.price.$gte !== undefined &&
      filter.price.$lte !== undefined &&
      filter.price.$gte > filter.price.$lte
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum price must be greater than minimum price",
      });
    }
  }

  // Get average ratings of approved reviews
  const ratingStats = await Review.aggregate([
    {
      $match: {
        status: "Approved",
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  // Create rating lookup map
  const ratingMap = new Map(
    ratingStats.map((item) => [
      item._id.toString(),
      {
        averageRating: Number(item.averageRating.toFixed(1)),
        reviewCount: item.reviewCount,
      },
    ]),
  );

  // Rating Filter
  if (numericRating !== undefined) {
    const ratedProductIds = ratingStats
      .filter((item) => item.averageRating >= numericRating)
      .map((item) => item._id);

    filter._id = {
      $in: ratedProductIds,
    };
  }

  // Sorting
  let sortOption = {};

  if (sort === "price_asc") {
    sortOption.price = 1;
  } else if (sort === "price_desc") {
    sortOption.price = -1;
  } else if (sort === "newest") {
    sortOption.createdAt = -1;
  }

  // Pagination
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const perPage = Math.max(1, Math.min(100, Number.parseInt(limit, 10) || 10));

  const skip = (currentPage - 1) * perPage;

  const totalProducts = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .populate("category", "name slug")
    .sort(sortOption)
    .skip(skip)
    .limit(perPage);

  // Attach rating information to every product
  const productsWithRatings = products.map((product) => {
    const productData = product.toObject();

    const stats = ratingMap.get(product._id.toString());

    return {
      ...productData,
      averageRating: stats?.averageRating ?? 0,
      reviewCount: stats?.reviewCount ?? 0,
    };
  });

  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    totalProducts,
    currentPage,
    totalPages: Math.ceil(totalProducts / perPage),
    count: productsWithRatings.length,
    products: productsWithRatings,
  });
});

// Get Single Product
const getSingleProducts = wrapAsync(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isActive: true,
  }).populate("category", "name slug isActive");

  if (!product) {
    return next(new ExpressError(404, "Product not found"));
  }

  if (!product.category || !product.category.isActive) {
    return next(new ExpressError(404, "Product not found"));
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    product,
  });
});

// Update Product
const updateProduct = wrapAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    discountPrice,
    costPrice,
    category,
    stock,
    brand,
    sku,
    specifications,
    isActive,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ExpressError(404, "Product not found"));
  }

  const newImagePaths = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer);
      newImagePaths.push(result.secure_url);
    }
  }

  product.images = [...product.images, ...newImagePaths];

  if (category !== undefined) {
    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
      return next(new ExpressError(404, "Category not found"));
    }

    if (!categoryExists.isActive) {
      return next(new ExpressError(400, "Category is inactive"));
    }
  }

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (discountPrice !== undefined) product.discountPrice = discountPrice;
  if (costPrice !== undefined) product.costPrice = costPrice;
  if (category !== undefined) product.category = category;
  if (stock !== undefined) product.stock = stock;
  if (brand !== undefined) product.brand = brand;
  if (sku !== undefined) product.sku = sku;
  if (specifications !== undefined) product.specifications = specifications;
  if (isActive !== undefined) product.isActive = isActive;

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

// Delete Product
const deleteProduct = wrapAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ExpressError(404, "Product not found"));
  }

  // Delete product images from Cloudinary
  for (const imageUrl of product.images) {
    const publicId = getPublicId(imageUrl);
    const result = await deleteFromCloudinary(publicId);

    if (result.result !== "ok") {
      return next(
        new ExpressError(500, "Failed to delete product image from Cloudinary"),
      );
    }
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product and its images deleted successfully",
  });
});

// Delete Specific Product Image
const deleteProductImage = wrapAsync(async (req, res, next) => {
  const { imageUrl } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ExpressError(404, "Product not found"));
  }

  if (!imageUrl) {
    return next(new ExpressError(400, "Image URL is required"));
  }

  if (!product.images.includes(imageUrl)) {
    return next(new ExpressError(404, "Image not found in this product"));
  }

  if (product.images.length <= 1) {
    return next(
      new ExpressError(
        400,
        "At least one product image is required. You cannot delete the last image.",
      ),
    );
  }

  const publicId = getPublicId(imageUrl);
  const result = await deleteFromCloudinary(publicId);

  if (result.result !== "ok") {
    return next(
      new ExpressError(500, "Failed to delete image from Cloudinary"),
    );
  }

  product.images = product.images.filter((image) => image !== imageUrl);

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product image deleted successfully",
    product,
  });
});

// Get All Products for Admin
const getAllProductsForAdmin = wrapAsync(async (req, res) => {
  const {
    search,
    category,
    status,
    stockStatus,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {};

  // Search by product name, SKU, or brand
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by category ID
  if (category) {
    filter.category = category;
  }

  // Active / inactive filter
  if (status === "active") {
    filter.isActive = true;
  } else if (status === "inactive") {
    filter.isActive = false;
  }

  // Stock filter
  if (stockStatus === "outOfStock") {
    filter.stock = 0;
  } else if (stockStatus === "lowStock") {
    filter.stock = { $gt: 0, $lte: 5 };
  } else if (stockStatus === "inStock") {
    filter.stock = { $gt: 5 };
  }

  // Sorting
  let sortOption = { createdAt: -1 };

  if (sort === "price_asc") {
    sortOption = { price: 1 };
  } else if (sort === "price_desc") {
    sortOption = { price: -1 };
  } else if (sort === "name_asc") {
    sortOption = { name: 1 };
  } else if (sort === "name_desc") {
    sortOption = { name: -1 };
  } else if (sort === "oldest") {
    sortOption = { createdAt: 1 };
  }

  // Pagination
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const perPage = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 10));

  const skip = (currentPage - 1) * perPage;

  const totalProducts = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .populate("category", "name")
    .sort(sortOption)
    .skip(skip)
    .limit(perPage);

  // Product statistics
  const [total, active, inactive, lowStock, outOfStock] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: false }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
    Product.countDocuments({ stock: 0 }),
  ]);

  res.status(200).json({
    success: true,
    message: "Admin products fetched successfully",
    totalProducts,
    currentPage,
    totalPages: Math.ceil(totalProducts / perPage),
    count: products.length,
    products,
    stats: {
      total,
      active,
      inactive,
      lowStock,
      outOfStock,
    },
  });
});

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProducts,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getAllProductsForAdmin,
};
