const AppError = require('../utils/AppError');

function handlePrismaError(err) {
  if (err.code === 'P2002') {
    return new AppError('A record with this value already exists', 409, 'CONFLICT');
  }
  if (err.code === 'P2025') {
    return new AppError('Record not found', 404, 'NOT_FOUND');
  }
  if (err.code === 'P2003') {
    return new AppError('This record is referenced by other data and cannot be deleted', 409, 'CONFLICT');
  }
  return new AppError('Database error', 500, 'PRISMA_ERROR');
}

function errorHandler(err, req, res, _next) {
  console.error(err);

  if (err.name === 'PrismaClientKnownRequestError') {
    err = handlePrismaError(err);
  } else if (err.name === 'PrismaClientValidationError') {
    err = new AppError('Invalid data provided', 400, 'VALIDATION_ERROR');
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    err = new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  } else if (!err.isOperational) {
    err = new AppError('Internal server error', 500, 'INTERNAL_ERROR');
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    errorCode: err.errorCode,
  });
}

module.exports = errorHandler;
