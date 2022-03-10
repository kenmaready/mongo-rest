const Tour = require('../models/Tour');
const User = require('../models/User');
const Booking = require('../models/Booking');
const factory = require('./handlerFactory');
const { ErrorRunner, catchWrapper } = require('../utils/errors');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      'Your booking was successful. Please check your email for a confirmation.';
  next();
};

exports.getOverview = catchWrapper(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200);
  res.render('overview', { title: 'All Tours', tours });
});

exports.getTour = catchWrapper(async (req, res, next) => {
  const { slug } = req.params;

  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });
  if (!tour) return next(new ErrorRunner('No tour found by that name.', 404));

  res.status(200);
  // res.set(
  //   'Content-Security-Policy',
  //   "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
  // );
  res.render('tour', tour);
});

exports.getLoginForm = (req, res) => {
  res.status(200);
  res.set(
    'Content-Security-Policy',
    "connect-src 'self' https://cdnjs.cloudflare.com"
  );
  res.render('login', { name: 'Log In' });
};

exports.getAccountPage = (req, res) => {
  const { user } = req;
  if (!user) {
    return next(new ErrorRunner('No user attached to this token.', 400));
  }

  res.status(200);
  res.render('account', { name: 'My Account', user });
};

exports.updateMe = catchWrapper(async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true }
  );

  res.status(200);
  res.render('account', { name: 'My Account', user: updatedUser });
});

exports.getMyTours = catchWrapper(async (req, res) => {
  // get all bookings
  const bookings = await Booking.find({ user: req.user._id });

  // get array of tour names
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200);
  res.render('overview', { name: 'My Tours', tours });
});
