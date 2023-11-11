const Order = require("../models/orderModel");
const Lawyer = require("../models/lawyerModel");
const User = require("../models/userModel");
const ErrorHander = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../Middleware/catchAsyncErrors");

// Create new Order
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const { orderItems, paymentInfo, itemsPrice, taxPrice, totalPrice } =
    req.body;

  const user = await User.findById(req.user.id);

  const order = await Order.create({
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  orderItems.forEach(async (order) => {
    await updateStock(order.product, order.quantity, order.type);
    const lawyer = await Lawyer.findById(order.product);
    const details = {
      username: user.name,
      email: user.email,
    };
    // if (!lawyer.customer.includes(details.email)) {
    //   console.log(lawyer.customer.find);
    //   // lawyer.customer.push(details);
    // }
    const itemExist =  lawyer.customer.find((i)=> i.email === details.email)
    if(!itemExist){
      lawyer.customer.push(details);
    }
    await lawyer.save({ validateBeforeSave: false });
  });

  // const

  res.status(201).json({
    success: true,
    order,
  });
});

// get Single Order
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// get logged in user  Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// get all Orders -- Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// update Order Status -- Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHander("You have already delivered this order", 400));
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });
  }
  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity, type) {
  const product = await Lawyer.findById(id);
  // console.log(id);
  if (type === "VIP") {
    product.special_supply -= quantity;
  } else {
    product.supply -= quantity;
  }

  await product.save({ validateBeforeSave: false });
}

// delete Order -- Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHander("Order not found with this Id", 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});
