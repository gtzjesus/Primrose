/**
 * VIEWS HANDLERS
 */

const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const Bookings = require('./../models/bookingModel');
const Product = require('./../models/productModel');
const AppError = require('../utils/appError');
const Booking = require('./../models/bookingModel');

exports.alerts = (request, response, next) => {
  const { alert } = request.query;
  if (alert == 'booking')
    response.locals.alert =
      "Your payment was successful! Please check your email for a confirmation. If your purchase doesn't show immediately, come back later!";
  next();
};

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

exports.getMyProducts = catchAsync(async (request, response, next) => {
  // FIND ALL PRODUCTS
  const bookings = await Booking.find({ user: request.user.id });

  // FIND PRODUCTS W/ RETURNED IDs
  const productIDs = bookings.map((element) => element.product);
  const products = await Product.find({ _id: { $in: productIDs } });

  response.status(200).render('overview', {
    title: 'My Products',
    products,
  });
});

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

exports.getSignUpForm = (req, res) => {
  res.status(200).render('signup', {
    title: `Create New Account`,
  });
};
