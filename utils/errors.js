// ErrorRunner class====================================================

const { render } = require('pug');

class ErrorRunner extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // this line allows us to have the stack trace, but
    // WITHOUT this object as part of the stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// errorHandler function================================================

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new ErrorRunner(message, 400);
};

const handleDuplicateFieldDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: '${value}'. Please use another value.`;
  return new ErrorRunner(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join(' | ')}`;
  return new ErrorRunner(message, 400);
};

const handleJsonWebTokenError = (err) =>
  new ErrorRunner('Unauthorized. Invalid token provided.', 401);

const handleTokenExpiredError = (err) =>
  new ErrorRunner(
    'Unauthorized. Invalid (expired) token provided. Please log in again.',
    401
  );

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode);
    res.json({
      error: err,
      message: err.message,
      status: err.status,
      success: false,
      stack: err.stack,
    });
  } else {
    // Rendered Website
    res.status(err.statusCode);
    res.render('error', { name: 'Something went wrong', msg: err.message });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // if Operational, trusted error, send along to client
    if (err.isOperational) {
      res.status(err.statusCode);
      res.json({
        message: err.message,
        status: err.status,
        success: false,
      });
      // if not an operational, trusted error, send only generic message to client:
    } else {
      // log error
      console.log('Error:', err);
      // send generic message to client
      res.status(500);
      res.json({
        success: false,
        status: 'error',
        message: 'Something has gone wrong.',
      });
    }
  } else {
    // Rendered website
    // if Operational, trusted error, send along to client
    if (err.isOperational) {
      res.status(err.statusCode);
      res.render('error', {
        name: 'Something has gone wrong.',
        msg: err.message,
      });
      // if not an operational, trusted error, send only generic message to client:
    } else {
      // log error
      console.log('Error:', err);
      // send generic message to client
      res.status(500);
      res.render('error', {
        name: 'Something has gone wrong.',
        msg: err.message,
      });
    }
  }
};

const errorHandler = (err, req, res, next) => {
  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldDB(error);
    if (err.stack.startsWith('ValidationError'))
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError')
      error = handleJsonWebTokenError(error);
    if (error.name === 'TokenExpiredError')
      error = handleTokenExpiredError(error);

    sendErrorProd(error, req, res);
  }
};

// catchWrapper function wrapper===========================================

const catchWrapper = (fn) => {
  return (req, res, next) => fn(req, res, next).catch((err) => next(err));
};

module.exports = { ErrorRunner, errorHandler, catchWrapper };
