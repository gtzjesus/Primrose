/**
 * CONTROLLER LOGIC WHERE MANIPULATION
 * HAPPENS FOR ALL BOOKINGS (exports)
 */

// IMPORTS
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Product = require('./../models/productModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked product
  const product = await Product.findById(req.params.productId);

  const transformedItems = [
    {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: product.price * 100,
        product_data: {
          name: `${product.name} product`,
          description: product.description, //description here
          images: [
            `${req.protocol}://${req.get('host')}/img/products/${
              product.imageCover
            }`,
          ], //only accepts live images (images hosted on the internet),
        },
      },
    },
  ];

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/`, //user will be redirected to this url when payment is successful. home page
    // cancel_url: `${req.protocol}://${req.get('host')}/${product.slug}`, //user will be redirected to this url when payment has an issue. product page (previous page)
    success_url: `${req.protocol}://${req.get(
      'host'
    )}/my-products?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/product/${product.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.productId, //this field allows us to pass in some data about this session that we are currently creating.
    line_items: transformedItems,
    mode: 'payment',
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});