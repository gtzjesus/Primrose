/**
 * PRODUCT SCHEMA MODEL
 */

// IMPORTS
const mongoose = require('mongoose');
const slugify = require('slugify');
// CREATING SCHEMA FOR PRODUCT
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A product name must have less or equal then 40 characters',
      ],
      minlength: [
        3,
        'A product name must have more or equal then 10 characters',
      ],
    },
    slug: String,
    description: {
      type: String,
      trim: true,
      required: [true, 'A product must have a description'],
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'A product must have a quantity'],
    },
    summary: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 1,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (value) => Math.round(value * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    imageCover: {
      type: String,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    secretProduct: {
      type: Boolean,
      default: false,
    },
    leads: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// PERFORMANCE GAIN
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ slug: 1 });

/**
 * VIRTUAL POPULATE REVIEWS
 */
productSchema.virtual('reviews', {
  ref: 'Review', // CREATE REFERENCE
  foreignField: 'product', // POINTS TO reviewModel
  localField: '_id', // POINTS TO productModel
});

/**
 * POPULATE ALL QUERIES WITH find
 */
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'leads',
    select: '-__v -passwordChangedAt',
  });
  next();
});

/**
 *
 */
productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
// CREATING MODEL (OBJECT)
const Product = mongoose.model('Product', productSchema);

// EXPORT MODULE
module.exports = Product;
