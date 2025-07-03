const User = require("../models/userModel");
const Template = require("../models/templateModel");
const Form = require("../models/formModel");
const Comment = require("../models/commentModel");
const catchAsync = require("../services/CatchAsync");
const ResponseError = require("../services/ResponseError");
const apiFeatures = require("../services/ApiFeatures");

exports.globalSearch = catchAsync(async (req, res, next) => {
  const { q } = req.query;
  if (!q) return next(new ResponseError("Missing search query", 400));

  const regex = new RegExp(q, "i");

  const templateQuery = Template.find({
    $or: [{ title: regex }, { tags: regex }],
  }).select("title tags topic _id");

  const commentQuery = Comment.find({ text: regex }).select("text _id");

  const templateFeatures = new apiFeatures(templateQuery, req.query)
    .sort()
    .pagination();

  const commentFeatures = new apiFeatures(commentQuery, req.query)
    .sort()
    .pagination();

  const [templates, comments] = await Promise.all([
    templateFeatures.query,
    commentFeatures.query,
  ]);

  res.status(200).json({
    status: "success",
    results: {
      templates: templates.length,
      comments: comments.length,
    },
    data: { templates, comments },
  });
});

exports.userSearch = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q) return next(new ResponseError("Missing search query", 400));

  const regex = new RegExp(q, "i");

  const userQuery = User.find({
    $or: [{ name: regex }, { email: regex }],
  });

  const userFeatures = new apiFeatures(userQuery, req.query)
    .sort()
    .pagination()
    .limitFields();

  const users = await userFeatures.query;

  res.status(200).json({
    status: "success",
    data: users,
  });
});

exports.searchTemplate = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q) return next(new ResponseError("Missing search query", 400));

  const regex = new RegExp(q, "i");

  const templateQuery = Template.find({
    $or: [{ title: regex }],
  });

  const templateFeatures = new apiFeatures(templateQuery, req.query)
    .sort()
    .pagination()
    .limitFields();

  const templates = await templateFeatures.query;

  res.status(200).json({
    status: "success",
    data: templates,
  });
});

exports.searchTags = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q) return next(new ResponseError("Missing search query", 400));

  const regex = new RegExp(q, "i");

  const result = await Template.aggregate([
    { $unwind: "$tags" },
    { $match: { tags: { $regex: regex } } },
    { $group: { _id: null, tags: { $addToSet: "$tags" } } },
    { $project: { _id: 0, tags: 1 } },
  ]);

  const tags = result[0]?.tags || [];

  const limited3Tags = tags
    .sort((a, b) => a.indexOf(q) - b.indexOf(q))
    .slice(0, 3);

  res.status(200).json({
    status: "success",
    data: limited3Tags,
  });
});

exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const [totalTemplates, totalUsers, totalAdmins, totalSubmissions] =
    await Promise.all([
      Template.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Form.countDocuments(),
    ]);

  res.status(200).json({
    status: "success",
    data: {
      totalTemplates,
      totalUsers,
      totalAdmins,
      totalSubmissions,
    },
  });
});
