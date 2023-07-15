/**
 * APPLICATION
 */

// IMPORTS
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

const viewRouter = require('./routes/viewRoutes');

// CREATE APPLICATION
const app = express();

// EXPRESS TRUSTING PROXIES (TESTING IF CONNECTION IS SECURE IN HEROKU)
app.enable('trust proxy');

// DEFINE ENGINE
app.set('view engine', 'pug');

// CORS IMPLEMENTATION (ACCESS-CONTROL-ALLOW-ORIGIN *)
// ALLOWS EVERYONE TO CONSUME OUR API
app.use(cors());

// SUCH AS .get .delete .patch (ANOTHER HTTP METHOD)
app.options('*', cors());

// LOCATE VIEW (we dont know if path has slash /
app.set('views', path.join(__dirname, 'views'));

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// SET SECURITY HTTP HEADERS
app.use(helmet());

// STRIPE ERR_RESPONSE SOLUTION
app.use(helmet.crossOriginEmbedderPolicy({ policy: 'credentialless' }));

// CHECK NODE ENVIRONMENT (production/development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// RATE REQUEST LIMITING
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

// NOT IN JSON BUT IN RAW
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// BODY PARSERS (reading data from body into request.body)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// SANITIZE DATA against noSQL query injection
app.use(mongoSanitize());

// SANITIZE DATA against html code (malicious)
app.use(xss());

// PREVENT PARAMETER POLLUTION (clear query string)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// COMPRESS FILES
app.use(compression());

// CONTENT SECURITY POLICY
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        scriptSrc: [
          "'self'",
          'https:',
          'http:',
          'blob:',
          'https://js.stripe.com',
          'https://m.stripe.network',
          'https://*.cloudflare.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com'],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        workerSrc: ["'self'", 'data:', 'blob:', 'https://m.stripe.network'],
        childSrc: ["'self'", 'blob:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        formAction: ["'self'"],
        connectSrc: [
          "'self'",
          "'unsafe-inline'",
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: { policy: 'credentialless' },
  })
);

// TESTING
app.use((request, response, next) => {
  request.requestTime = new Date().toISOString();
  next();
});

// USE API
app.use('/', viewRouter);
app.use('/api/products', productRouter);
app.use('/api/users', userRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/bookings', bookingRouter);

/**
 * HANDLE URL's API THAT DO NOT MATCH
 * @returns error 404 NOT FOUND
 */
app.all('*', (request, response, next) => {
  next(new AppError(`Cant find ${request.originalUrl} on this server!`, 404));
});

// HANDLE ERRORS GLOBALLY
// app.use(globalErrorHandler);

// EXPORT MODULE
module.exports = app;
