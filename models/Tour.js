const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./User');
const Review = require('./Review');

const { ObjectId } = mongoose.Schema;
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Each tour must have a name.'],
      unique: true,
      maxLength: [240, 'Tour name can not be longer than 240 characters.'],
      minLength: [3, 'Tour name must have at least 3 characters.'],
      // validate: [validator.isAlpha, 'Tour name must only contain letters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'Each tour must specify the avg. expected duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'You must specify the maximum group size for the tour.'],
    },
    difficulty: {
      type: String,
      trim: true,
      required: true,
      enum: {
        values: ['easy', 'medium', 'difficult', 'impossible'],
        message:
          "Difficulty must be either 'easy', 'medium', 'difficult' or 'impossible'.",
      },
    },
    avgRating: {
      type: Number,
      default: 3.0,
      min: [0.0, 'Ratings must be between 0.0 and 5.0.'],
      max: [5.0, 'Ratings must be between 0.0 and 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    numRatings: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'Each tour must have a price.'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Price discount ({VALUE}) cannot be greater than the price.',
      },
    },
    summary: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    imageCover: { type: String },
    images: [String],
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      type: { type: String, default: 'Point', enum: ['Point'] },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// set an index on one of the fields (price in ascending order):
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, avgRating: -1 }); // compound
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// virtual prooerties & virtual populate:
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// mongoose document middleware (pre and post hooks):
tourSchema.pre('save', async function (next) {
  this.slug = slugify(this.name, { lower: true });

  // const guidePromises = this.guides.map(async (id) => await User.findById(id));
  // this.guides = await Promise.all(guidePromises);
  next();
});

tourSchema.post('save', function (doc, next) {
  next();
});

// mongoose query middleware:
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.populate('guides');
  this.queryStartTime = Date.now();
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(
//     `This query took ${Date.now() - this.queryStartTime} milliseconds...`
//   );
//   next();
// });

// Mongoose aggregation middleware:
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log('This is aggregate pre-hook:', this._pipeline);
//   next();
// });

module.exports = mongoose.model('Tour', tourSchema);
