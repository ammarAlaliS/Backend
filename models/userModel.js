const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { boolean } = require("joi");

const userSchema = new mongoose.Schema({
  global_user: {
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    profile_img_url: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          return v === "" || validator.isURL(v);
        },
        message: "Invalid URL for profile image",
      },
      required: false,
    },
    presentation_img_url: {
      type: String,
      default: "",
      validate: {
        validator: function (v) {
          return v === "" || validator.isURL(v);
        },
        message: "Invalid URL for presentation image",
      },
      required: false,
    },

    user_description: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "passenger", "driver"],
      default: "user",
    },
    refreshToken: {
      type: String,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  Blog: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: false,
    },
  ],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Like" }],
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("global_user.password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.global_user.password = await bcrypt.hash(
      this.global_user.password,
      salt
    );
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.global_user.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
