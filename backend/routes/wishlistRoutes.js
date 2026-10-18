const router = require("express").Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const { isAuthentication } = require("../middleware/authMiddleware");

router.get("/", isAuthentication, getWishlist);
router.post("/:productId", isAuthentication, addToWishlist);
router.delete("/:productId", isAuthentication, removeFromWishlist);

module.exports = router;
