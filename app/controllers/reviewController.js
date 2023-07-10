/**
 * REVIEWS HANDLERS
 */

// IMPORTS
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

exports.setProductUserIds = (request, response, next) => {
  // NESTED ROUTES
  if (!request.body.product) request.body.product = request.params.productId;
  if (!request.body.user) request.body.user = request.user.id;
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
