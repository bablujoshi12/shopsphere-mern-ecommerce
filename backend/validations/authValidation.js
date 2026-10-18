const Joi = require("joi");

const ExpressError = require("../utils/ExpressError");

const signupValidation = (req, res, next) => {
  const signupSchema = Joi.object({
    username: Joi.string().min(3).max(20).trim().required(),
    email: Joi.string().email().trim().required(),
    mobile: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required(),
    password: Joi.string()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
      .required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });

  let { error } = signupSchema.validate(req.body);

  if (error) {
    return next(new ExpressError(400, error.details[0].message));
  }

  next();
};
const loginValidation = (req, res, next) => {
  const loginSchema = Joi.object({
    email: Joi.string().email().trim().required(),
    password: Joi.string().required(),
  });

  let { error } = loginSchema.validate(req.body);

  if (error) {
    return next(new ExpressError(400, error.details[0].message));
  }

  next();
};

module.exports = { signupValidation, loginValidation };
