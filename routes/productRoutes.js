/**
 * ROUTES FOR PRODUCT (URLs)
 */

const express = require('express');
const productController = require('./../controllers/productController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');
const router = express.Router();

// CREATE/GET REVIEWS
router.use('/:productId/reviews', reviewRouter);

router.route('/product-stats').get(productController.getProductStats);

router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead'),
    productController.createProduct
  );

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead'),
    productController.deleteProduct
  );

module.exports = router;
