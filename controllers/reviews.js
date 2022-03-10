const Review = require('../models/Review');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  req.body.createdBy = req.user._id;
  req.body.tour = req.params.id;
  next();
};

exports.createReview = factory.createOne(Review);

exports.getReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
