/**
 * AUTHENTICATION HANDLERS (MIDDLEWARE/HOOKS)
 * 'request.body' CONTAINS DATA
 */

// IMPORTS
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('./../utils/email');

/**
 * CREATE SIGNATURE JSON WEB TOKEN FOR AUTH
 * @param {String} id
 * @returns token JSON WEB
 */
const signToken = (id) => {
  // CREATE TOKEN (id, secret, expiration)
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * SEND JSON RESPONSE TO CLIENT
 * @param {String} id
 * @returns response JSON
 */
const createSendToken = (user, statusCode, response) => {
  // CREATE TOKEN & SEND TO CLIENT
  const token = signToken(user._id);

  // CREATE COOKIES
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // ONLY HTTPS
    // (cookie not accessed by browser, only receive/store/send)
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // CREATE COOKIE (convert to milliseconds)
  response.cookie('jwt', token, cookieOptions);

  // REMOVE PASSWORD FROM OUTPUT
  this.password = undefined;

  // SEND RESPONSE TO CLIENT
  response.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

/**
 * CREATE USER
 * @param {Objecy} request
 * @param {Object} response
 * @param {Middleware} next
 * @returns response json CREATED USER
 * catchAsync HANDLES CATCHING THE ERROR
 */
exports.signup = catchAsync(async (request, response, next) => {
  const newUser = await User.create({
    name: request.body.name,
    email: request.body.email,
    password: request.body.password,
    passwordConfirm: request.body.passwordConfirm,
    role: request.body.role,
  });
  const url = `${request.protocol}://${request.get('host')}/me`;
  console.log(url);
  // SEND EMAIL
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, response);
});

/**
 * LOGIN USER
 * @param {Objecy} request
 * @param {Object} response
 * @param {Middleware} next
 * @returns response json LOGGING IN USER
 * catchAsync HANDLES CATCHING THE ERROR
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.logout = (request, response) => {
  response.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  response.status(200).json({ status: 'success' });
};

/**
 * PROTECT USER ROUTES
 * @param {Objecy} request
 * @param {Object} response
 * @param {Middleware} next
 * @returns next() Middleware
 * catchAsync HANDLES CATCHING THE ERROR
 */
exports.protect = catchAsync(async (request, response, next) => {
  let token;
  // GET AND CHECK TOKEN (HEADER-VALUE: Bearer token)
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
    // OTHERWISE ELSE IF COOKIES
  } else if (request.cookies.jwt) {
    token = request.cookies.jwt;
  }

  if (!token) {
    // CHECK IF TOKEN EXISTS
    return next(new AppError('Please log in to gain access!', 401));
  }

  // VERIFY TOKEN (token, secret, callback) (promisify user completely)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // CHECK IF USER EXISTS ()
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token no longer exist', 401)
    );
  }

  // CHECK IF PASSWORD CHANGE
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! please log in again', 401)
    );
  }
  // GRANT ACCESS TO ALL OTHER ROUTES)
  request.user = freshUser;
  response.locals.user = freshUser;
  // SHOW CONTENT (move to next middleware/hook)
  next();
});

// ONLY FOR RENDERED PAGES, NO ERRORS
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

/**
 * RESTRICT ROUTES FOR ADMIN USERS
 * @param  {...any} roles ARRAY WITH roles
 * @returns next CONTENT
 */
exports.restrictTo = (...roles) => {
  return (request, response, next) => {
    // CHECK TYPE OF USER ROLE
    if (!roles.includes(request.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    // SHOW CONTENT
    next();
  };
};

/**
 * FORGOTTEN PASSWORD
 * @param {Objecy} request
 * @param {Object} response
 * @param {Middleware} next
 * @returns next() Middleware
 * catchAsync HANDLES CATCHING THE ERROR
 */
exports.forgotPassword = catchAsync(async (request, response, next) => {
  // GRAB USER BASED ON POSTed EMAIL
  const user = await User.findOne({ email: request.body.email });

  // CHECK IF USER EXISTS
  if (!user) {
    next(new AppError('There is no user with email address', 404));
  }

  // GENERATE RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken();

  // TURN OFF VALIDATION
  await user.save({ validateBeforeSave: false });

  // SEND TOKEN TO USER'S EMAIL
  const resetURL = `${request.protocol}://${request.get(
    'host'
  )}/api/users/resetPassword/${resetToken}`;

  // CONTRUCT EMAIL MESSAGE
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to : ${resetURL}.\nIf you did not forget password, please ignore this email`;
  try {
    // // SEND EMAIL
    // await sendEmail({
    //   email: request.body.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    // SEND RESPONSE, OTHERWISE IT WILL NEVER FINISH
    response.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    // RESET TOKENS
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // SAVE USER INTO DB
    await user.save({ validateBeforeSave: false });

    // ISSUE SENDING EMAIL
    return next(
      new AppError('There was an error sending the email! try again later', 500)
    );
  }
});

/**
 * RESET PASSWORD
 * @param {Objecy} request
 * @param {Object} response
 * @param {Middleware} next
 * @returns next() Middleware
 * catchAsync HANDLES CATCHING THE ERROR
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // TOKEN !EXPIRED, AND THERE IS A USER
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // UPDATE changePasswordAt attribure
  // LOG USER IN, SEND WEB TOKEN
  createSendToken(user, 200, res);
});

/**
 * UPDATE PASSWORD
 * @param {Objecy} request
 * @param {Object} response
 * @param {Middleware} next
 * @returns next() Middleware
 * catchAsync HANDLES CATCHING THE ERROR
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // GRAB USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');

  // CHECK IF POSTed current password IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // UPDATE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // LOG USER IN, SEND WEB TOKEN
  createSendToken(user, 200, res);
});

/**
 * CHANGE PASSWORD AS USER (logged in)
 * @param {Objecy} request
 * @param {Object} response
 * @param {Middleware} next
 * @returns next() Middleware
 * catchAsync HANDLES CATCHING THE ERROR
 */
exports.updatePassword = catchAsync(async (request, response, next) => {
  // GET USER FROM COLLECTION
  const user = await User.findById(request.user.id).select('+password');

  // CHECK IF POSTED PASSWORD IS CORRECT
  if (
    !(await user.correctPassword(request.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // UPDATE PASSWORD
  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  await user.save();

  // LOG USER IN, SEND WEB TOKENS
  createSendToken(user, 200, response);
});
