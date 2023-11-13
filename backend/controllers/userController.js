const crypto = require("crypto");
const ErrorHandler = require("../utils/ErrorHandler");
const cloudinary = require("cloudinary");
const CatchAsyncErrors = require("../Middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const sendSms = require("../utils/sendSms");

const User = require("../models/userModel");
const catchAsyncErrors = require("../Middleware/catchAsyncErrors");

// Register a user
exports.registerUser = CatchAsyncErrors(async (req, res, next) => {
  const { name, email, password, country, state } = req.body;

  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatar",
    width: 150,
    crop: "scale",
  });

  const user = await User.create({
    name,
    email,
    password,
    country,
    state,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(user, 201, res);
});

// Login User
exports.loginUser = CatchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter Email and Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email and Password", 401));
  }

  const isPassword = await user.comparePassword(password);

  if (!isPassword) {
    return next(new ErrorHandler("Invalid Email and Password", 401));
  }

  sendToken(user, 200, res);
});

// Logout User

exports.logoutUser = CatchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out Successfully!!",
  });
});

// Forgot Password

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("User not found!!", 404));
  }

  // Get Reset Password Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/api.v1/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf You have not requested this ignore!!`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("Reset password token is invalid or is expired", 400)
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match", 400));
  }

  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;

  await user.save();
  sendToken(user, 200, res);
});

// Get User Details

exports.getMe = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});

// update User password

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHander("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// update User Profile

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Get all users -----------> Admin

exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user -----------> Admin

exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Delete User -----------> Admin

exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});

// Request OTP for verification

exports.requestOtp = catchAsyncErrors(async (req, res, next) => {
  // sendSms();
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorHandler("User not found!!", 404));
  }

  const { number } = req.body;

  if (!number) {
    return next(new ErrorHandler("Please Phone Number", 400));
  }

  if (user.role !== "user") {
    return next(new ErrorHandler("Already seller!!", 401));
  }

  const code = await user.getOtp();
  user.phone = number;
  await user.save({ validateBeforeSave: false });

  const note = `You OTP is ${code}. Valid for 10 minutes`;

  try {
    console.log(note);
    // await sendSms({number, note});
    res.status(200).json({
      success: true,
      message: note,
    });
  } catch (error) {
    user.otp = undefined;
    user.otpExpire = undefined;
    user.phone = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// OTP Verification and Seller Upgradation

exports.updateRole = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const { code } = req.body;

  const resp = await User.findOne({
    otpExpire: { $gt: Date.now() },
  });

  if (!code && !resp) {
    user.phone = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("No OTP And OTP Expired!!", 400));
  } else if (!code) {
    return next(new ErrorHandler("Please enter OTP", 400));
  }

  if (!user) {
    user.phone = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("User not found!!", 404));
  }

  const isOtp = await user.compareOtp(code);

  if (!isOtp && !resp) {
    user.phone = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("User Not Found Or Invalid OTP And OTP Expired!!", 401));
  } else if (!isOtp) {
    return next(new ErrorHandler("User Not Found Or Invalid OTP", 401));
  }

  if (!resp) {
    user.phone = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler("OTP is invalid or is expired", 400));
  }

  user.role = "seller";
  user.otp = undefined;
  user.otpExpire = undefined;

  await user.save({ validateBeforeSave: false });

  sendToken(resp, 200, res);
});
