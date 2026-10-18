const errorHandler = async (err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    status = 409;

    const field = Object.keys(err.keyValue || {})[0];

    message = `${field || "Field"} already exists`;
  }

  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
