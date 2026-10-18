const express = require("express");
const router = express.Router();

const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/paymentController");

const { isAuthentication } = require("../middleware/authMiddleware");

router.post("/create-order", isAuthentication, createRazorpayOrder);

router.post("/verify", isAuthentication, verifyRazorpayPayment);

module.exports = router;
