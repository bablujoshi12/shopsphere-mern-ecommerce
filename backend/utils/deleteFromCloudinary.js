const cloudinary = require("../config/cloudinary");

const deleteFromCloudinary = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

const getPublicId = (imageUrl) => {
  const parts = imageUrl.split("/upload/")[1];
  const withoutVersion = parts.replace(/^v\d+\//, "");
  const publicId = withoutVersion.substring(0, withoutVersion.lastIndexOf("."));

  return publicId;
};

module.exports = { deleteFromCloudinary, getPublicId };
