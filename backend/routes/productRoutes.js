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
  productValidation,
  updateProductValidation,
} = require("../validations/productValidation");

router.post(
  "/",
  isAuthentication,
  isAdmin,
  upload.array("images", 5),
  productValidation,
  createProduct,
);

router.put(
  "/:id",
  isAuthentication,
  isAdmin,
  upload.array("images", 5),
  updateProductValidation,
  updateProduct,
);

router.delete("/:id", isAuthentication, isAdmin, deleteProduct);

router.delete("/:id/images", isAuthentication, isAdmin, deleteProductImage);

router.get("/", getAllProducts);
router.get("/admin/all", isAuthentication, isAdmin, getAllProductsForAdmin);
router.get("/:id", getSingleProducts);

module.exports = router;
