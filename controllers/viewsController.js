/**
 * VIEWS HANDLERS
 */

const catchAsync = require('../utils/catchAsync');
const Product = require('./../models/productModel');

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
