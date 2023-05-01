/**
 * HANDLER FACTORY (returns controllers)
 */

// IMPORTS
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/APIfeatures');

/**
 * DELETE HANDLER
 * @param {Model} model
 * @param {Object} request
 * @param {Object} response
 * @param {Next} function FINISHES MIDDLEWARE/HOOK
 * @returns response controller
 */
exports.deleteOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndDelete(request.params.id);
    console.log(document);

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    response.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.findByIdAndUpdate(
      request.params.id,
      request.body,
      {
        new: true,
        runValidators: true, // validate type
      }
    );
    if (!document) {
      return next(new AppError('No document found with that id', 404));
    }
    response.status(200).json({
      status: 'success',
      data: { data: document },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (request, response, next) => {
    const document = await Model.create(request.body);
    response.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (request, response, next) => {
    let query = Model.findById(request.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const document = await query;

    if (!document) {
      return next(new AppError('No document found with that id', 404));
    }
    response.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (request, response, next) => {
    // ALLOW FOR NESTED get REVIEWS ON product (hack)
    let filter = {};
    if (request.params.productId)
      filter = { product: request.params.productId };

    const features = new APIFeatures(Model.find(filter), request.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const document = await features.query;

    response.status(200).json({
      status: 'success',
      results: document.length,
      data: {
        data: document,
      },
    });
  });
