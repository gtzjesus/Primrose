/**
 * CONTROLLER LOGIC WHERE MANIPULATION
 * HAPPENS FOR ALL PRODUCTS (exports)
 * 'request.body' CONTAINS DATA
 */

// IMPORTS
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const Product = require('./../models/productModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

// STORE IMAGE AT BUFFER
const multerStorage = multer.memoryStorage();

const multerFilter = (request, file, callback) => {
  if (file.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(new AppError('Not an image!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.array('images', 5);

exports.resizeProductImages = catchAsync(async (request, response, next) => {
  if (!request.files || !request.files.images) return next();

  // COVER IMAGE
  request.body.imageCover = `product-${
    request.params.id
  }-${Date.now()}-cover.jpeg`;

  await sharp(request.files.imageCover[0].buffer)
    .resize(1333, 2000)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${request.body.imageCover}`);

  // OTHER IMAGES
  request.body.images = [];

  await Promise.all(
    request.files.images.map(async (file, i) => {
      const filename = `product-${request.params.id}-${Date.now()}-${
        i + 1
      }.jpeg`;

      await sharp(file.buffer)
        .resize(1333, 2000)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/products/${filename}`);

      request.body.images.push(filename);
    })
  );
  // console.log(request.body);
  next();
});

exports.getProductStats = catchAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '' },
        numProducts: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getAllProducts = factory.getAll(Product);
exports.getProduct = factory.getOne(Product, { path: 'reviews' });
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);
