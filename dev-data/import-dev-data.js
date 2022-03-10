const fs = require('fs');
require('../db');

const Tour = require('../models/Tour');
const User = require('../models/User');
const Review = require('../models/Review');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours.json`, 'utf-8')
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8')
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/data/reviews.json`, 'utf-8')
);

const importData = async () => {
  try {
    tours.forEach((tour) => {
      tour.avgRating = tour.ratingsAverage;
      tour.numRatings = tour.ratingsQuantity;
    });
    reviews.forEach((review) => {
      review.createdBy = review.user;
    });
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Development data successfully loaded into database...');
  } catch (err) {
    console.log('error in importData:', err.code, err.message);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    console.log('Data successfully deleted from database...');
  } catch (err) {
    console.log('error occurred in deleteData:', err.code, err.message);
  }
  process.exit();
};

if (process.argv[2] === '--import' || process.argv[2] === '-I') {
  importData();
} else if (process.argv[2] === '--delete' || process.argv[2] === '-D') {
  deleteData();
}
