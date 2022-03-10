const express = require('express');
const { createReview } = require('../controllers/reviews');
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTop5Cheap,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
  // checkId,
  // checkBody,
} = require('../controllers/tours');
const { checkToken, restrictTo } = require('../utils/auth');
const reviewRouter = require('./reviews');

const tourRouter = express.Router();
// tourRouter.param('id', checkId);

// nested router for reviews:
tourRouter.use('/:id/reviews', reviewRouter);

// regular routes:
tourRouter.get('/', getAllTours);
tourRouter.get('/stats', getTourStats);
tourRouter.get('/top-5-cheap', aliasTop5Cheap, getAllTours);
tourRouter.get('/monthly-plan/:year', getMonthlyPlan);
tourRouter.get(
  '/tours-within/:distance/center/:latlng/unit/:unit',
  getToursWithin
);
tourRouter.get('/distances/:latlng/unit/:unit', getDistances);
tourRouter.get('/:id', getTour);

// add middleware to require token & restrict to admins and lead guides:
tourRouter.use(checkToken);
tourRouter.use(restrictTo('admin', 'lead-guide'));

tourRouter.post('/', uploadTourImages, resizeTourImages, createTour);
tourRouter.patch('/:id', uploadTourImages, resizeTourImages, updateTour);
tourRouter.delete('/:id', deleteTour);

module.exports = tourRouter;
