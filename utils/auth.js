const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ErrorRunner, catchWrapper } = require('./errors');

exports.checkToken = catchWrapper(async (req, res, next) => {
  let token;
  // 1. confirm token has been provided with request
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token) {
    return next(
      new ErrorRunner('Unauthorized. There seems to be no user logged in.', 401)
    );
  }
  // 2. verify token is valid
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // 3. confirm user exists
  const currentUser = await User.findById(decodedToken.id);
  if (!currentUser)
    return next(
      new ErrorRunner('Unauthorized. That user no longer exists.', 401)
    );

  // 4. check if user changed password after token issued
  const passwordChanged = currentUser.changedPasswordAfter(decodedToken.iat);
  if (passwordChanged)
    return next(
      new ErrorRunner(
        'Unauthorized. Password for this user has been changed since token was issued. For security purposes, please log in again with new password to receive new, valid token.',
        401
      )
    );
  // if all checks pass, confirm user is authorized (allow to pass on
  // to protected route)
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = catchWrapper(async (req, res, next) => {
  let token;
  // 1. confirm token has been provided with request
  if (req.cookies.jwt) {
    token = req.cookies.jwt;

    // 2. verify token is valid
    const decodedToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    // 3. confirm user exists
    const currentUser = await User.findById(decodedToken.id);
    if (!currentUser) return next();

    // 4. check if user changed password after token issued
    const passwordChanged = currentUser.changedPasswordAfter(decodedToken.iat);
    if (passwordChanged) return next();
    // if all checks pass, confirm user is authorized (allow to pass on
    // to protected route)
    res.locals.user = currentUser;
  }
  next();
});

exports.restrictTo = (...roles) =>
  catchWrapper(async (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new ErrorRunner(
          'This user is not authorized to perform this action.',
          401
        )
      );

    next();
  });
