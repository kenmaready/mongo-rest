const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../models/Tour');
const { catchWrapper, ErrorRunner } = require('../utils/errors');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

// multer
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new ErrorRunner(
        'The file selected is not an image. Please only upload images.',
        400
      ),
      false
    );
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchWrapper(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  // Cover image
  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  // other images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );
  }

  next();
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.aliasTop5Cheap = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-avgRatings,price';
  req.query.fields = 'name,price,avgRating,summary,difficulty';
  next();
};

exports.getTourStats = catchWrapper(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { avgRating: { $gte: 4.5 } } },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        avgRating: { $avg: '$avgRating' },
        numRatings: { $sum: '$numRatings' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
  ]);

  res.status(200);
  res.json({ success: true, stats });
});

exports.getMonthlyPlan = catchWrapper(async (req, res, next) => {
  const year = req.params.year;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { month: 1 } },
  ]);

  res.status(200);
  res.json({ success: true, data: { results: plan.length, plan } });
});

exports.getToursWithin = catchWrapper(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!distance || !lat || !lng || !unit)
    return next(
      new ErrorRunner(
        'Please provide a latitude and longitude in the format <<lat,lng>>.',
        400
      )
    );

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(400);
  res.json({
    success: true,
    results: tours.length,
    data: { tours },
  });
});

exports.getDistances = catchWrapper(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!latlng || !unit || !lat || !lng) {
    return next(
      new ErrorRunner(
        'Please provide a latitude and longiture in the format <<lat,lng>>.',
        400
      )
    );
  }

  const distanceMultiplier = unit === 'mi' ? 1 / 1609.34 : 1 / 1000;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [+lng, +lat] },
        distanceField: 'distance',
        distanceMultiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200);
  res.json({ success: true, data: { distances } });
});

/* 
const findById = (id) => {
  return tours.find((el) => {
    return el.id === id;
  });
};

exports.checkId = (req, res, next, val) => {
  const tour = findById(+val);
  if (!tour)
    return res
      .status(404)
      .json({ success: false, message: 'No tour found with that id.' });

  req.tour = tour;
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || req.body.name.trim() === '' || !req.body.price)
    return res.status(400).json({
      success: false,
      message:
        'Bad request: tour must have at least a name and price to be submitted.',
    });

  next();
};
 */
