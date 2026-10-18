const wrapAsync = require("../utils/wrapAsync");
const ExpressError = require("../utils/ExpressError");

const Wishlist = require("../model/Wishlist");
const Product = require("../model/Product");

// Get Logged-in User's Wishlist
const getWishlist = wrapAsync(async (req, res, next) => {
  const userId = req.user._id;

  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "products",
    match: { isActive: true },
    select: "name description price discountPrice images brand stock isActive",
  });

  return res.status(200).json({
    success: true,
    message: "Wishlist fetched successfully",
    wishlist: wishlist || { products: [] },
  });
});

// Add Product to Wishlist
const addToWishlist = wrapAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    return next(new ExpressError(404, "Product not found or inactive"));
  }

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = new Wishlist({
      user: userId,
      products: [product._id],
    });

    await wishlist.save();
  } else {
    const alreadyExists = wishlist.products.some(
      (id) => id.toString() === productId,
    );

    if (alreadyExists) {
      return res.status(200).json({
        success: true,
        message: "Product is already in your wishlist",
      });
    }

    wishlist.products.push(product._id);
    await wishlist.save();
  }

  await wishlist.populate({
    path: "products",
    match: { isActive: true },
    select: "name description price discountPrice images brand stock isActive",
  });

  return res.status(200).json({
    success: true,
    message: "Product added to wishlist successfully",
    wishlist,
  });
});

// Remove Product from Wishlist
const removeFromWishlist = wrapAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { productId } = req.params;

  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    return next(new ExpressError(404, "Wishlist not found"));
  }

  const productExists = wishlist.products.some(
    (id) => id.toString() === productId,
  );

  if (!productExists) {
    return next(new ExpressError(404, "Product not found in wishlist"));
  }

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId,
  );

  await wishlist.save();

  await wishlist.populate({
    path: "products",
    match: { isActive: true },
    select: "name description price discountPrice images brand stock isActive",
  });

  return res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
    wishlist,
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
