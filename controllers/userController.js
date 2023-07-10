/**
 * CONTROLLER LOGIC WHERE MANIPULATION
 * HAPPENS FOR ALL PRODUCTS (exports)
 * 'request.body' CONTAINS DATA
 */

// IMPORTS
const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const APIFeatures = require('../utils/APIfeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (request, file, callback) => {
//     callback(null, 'public/img/users');
//   },
//   filename: (request, file, callback) => {
//     // user-id-timestamp.file-extension
//     const ext = file.mimetype.split('/')[1];
//     callback(null, `user-${request.user.id}-${Date.now()}.${ext}`);
//   },
// });
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
// UPLOADING USER PHOTO
exports.uploadUserPhoto = upload.single('photo');

// IMAGE PROCESSING
exports.resizeUserPhoto = catchAsync(async (request, response, next) => {
  if (!request.file) return next();

  request.file.filename = `user-${request.user.id}-${Date.now()}.jpeg`;

  await sharp(request.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${request.file.filename}`);

  next();
});

/**
 * FILTER OBJECT FOR UPDATING (only name and email)
 * @param {Object} object WITH ALL FIELDS
 * @param {Object} allowedFields NAME AND EMAIL ONLY
 * @returns response json
 */
const filterObject = (object, ...allowedFields) => {
  const newObject = {};
  // LOOP OBJECT THROUGH ALL FIELDS (returns array with all keynames checked into new object)
  Object.keys(object).forEach((element) => {
    if (allowedFields.includes(element)) newObject[element] = object[element];
  });
  // RETURN NEW OBJECT
  return newObject;
};

/**
 * UPDATE USER DATA (AUTHENTICATED)
 * @param {Object} request
 * @param {Object} response
 * @returns response json
 */
exports.updateMe = catchAsync(async (request, response, next) => {
  // CREATE ERROR IF USER POSTs PASSWORD DATA
  if (request.body.password || request.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }

  // FILTER OUT UNWANTED FIELD NAMES (admin, password)
  const filteredBody = filterObject(request.body, 'name', 'email');
  if (request.file) filteredBody.photo = request.file.filename;

  // UPDATE USER DOCUMENT
  const updatedUser = await User.findByIdAndUpdate(
    request.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  // SEND JSON UPDATED USER
  response.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/**
 * DELETE USER (set as inactive)
 * @param {Object} request
 * @param {Object} response
 * @returns response json
 */
exports.deleteMe = catchAsync(async (request, response, next) => {
  // GRAB ID FOR DELETION
  await User.findByIdAndUpdate(request.user.id, { active: false });

  // SEND JSON UPDATED DELETED USER
  response.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

// USER MIDDLEWARE
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
