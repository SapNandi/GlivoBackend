const Lawyer = require("../models/lawyerModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandler");
const CatchAsyncErrors = require("../Middleware/catchAsyncErrors");
const ApiFeatures = require("../utils/apiFeatures");
const sendToken = require("../utils/jwtToken");
const catchAsyncErrors = require("../Middleware/catchAsyncErrors");
const cloudinary = require("cloudinary");

// Create Lawyer  ------> Admin

exports.createLawyer = CatchAsyncErrors(async (req, res, next) => {
  req.body.user = req.user.id;

  const user = await User.findById(req.user.id);

  const { name, description, price, category } = req.body;

  const myCloud = await cloudinary.v2.uploader.upload(req.body.images, {
    folder: "productavatar",
    width: 150,
    crop: "scale",
  });

  const myCloud2 = await cloudinary.v2.uploader.upload(req.body.bgImage, {
    folder: "productavatar",
    width: 150,
    crop: "scale",
  });

  const lawyer = await Lawyer.create({
    name,
    description,
    price,
    category,
    images: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
    bgImage: {
      public_id: myCloud2.public_id,
      url: myCloud2.secure_url,
    },
    user,
  });

  res.status(201).json({
    success: true,
    lawyer,
  });
});

// Review and Ratings Lawyer

exports.rateReviewLawyer = CatchAsyncErrors(async (req, res, next) => {
  const lawyer = await Lawyer.findById(req.params.id);
  const user = await User.findById(req.user.id);

  if (!lawyer) {
    return next(new ErrorHandler("Lawyer not found!!", 404));
  }

  const alreadyReviewed = lawyer.reviews.find(
    (r) => r.uname.toString() === user.name
  );

  if (alreadyReviewed) {
    return next(new ErrorHandler("Already reviewd!!", 400));
  }

  const { review, ratings } = req.body;

  const feedback = {
    uname: user.name,
    rating: ratings,
    comment: review,
  };

  lawyer.reviews.push(feedback);
  lawyer.numOfReviews = lawyer.reviews.length;

  let avg = 0;

  lawyer.reviews.forEach((rev) => {
    avg = avg + rev.rating;
  });

  lawyer.ratings = avg / lawyer.reviews.length;

  await lawyer.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Ratings and Review Updated",
  });
});

// Get All Review of Lawyer

exports.getAllReview = catchAsyncErrors(async (req, res, next) => {
  const lawyer = await Lawyer.findById(req.params.id);

  if (!lawyer) {
    return next(new ErrorHandler("Lawyer not found!!", 404));
  }

  res.status(200).json({
    success: true,
    reviews: lawyer.reviews,
  });
});

// Get All Lawyer

exports.getAllLawyers = CatchAsyncErrors(async (req, res) => {
  let resultPerPage = 10;
  const lawyerCount = await Lawyer.countDocuments();

  const apiFeature = new ApiFeatures(Lawyer.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage)
    .sort();

  const lawyer = await apiFeature.query;

  res.status(200).json({
    success: true,
    lawyerCount: lawyerCount,
    lawyer,
  });
});

// Lawyer Details

exports.getLawyerDetails = CatchAsyncErrors(async (req, res, next) => {
  const lawyer = await Lawyer.findById(req.params.id);

  if (!lawyer) {
    return next(new ErrorHandler("Lawyer not found!!", 404));
  }

  res.status(200).json({
    success: true,
    lawyer,
  });
});

// Update Lawyer ------> Admin

exports.updateLawyer = CatchAsyncErrors(async (req, res, next) => {
  let lawyer = await Lawyer.findById(req.params.id);

  if (!lawyer) {
    return next(new ErrorHandler("Lawyer not found!!", 404));
  }

  lawyer = await Lawyer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Lawyer Updated",
  });
});

// Delete Lawyer ------> Admin

exports.deleteLawyer = CatchAsyncErrors(async (req, res, next) => {
  const lawyer = await Product.findById(req.params.id);

  if (!lawyer) {
    return next(new ErrorHandler("Lawyer not found!!", 404));
  }

  await lawyer.deleteOne();

  res.status(200).json({
    success: true,
    message: "Lawyer Deleted",
  });
});
