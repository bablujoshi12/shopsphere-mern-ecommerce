const router = require("express").Router();

const {
  signup,
  login,
  getMe,
  updateMe,
  deleteProfileImage,
} = require("../controllers/authController");

const {
  signupValidation,
  loginValidation,
} = require("../validations/authValidation");

const { isAuthentication } = require("../middleware/authMiddleware");

// Apne existing Multer middleware ka correct path use karna
const upload = require("../middleware/upload");

router.post("/signup", signupValidation, signup);
router.post("/login", loginValidation, login);

router.get("/me", isAuthentication, getMe);

// Update profile details and optionally upload profile image
router.put("/me", isAuthentication, upload.single("profileImage"), updateMe);

// Delete profile image
router.delete("/me/profile-image", isAuthentication, deleteProfileImage);

module.exports = router;
