const Joi = require("joi");
const ExpressError = require("../utils/ExpressError");

// Parse multipart/form-data fields before Joi validation
const parseSpecifications = (req, res, next) => {
  if (typeof req.body.specifications === "string") {
    try {
      req.body.specifications = JSON.parse(req.body.specifications);
    } catch (error) {
      return next(
        new ExpressError(400, "Specifications must contain valid JSON"),
      );
    }
  }

  next();
};

// Create Product Schema
const productSchema = Joi.object({
  name: Joi.string().trim().required(),

  description: Joi.string().trim().required(),

  price: Joi.number().min(0).required(),

  costPrice: Joi.number().min(0).required(),

  discountPrice: Joi.number().min(0).max(Joi.ref("price")).optional(),

  stock: Joi.number().integer().min(0).default(0),

  sku: Joi.string().trim().uppercase().required(),

  category: Joi.string().hex().length(24).required(),

  images: Joi.array().items(Joi.string()).default([]),

  brand: Joi.string().trim().allow("").default(""),

  specifications: Joi.object()
    .pattern(Joi.string().trim().min(1), Joi.string())
    .default({}),

  isActive: Joi.boolean().default(true),
});

// Update Product Schema
const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100),

  description: Joi.string().trim().min(10),

  price: Joi.number().min(0),

  costPrice: Joi.number().min(0),

  discountPrice: Joi.number().min(0).allow(null),

  category: Joi.string().hex().length(24),

  stock: Joi.number().integer().min(0),

  brand: Joi.string().trim().allow(""),

  sku: Joi.string().trim().uppercase(),

  specifications: Joi.object().pattern(
    Joi.string().trim().min(1),
    Joi.string(),
  ),

  isActive: Joi.boolean(),
}).min(1);

// Create Product Validation
const productValidation = (req, res, next) => {
  const { error, value } = productSchema.validate(req.body, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    return next(new ExpressError(400, error.details[0].message));
  }

  req.body = value;
  next();
};

// Update Product Validation
const updateProductValidation = (req, res, next) => {
  const { error, value } = updateProductSchema.validate(req.body, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    return next(new ExpressError(400, error.details[0].message));
  }

  req.body = value;
  next();
};

module.exports = {
  parseSpecifications,
  productValidation,
  updateProductValidation,
};
