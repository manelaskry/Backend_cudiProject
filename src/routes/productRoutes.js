const express = require('express');
const router = express.Router();
const { protect, sellerOnly } = require('../middleware/auth');
const {
  createProduct,
  getProducts,
  getProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  purchaseProduct,
  getMyPurchases
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes - Seller
router.post('/', protect, sellerOnly, createProduct);
router.get('/my/products', protect, sellerOnly, getMyProducts);
router.put('/:id', protect, sellerOnly, updateProduct);
router.delete('/:id', protect, sellerOnly, deleteProduct);

// Protected routes - Buyer
router.post('/purchase', protect, purchaseProduct);
router.get('/my/purchases', protect, getMyPurchases);

module.exports = router;