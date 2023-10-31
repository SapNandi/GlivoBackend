const User = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandler");
const CatchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = CatchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  const decodedData = jwt.verify(token, process.env.SECRET);

  req.user = await User.findById(decodedData.id);
  next();
  //   console.log(token);
});

exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler(`Role : ${req.user.role} is not authorised for the resource`, 403));
    }
    next();
  };
};
