const Template = require("../models/templateModel");
const ResponseError = require("../services/ResponseError");
const catchAsync = require("../services/CatchAsync");
const apiFeatures = require("../services/ApiFeatures");

const isAuthorized = (reqUser, docCreator) => {
  return reqUser.role === "admin" || docCreator.toString() === reqUser.id;
};

exports.createTemplate = catchAsync(async (req, res, next) => {
  const template = await Template.create({
    ...req.body,
    creator: req.user.id,
  });
  res.status(201).json({ status: "success", data: template });
});

exports.getAllTemplates = catchAsync(async (req, res, next) => {
  const query = Template.find();

  const features = new apiFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  const templates = await features.query;

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: {
      templates,
    },
  });
});

exports.getUserTemplates = catchAsync(async (req, res) => {
  const query = Template.find({ creator: req.user.id });

  const features = new apiFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const templates = await features.query;

  res
    .status(200)
    .json({ status: "success", results: templates.length, data: templates });
});

exports.getTemplate = catchAsync(async (req, res, next) => {
  const template = await Template.findById(req.params.id);
  if (!template) return next(new ResponseError("Template not found", 404));

  const isPublic = template.access === "public";
  const isAllowed = template.allowedUsers?.includes(req.user.id);

  if (!isPublic && !isAuthorized(req.user, template.creator) && !isAllowed) {
    return next(new ResponseError("Access denied", 403));
  }

  res.status(200).json({ status: "success", data: template });
});

exports.updateTemplate = catchAsync(async (req, res, next) => {
  const template = await Template.findById(req.params.id);

  if (!template) return next(new customError("Template not found", 404));

  if (!isAuthorized(req.user, template.creator)) {
    return next(new customError("You cannot update this template", 403));
  }

  const updatedTemplate = await Template.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({ status: "success", data: updatedTemplate });
});

exports.deleteTemplate = catchAsync(async (req, res, next) => {
  const template = await Template.findById(req.params.id);
  if (!template) return next(new ResponseError("Template not found", 404));
  if (!isAuthorized(req.user, template.creator)) {
    return next(new ResponseError("You cannot delete this template", 403));
  }

  await template.deleteOne();
  res.status(204).json({ status: "success", data: null });
});

exports.deleteMultipleTemplates = catchAsync(async (req, res, next) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ResponseError("No template IDs provided", 400));
  }

  const templates = await Template.find({ _id: { $in: ids } });

  await Template.deleteMany({ _id: { $in: ids } });

  res.status(200).json({
    status: "success",
    message: `Deleted ${templates.length} templates`,
  });
});

exports.getLatestTemplates = catchAsync(async (req, res, next) => {
  const templates = await Template.find()
    .sort("-createdAt")
    .limit(6)
    .populate("creator", "name photo")
    .select("creator description title image likes tags createdAt");

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: templates,
  });
});

exports.getPopularByLikes = catchAsync(async (req, res, next) => {
  const templates = await Template.find()
    .sort("-likesCount")
    .limit(6)
    .populate("creator", "name photo")
    .select("creator description title image likes tags createdAt");

  res.status(200).json({
    status: "success",
    results: templates.length,
    data: templates,
  });
});

exports.getTagStatistics = catchAsync(async (req, res, next) => {
  const tagStats = await Template.aggregate([
    { $unwind: "$tags" },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  res.status(200).json({
    status: "success",
    results: tagStats.length,
    data: tagStats,
  });
});
