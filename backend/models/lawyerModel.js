const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const crypto = require("crypto");

const lawyerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Lawyer Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter product Description"],
  },
  price: {
    type: Number,
    required: [true, "Please Enter product Price"],
    maxLength: [8, "Price cannot exceed 8 characters"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  images: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  bgImage: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  category: {
    type: String,
    required: [true, "Please Enter Lawyer Category"],
  },

  supply: {
    type: Number,
    required: [true, "Please Enter product Stock"],
    maxLength: [4, "Stock cannot exceed 4 characters"],
    default: 1,
  },

  special_supply: {
    type: Number,
    required: [true, "Please Enter special product Stock"],
    maxLength: [4, "Stock cannot exceed 4 characters"],
    default: 0,
  },

  numOfReviews: {
    type: Number,
    default: 0,
  },

  reviews: [
    {
      uname: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  customer: [
    {
      username: { type: String, required: true },
      email: { type: String, required: true },
    },
  ],
  normalTicketsSold: { type: Number, default: 0 },
  vipTicketsSold: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

lawyerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// JWT token generator
lawyerSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Compare Password
lawyerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Lawyer", lawyerSchema);
