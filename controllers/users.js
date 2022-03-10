// const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/User');
const { ErrorRunner, catchWrapper } = require('../utils/errors');
const factory = require('./handlerFactory');

// const { userDB } = require('./database');
// const e = require('express');
// const users = JSON.parse(fs.readFileSync(userDB));

// multer
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

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

exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchWrapper(async (req, res, next) => {
  // if this update does not include a photo, move on...
  if (!req.file) return next();

  // if this update includes a photo, then process:
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObject = (obj, ...allowedFields) => {
  const filteredObject = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) filteredObject[key] = obj[key];
  });
  return filteredObject;
};

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);

exports.updateMe = catchWrapper(async (req, res, next) => {
  if (
    req.body.password ||
    req.body.passwordConfirm ||
    req.body.newPassword ||
    req.body.currentPassword
  ) {
    return next(
      new ErrorRunner(
        "Please use 'users/password' if you want to update your password.",
        400
      )
    );
  }
  const filteredBody = filterObject(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200);
  res.json({ success: true, data: { user: updatedUser } });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.deleteMe = catchWrapper(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204);
  res.json({
    success: true,
    message: 'Your user account has been marked as inactive.',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500);
  res.json({
    success: false,
    message: 'This route is not yet defined. Please use /signup instead.',
  });
};
