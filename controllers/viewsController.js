/**
 * VIEWS HANDLERS
 */

const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const Product = require('./../models/productModel');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (request, response, next) => {
  // GET PRODUCT DATA FROM COLLECTION
  const products = await Product.find();

  // BUILD TEMPLATE

  // RENDER TEMPLATE
  response.status(200).render('overview', {
    title: 'All Products',
    products: products,
  });
});

exports.getProduct = catchAsync(async (request, response, next) => {
  // GET DATA FROM REQUESTED PRODUCT
  const product = await Product.findOne({ slug: request.params.slug }).populate(
    {
      path: 'reviews',
      fields: 'review rating user images',
    }
  );

  if (!product) {
    return next(new AppError('There is no product with that name', 404));
  }
  // BUILD TEMPLATE

  // RENDER TEMPLATE
  response.status(200).render('product', {
    title: 'Fashionista',
    product,
  });
});

exports.getLoginForm = (request, response) => {
  response.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (request, response) => {
  response.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (request, response, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    request.user.id,
    {
      name: request.body.name,
      email: request.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  response.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
