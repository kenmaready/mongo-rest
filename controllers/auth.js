const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ErrorRunner, catchWrapper } = require('../utils/errors');
const Email = require('../utils/email');

const cookieExpiresIn = +process.env.JWT_COOKIE_EXPIRES_IN || 24;
const getToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const cookieOptions = (req) => {
  return {
    expires: new Date(Date.now() + cookieExpiresIn * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.header['x-forwarded-proto'] === 'https',
  };
};

exports.signup = catchWrapper(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  const email = new Email(newUser, url);

  await email.sendWelcome();

  const token = getToken(newUser._id);
  res.cookie('jwt', token, cookieOptions(req));

  res.status(201);
  res.json({ success: true, token, data: { user: newUser.sanitize() } });
});

exports.login = catchWrapper(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. confirm request has both an email and password
  if (!email || !password)
    return next(new ErrorRunner('Must provide email and password to log in.'));

  // 2. confirm there is a user with the email from the request
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorRunner('Login credentials invalid.', 401));
  }

  // 3. check password
  const isValidPassword = await user.checkPassword(password);
  if (!isValidPassword)
    return next(new ErrorRunner('Login credentials invalid.', 401));

  // if passed all tests, generate token and send back to front end
  const token = getToken(user._id);
  res.cookie('jwt', token, cookieOptions(req));

  res.status(200);
  res.json({
    success: true,
    message: 'You are logged in.',
    token,
  });
});

exports.forgotPassword = catchWrapper(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(
      new ErrorRunner('Email must be provided to reset password.', 400)
    );

  const user = await User.findOne({ email });
  if (!user)
    return next(
      new ErrorRunner('There is no user with that email address.', 404)
    );

  const resetToken = await user.getPasswordResetToken();
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset/${resetToken}`;
  // const message = `Forgot your password? To reset, submit a PATCH request with your new password and passwordConfirm to ${resetURL}.  This link is only valid for 10 minutes.\nIf you did not request this password reset, please ignore this message.`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Natours Password Reset',
    //   message,
    // });
    const email = new Email(user, resetURL);

    await email.sendPasswordReset();

    res.status(200);
    res.json({
      success: true,
      message: "Reset link has been sent to user's email.",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new ErrorRunner(
        'There was an error sending the reset link email. Try again laster.',
        500
      )
    );
  }
});

exports.resetPassword = catchWrapper(async (req, res, next) => {
  const { token } = req.params;
  if (!token)
    return next(new ErrorRunner('No valid reset token provided in link.', 400));

  const { password, passwordConfirm } = req.body;
  if (!password || !passwordConfirm || password !== passwordConfirm)
    return next(
      new ErrorRunner(
        'A new password and a matching passwordConfirm must be provided with request.',
        400
      )
    );

  const user = await User.findByResetToken(token).select(
    '+passwordResetExpires'
  );

  if (!user)
    return next(
      new ErrorRunner('That is not a valid password reset token', 400)
    );

  if (!user.passwordResetExpires || user.passwordResetExpires < Date.now()) {
    return next(
      new ErrorRunner(
        'Password token has expired. Please obtain a new reset token to complete resetting of password.',
        400
      )
    );
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const jwt = getToken(user._id);
  res.cookie('jwt', token, cookieOptions(req));

  res.status(200);
  res.json({ success: true, token: jwt });
});

exports.updatePassword = catchWrapper(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  if (!user) return next(new ErrorRunner('No user found with that id.', 404));

  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  const validCurrentPassword = await user.checkPassword(currentPassword);
  if (!currentPassword || !validCurrentPassword)
    return next(
      new ErrorRunner(
        'Either no current password provided or it was invalid.',
        401
      )
    );

  if (!newPassword || !newPasswordConfirm)
    return next(
      new ErrorRunner(
        'You must provide a new password and a matching new password confirmation.',
        400
      )
    );

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  const token = getToken(user._id);
  res.cookie('jwt', token, cookieOptions(req));

  res.status(200);
  res.json({ success: true, token });
});

exports.logout = (req, res) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() - 10 * 1000),
    httpOnly: true,
  });
  res.status(200);
  res.json({ success: true, message: 'User has been logged out.' });
};
