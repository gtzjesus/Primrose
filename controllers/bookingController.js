/**
 * CONTROLLER LOGIC WHERE MANIPULATION
 * HAPPENS FOR ALL BOOKINGS (exports)
 */

// IMPORTS
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Product = require('./../models/productModel');
const Booking = require('./../models/bookingModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

// MIDDLEWARE USED TO RECEIVE PAYMENT FROM STRIPE
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked product
  const product = await Product.findById(req.params.productId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}`,
    // success_url: `${req.protocol}://${req.get('host')}/my-products`,
    cancel_url: `${req.protocol}://${req.get('host')}/product/${product.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.productId, //this field allows us to pass in some data about this session that we are currently creating.
    line_items: [
      {
        name: `${product.name} Product`,
        description: product.description,
        images: [
          `${req.protocol}://${req.get('host')}/img/products/${
            product.imageCover
          }`,
        ],
        amount: product.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});
// PRODUCTION FUNCTION; CREATE THAT PURCHASE/BOOKING
const createBookingCheckout = async (session) => {
  const product = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({ product, user, price });
};

// STRIPE WEBOOK TO CREATE PURCHASE, FROM OUR FRONTEND
exports.webhookCheckout = (req, res, next) => {
  // ADDS HEADER TO REQUEST, CONTAINING SIGNATURE TO WEBHOOK (from stripe doc)
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook error : ${err.message}`);
  }

  // TEST IF IT IS EVENT
  if (event.type === 'checkout.session.completed')
    // CREATE STRIPE EVENT
    createBookingCheckout(event.data.object);
  //  SEND CONFIRMATION
  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
