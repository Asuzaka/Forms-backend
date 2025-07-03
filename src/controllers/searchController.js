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

  const templatesByTitle = await Template.find({ title: regex }).select(
    "_id title"
  );

  const templatesByTagsRaw = await Template.find({ tags: regex }).select(
    "_id title tags"
  );

  const tagGroups = {};
  for (const template of templatesByTagsRaw) {
    const matchedTags = template.tags.filter((tag) => regex.test(tag));
    for (const tag of matchedTags) {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push({ _id: template._id, title: template.title });
    }
  }

  const groupedTags = Object.entries(tagGroups).map(([tag, templates]) => ({
    tag,
    templates,
  }));

  const comments = await Comment.find({ text: regex })
    .select("text template")
    .populate("template", "_id title");

  const formattedComments = comments.map((c) => ({
    text: c.text,
    template: c.template?._id || null,
  }));

  res.status(200).json({
    status: "success",
    data: {
      templates: templatesByTitle,
      tags: groupedTags,
      comments: formattedComments,
    },
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
