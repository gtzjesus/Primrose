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

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const productRouter = require('./routes/productRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

// CREATE APPLICATION
const app = express();

// DEFINE ENGINE
app.set('view engine', 'pug');

// LOCATE VIEW (we dont know if path has slash /
app.set('views', path.join(__dirname, 'views'));

// SERVE STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// SET SECURITY HTTP HEADERS
app.use(helmet());

// CHECK NODE ENVIRONMENT (production/development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

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
    whitelist: ['duration'],
  })
);

// RATE REQUEST LIMITING
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

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

/**
 * HANDLE URL's API THAT DO NOT MATCH
 * @returns error 404 NOT FOUND
 */
app.all('*', (request, response, next) => {
  next(new AppError(`Cant find ${request.originalUrl} on this server!`, 404));
});

// HANDLE ERRORS GLOBALLY
app.use(globalErrorHandler);

// EXPORT MODULE
module.exports = app;
