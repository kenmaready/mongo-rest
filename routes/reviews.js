const express = require('express');
const {
  createReview,
  getReviews,
  getReview,
  deleteReview,
  updateReview,
  setTourUserIds,
} = require('../controllers/reviews');
const { checkToken, restrictTo } = require('../utils/auth');

const router = express.Router({ mergeParams: true });

// add middleware to require login for routes below:
router.use(checkToken);

router.get('/', getReviews);
router.get('/:id', getReview);

// add middleware to restrict adding, editng, deleting reviews to users:
router.use(restrictTo('user'));

router.post('/', setTourUserIds, createReview);
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
