const express = require('express');
const {
  getAllUsers,
  getUser,
  updateMe,
  deleteMe,
  deleteUser,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/users');
const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require('../controllers/auth');
const { checkToken, restrictTo } = require('../utils/auth');

const userRouter = express.Router();
userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.get('/logout', logout);
userRouter.post('/forgot', forgotPassword);
userRouter.patch('/reset/:token', resetPassword);

// add middleware layer to check user is logged in (token is valid)
userRouter.use(checkToken);

userRouter.get('/me', getMe, getUser);
userRouter.patch('/password', updatePassword);
userRouter.patch('/update', uploadUserPhoto, resizeUserPhoto, updateMe);
userRouter.delete('/me', deleteMe);

// add middleware to restrict routes to admins only
userRouter.use(restrictTo('admin'));

userRouter.get('/', getAllUsers);
userRouter.get('/:id', getUser);
userRouter.delete('/:id', deleteUser);

module.exports = userRouter;
