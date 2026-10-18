const router = require("express").Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  returnOrder,
  approveReturn,
  rejectReturn,
  completeReturn,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const { isAuthentication, isAdmin } = require("../middleware/authMiddleware");

// Customer order routes
router.post("/", isAuthentication, createOrder);
router.get("/", isAuthentication, getMyOrders);

// Admin order management routes
router.get("/admin/all", isAuthentication, isAdmin, getAllOrders);

router.patch("/:id/status", isAuthentication, isAdmin, updateOrderStatus);

// Admin return management routes
router.patch("/:id/return/approve", isAuthentication, isAdmin, approveReturn);

router.patch("/:id/return/reject", isAuthentication, isAdmin, rejectReturn);

router.patch("/:id/return/complete", isAuthentication, isAdmin, completeReturn);

// Customer individual order routes
router.get("/:id", isAuthentication, getOrderById);
router.patch("/:id/cancel", isAuthentication, cancelOrder);
router.patch("/:id/return", isAuthentication, returnOrder);

module.exports = router;
