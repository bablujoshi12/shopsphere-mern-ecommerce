const Product = require("../model/Product");
const User = require("../model/User");
const ExpressError = require("../utils/ExpressError");
const wrapAsync = require("../utils/wrapAsync");
const Cart = require("../model/Cart");

const addToCart = wrapAsync(async (req, res, next) => {
  let user = await User.findById(req.user._id);

  if (!user) {
    return next(new ExpressError(404, "user not found"));
  }

  let { productId, quantity } = req.body;

  let product = await Product.findById(productId);

  if (!product) {
    return next(new ExpressError(404, "product not found"));
  }

  let cart = await Cart.findOne({ user: req.user._id });

  // Cart doesn't exist → create new cart
  if (!cart) {
    cart = await Cart({
      user: req.user._id,
      items: [
        {
          product: productId,
          quantity,
        },
      ],
    });

    await cart.save();

    return res.status(201).json({
      message: "product added to cart",
      success: true,
      cart,
    });
  }

  // Check whether product already exists in cart
  let existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
    });
  }

  await cart.save();

  res.status(200).json({
    message: "product added to cart",
    success: true,
    cart,
  });
});

const getCart = wrapAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );
  if (!cart) {
    return next(new ExpressError(404, "cart is empty"));
  }

  console.log(cart.items);
  res.status(200).json({
    message: "successfully fetched",
    succes: true,
    cart,
  });
});

const updateCart = wrapAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new ExpressError(404, "user not found"));
  }

  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return next(new ExpressError(400, "productId and quantity are required"));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ExpressError(404, "product not found"));
  }

  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    return next(new ExpressError(404, "cart is empty"));
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (!existingItem) {
    return next(new ExpressError(404, "product not found in cart"));
  }

  existingItem.quantity = quantity;

  await cart.save();
  await cart.populate("items.product");

  res.status(200).json({
    message: "cart quantity updated successfully",
    success: true,
    cart,
  });
});

const removeFromCart = wrapAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new ExpressError(400, "productId is required"));
  }

  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    return next(new ExpressError(404, "cart is empty"));
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (!existingItem) {
    return next(new ExpressError(404, "product not found in cart"));
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId,
  );

  await cart.save();

  res.status(200).json({
    message: "product removed from cart",
    success: true,
    cart,
  });
});

const clearCart = wrapAsync(async (req, res, next) => {
  const cart = await Cart.findOne({
    user: req.user._id,
  });

  if (!cart) {
    return next(new ExpressError(404, "cart is empty"));
  }

  cart.items = [];

  await cart.save();

  res.status(200).json({
    message: "cart cleared successfully",
    success: true,
    cart,
  });
});

module.exports = {
  addToCart,
  getCart,
  updateCart,
  removeFromCart,
  clearCart,
};
