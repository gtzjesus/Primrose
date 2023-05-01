// IMPORTS
const AppError = require('../utils/appError');
/**
 * HANDLE OPERATIONAL ERRORS
 * @param {error} error
 * @returns error HUMAN-READABLE
 */
const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

/**
 * HANDLE DUPLICATE ERRORS
 * @param {error} error
 * @returns error HUMAN-READABLE
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

/**
 * HANDLE VALIDATION ERRORS
 * @param {error} error
 * @returns error HUMAN-READABLE
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * SEND DEVELOPMENT TEAM THE ERROR
 * @param {error} error
 * @param {Object} response
 */
const sendErrorDev = async (error, response) => {
  response.status(error.statusCode).json({
    status: error.status,
    error: error,
    message: error.message,
    stack: error.stack,
  });
};
/**
 * SEND PRODUCTION TEAM THE ERROR
 * @param {error} error
 * @param {Object} response
 */
const sendErrorProduction = (error, response) => {
  if (error.isOperational) {
    response.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  } else {
    // dont leak any error details to clients
    console.log('ERROR🔥', error);
    response.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }
};
/**
 * ERROR HANDLER
 * @param {Error} error
 * @param {Objecy} request
 * @param {Object} response
 * @param {function} next MIDDLEWARE ADVANCE
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProduction(error, res);
  }
};
