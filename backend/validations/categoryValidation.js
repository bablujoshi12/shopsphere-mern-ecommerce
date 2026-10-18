const Joi = require("joi");
const ExpressError = require("../utils/ExpressError");

const categorySchema = Joi.object({
  name: Joi.string().trim().required(),

  slug: Joi.string().trim().lowercase().required(),

  description: Joi.string().trim().allow("").default(""),

  image: Joi.string().allow("").default(""),

  isActive: Joi.boolean().default(true),
});

const categoryValidation = (req, res, next) => {
  const { error, value } = categorySchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return next(new ExpressError(400, error.details[0].message));
  }

  req.body = value;
  next();
};

module.exports = { categoryValidation };
