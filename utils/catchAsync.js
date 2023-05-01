/**
 * CATCH ASYNCHRONOUS ERRORS USING OUR ERROR MIDDLEWARE
 * @params function HANDLES CATCHING THE ERROR
 */
module.exports = catchAsync = (fn) => {
  return (request, response, next) => {
    fn(request, response, next).catch((error) => next(error));
  };
};
