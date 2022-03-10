const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { JsonWebTokenError } = require('jsonwebtoken');

const passwordResetExpiresIn = process.env.PASSWORD_RESET_EXPIRES_IN || 10;
const getHash = (token) =>
  crypto.createHash('sha256').update(token).toString('hex');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please tell us your name.'] },
    email: {
      type: String,
      required: [true, 'Please provide your email.'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: { type: String, default: 'default.jpg' },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
      minLength: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password.'],
      validate: {
        // this only works on CREATE and SAVE, not on findOneAndUpdate, etc.
        validator: function (str) {
          return str === this.password;
        },
        message: 'Password confirmation does not match password.',
      },
    },
    passwordChangedAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    active: { type: Boolean, default: true, select: false },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
    toObject: { versionKey: false },
  }
);

userSchema.pre('save', async function (next) {
  // guard - exit if password isn't modified:
  if (!this.isModified('password')) return next();

  if (process.env.NODE_ENV === 'LOADER') {
    this.isNew = true;
    return next();
  }
  // if password modified, hash it and delete passwordConfirm:
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1800;
  next();
});

userSchema.pre(/^find/, function (next) {
  // in query middleware like this, 'this'
  // points to the current query, so we can
  // add filters to it:
  this.find({ active: true });
  next();
});

userSchema.methods = {
  checkPassword: async function (pw) {
    return await bcrypt.compare(pw, this.password);
  },
  changedPasswordAfter: function (jwtTimestamp) {
    if (this.passwordChangedAt) {
      const pwChangeTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
      return pwChangeTimestamp > jwtTimestamp;
    }

    return false;
  },
  getPasswordResetToken: async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    // store hashed version of crypto token and expiration and save:
    this.passwordResetToken = getHash(resetToken);
    this.passwordResetExpires = Date.now() + passwordResetExpiresIn * 60 * 1000;
    await this.save({ validateBeforeSave: false });
    return resetToken;
  },
  sanitize: function () {
    this.password = undefined;
    return this;
  },
};

userSchema.statics = {
  findByResetToken: function (resetToken) {
    const hashedToken = getHash(resetToken);
    return this.findOne({ passwordResetToken: hashedToken });
  },
};

module.exports = mongoose.model('User', userSchema);
