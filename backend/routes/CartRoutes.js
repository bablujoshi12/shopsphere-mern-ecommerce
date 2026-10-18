const router = require("express").Router();

const {
  addToCart,
  getCart,
  updateCart,
  removeFromCart,
  clearCart,
} = require("../controllers/CartController");
const { isAuthentication } = require("../middleware/authMiddleware");

router.post("/", isAuthentication, addToCart);
router.get("/", isAuthentication, getCart);
router.put("/", isAuthentication, updateCart);
router.delete("/", isAuthentication, removeFromCart);
router.delete("/clear", isAuthentication, clearCart);

module.exports = router;
