const router = require("express").Router();

const upload = require("../middleware/upload");

const {
  createProduct,
  getAllProducts,
  getSingleProducts,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getAllProductsForAdmin,
} = require("../controllers/productController");

const { isAuthentication, isAdmin } = require("../middleware/authMiddleware");

const {
  parseSpecifications,
  productValidation,
  updateProductValidation,
} = require("../validations/productValidation");

// Create Product
router.post(
  "/",
  isAuthentication,
  isAdmin,
  upload.array("images", 5),
  parseSpecifications,
  productValidation,
  createProduct,
);

// Update Product
router.put(
  "/:id",
  isAuthentication,
  isAdmin,
  upload.array("images", 5),
  parseSpecifications,
  updateProductValidation,
  updateProduct,
);

// Delete Product
router.delete("/:id", isAuthentication, isAdmin, deleteProduct);

// Delete Product Image
router.delete("/:id/images", isAuthentication, isAdmin, deleteProductImage);

// Get All Products
router.get("/", getAllProducts);

// Get All Products for Admin
router.get("/admin/all", isAuthentication, isAdmin, getAllProductsForAdmin);

// Get Single Product
router.get("/:id", getSingleProducts);

module.exports = router;
