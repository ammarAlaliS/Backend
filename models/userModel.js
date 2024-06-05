const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  global_user: {
    first_name: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
      lowercase: true,
      index: true, // Indexing email for better performance
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    profile_img_url: {
      type: String,
      validate: {
        validator: function(v) {
          return validator.isURL(v);
        },
        message: 'Invalid URL for profile image',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    QuickCar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuickCar',
      required: false,
    },
  },
  Blog: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: false,
  }],
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('global_user.password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.global_user.password = await bcrypt.hash(this.global_user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.global_user.password);
};

module.exports = mongoose.model('User', userSchema);
