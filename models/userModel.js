/**
 * USER SCHEMA
 */

// IMPORTS
const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

// CREATE SCHEMA FOR USER
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'lead'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (element) {
        return element === this.password;
      },
    },
    message: 'Passwords are not the same',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
/**
 * MIDDLEWARE FOR EVERY QUERY THAT STARTS WITH FIND
 */
userSchema.pre(/^find/, function (next) {
  // POINTS TO CURRENT QUERY (only display active users)
  this.find({ active: { $ne: false } });

  next();
});

/**
 * ENCRYPT PASSWORD
 */
userSchema.pre('save', async function (next) {
  // RUN IF PASSWORD HAS BEEN CHANGED
  if (!this.isModified('password')) return next();

  // HASHING (ASYNCHRONOUS BECRYPT ALGORITHM , 12 = COST)
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

/**
 * CHECK ENCRYPTED PASSWORDS
 */
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

/**
 * CHECK TO SEE IF PASSWORD WAS CHANGED AFTER
 * @param {*} JWTTimestamp
 * @returns
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  // NOT CHANGED
  return false;
};

/**
 * CREATE A RESET TOKEN FOR FORGOTTEN PASSWORD
 */
userSchema.methods.createPasswordResetToken = function () {
  // CONVERT TOKEN BACK TO HEX
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // TIMER ON RESET TOKEN (10min)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // RETURN GENERATED RESETTING TOKEN
  return resetToken;
};

// CREATE USER MODEL WITH SCHEMA
const User = mongoose.model('User', userSchema);

module.exports = User;
