const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: ObjectId,
      ref: 'Tour',
      required: [true, 'A Tour must be associated with this booking.'],
    },
    user: {
      type: ObjectId,
      ref: 'User',
      required: [true, 'A User must be associated with this booking.'],
    },
    price: {
      type: Number,
      required: [true, 'Each tour must have a price.'],
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({ path: 'tour', select: 'name' });
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
