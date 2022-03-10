const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
const Tour = require('./Tour');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: true,
      minLength: [3, 'Review must be at least 3 characters long.'],
      maxLength: [512, 'Review cannot exceed 512 characters.'],
    },
    rating: {
      type: Number,
      min: [0.0, 'Ratings must be between 0.0 and 5.0.'],
      max: [5.0, 'Ratings must be between 0.0 and 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    tour: {
      type: ObjectId,
      ref: 'Tour',
      required: [true, 'Each review must belong to a tour'],
    },
    createdBy: {
      type: ObjectId,
      ref: 'User',
      required: [true, 'Reviews must have an author associated with them.'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, async function (next) {
  this.populate({
    path: 'createdBy',
    select: 'name photo',
  });
  next();
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  await doc.constructor.calcAvgRating(doc.tour);
});

reviewSchema.post('save', async function () {
  await this.constructor.calcAvgRating(this.tour);
});

// static methods:
reviewSchema.statics.calcAvgRating = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        numRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      numRatings: stats[0].numRatings,
      avgRating: stats[0].avgRating,
    });
  }
};

module.exports = mongoose.model('Review', reviewSchema);
