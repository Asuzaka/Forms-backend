const catchAsync = require("../services/CatchAsync");
const User = require("../models/userModel");
const ResponseError = require("../services/ResponseError");
const apiFeatures = require("../services/ApiFeatures");

exports.getUsers = catchAsync(async (req, res, next) => {
  const arrayofIds = req.body.users;

  if (!arrayofIds) return next(new ResponseError("No user IDs provided", 400));
  const users = await User.find({ _id: { $in: arrayofIds } });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const query = User.find();

  const features = new apiFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const users = await features.query;

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.blockUsers = catchAsync(async (req, res, next) => {
  let ids = req.body.users;

  if (!ids) {
    return next(new ResponseError("No user IDs provided", 400));
  }

  if (!Array.isArray(ids)) ids = [ids];

  await User.updateMany({ _id: { $in: ids } }, { $set: { status: "blocked" } });

  res.status(200).json({
    status: "success",
    message: `Blocked ${ids.length} user(s).`,
  });
});

exports.unBlockUsers = catchAsync(async (req, res, next) => {
  let ids = req.body.users;

  if (!ids) {
    return next(new ResponseError("No user IDs provided", 400));
  }

  if (!Array.isArray(ids)) ids = [ids];

  await User.updateMany({ _id: { $in: ids } }, { $set: { status: "active" } });

  res.status(200).json({
    status: "success",
    message: `Unblocked ${ids.length} user(s).`,
  });
});

exports.changeToAdmin = catchAsync(async (req, res, next) => {
  let ids = req.body.users;

  if (!ids) {
    return next(new ResponseError("No user IDs provided", 400));
  }

  if (!Array.isArray(ids)) ids = [ids];

  await User.updateMany({ _id: { $in: ids } }, { $set: { role: "admin" } });

  res.status(200).json({
    status: "success",
    message: `Changed to Admin ${ids.length} user(s).`,
  });
});

exports.changeToUser = catchAsync(async (req, res, next) => {
  let ids = req.body.users;

  if (!ids) {
    return next(new ResponseError("No user IDs provided", 400));
  }

  if (!Array.isArray(ids)) ids = [ids];

  await User.updateMany({ _id: { $in: ids } }, { $set: { role: "user" } });

  res.status(200).json({
    status: "success",
    message: `Changed to User ${ids.length} user(s).`,
  });
});

exports.changeToUser = catchAsync(async (req, res, next) => {
  let ids = req.body.users;

  if (!ids) {
    return next(new ResponseError("No user IDs provided", 400));
  }

  if (!Array.isArray(ids)) ids = [ids];

  await User.updateMany({ _id: { $in: ids } }, { $set: { role: "user" } });

  res.status(200).json({
    status: "success",
    message: `Changed to User ${ids.length} user(s).`,
  });
});

exports.deleteUsers = catchAsync(async (req, res, next) => {
  let ids = req.body.users;

  if (!ids) {
    return next(new ResponseError("No user IDs provided", 400));
  }

  if (!Array.isArray(ids)) ids = [ids];

  const result = await User.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    status: "success",
    message: `Deleted ${result.deletedCount} user(s).`,
  });
});
