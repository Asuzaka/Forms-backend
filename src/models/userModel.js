const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A user must have a name"],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "A user must have an email"],
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "A user must have a valid email"],
  },
  photo: {
    type: String,
    default: "default.png",
  },

  // For local login
  password: {
    type: String,
    trim: true,
    select: false,
    minlength: 8,
    validate: [
      {
        validator: function (val) {
          if (!val && this.provider !== "local") return true;
          return validator.isAlphanumeric(val);
        },
        message: "A password must contain only characters",
      },
    ],
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (value) {
        if (!value && this.provider !== "local") return true;
        return this.password === value;
      },
      message: "Passwords do not match",
    },
  },

  provider: {
    type: String,
    enum: ["local", "google", "github"],
    default: "local",
  },
  providerId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["blocked", "active"],
    default: "active",
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  passwordChangedAt: Date,
  userToken: String,
  passwordToken: String,
  passwordTokenExpire: Date,
});

// Automatic encoding password as soon as recieved
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

UserSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// To Remove unverified users from db
UserSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 86400, // 24 hours
    partialFilterExpression: { isVerified: false },
  } // Only applies to unverified users
);

UserSchema.index({ name: 1 });

// To create User Token
UserSchema.methods.createUserToken = function () {
  const userToken = crypto.randomBytes(26).toString("hex");

  this.userToken = crypto.createHash("sha256").update(userToken).digest("hex");

  return userToken;
};

UserSchema.methods.confirmPassword = async function (candidate, password) {
  return await bcrypt.compare(candidate, password);
};

UserSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordTokenExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

UserSchema.methods.confirmResetToken = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    this.passwordChangedAt / 1000;
  }
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
