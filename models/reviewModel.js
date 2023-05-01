/**
 * REVIEW MODEL SCHEMA
 */

// IMPORTS
const mongoose = require('mongoose');
const Product = require('./productModel');

// CREATING SCHEMA FOR REVIEW
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Review must be rated'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * MIDDLEWARE FOR POPULATING DATA
 */
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'product',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function (product) {
  const stats = await this.aggregate([
    {
      $match: { product: product },
    },
    {
      $group: {
        _id: '$product',
        numberRating: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(product, {
      ratingsQuantity: stats[0].numberRating,
      ratingsAverage: stats[0].averageRating,
    });
  } else {
    await Product.findByIdAndUpdate(product, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.review = await this.clone().findOne(); //query
  console.log(this.review);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.review.consturctor.calcAverageRatings(this.review.product);
});

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

/**
 * CREATE MODEL
 */
const Review = mongoose.model('Review', reviewSchema);

// EXPORT MODULE
module.exports = Review;
