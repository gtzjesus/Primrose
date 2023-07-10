/**
 * ROUTES FOR REVIEWS
 */

const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

// ONLY AUTHORIZE ADMINS/LEADS
router.use(authController.protect);

router.get(
  '/checkout-session/:productId',
  bookingController.getCheckoutSession
);

router.use(authController.restrictTo('admin', 'lead'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
