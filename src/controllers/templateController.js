const Template = require("../models/templateModel");
const ResponseError = require("../services/ResponseError");
const catchAsync = require("../services/CatchAsync");
const apiFeatures = require("../services/ApiFeatures");

// Only creator or admin
const isAuthorized = (reqUser, docCreator) => {
  return reqUser.role === "admin" || docCreator.toString() === reqUser.id;
};

// Create
exports.createTemplate = catchAsync(async (req, res, next) => {
  const template = await Template.create({
    ...req.body,
    creator: req.user.id,
  });
  res.status(201).json({ status: "success", data: template });
});

// Get all templates of logged-in user
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

// Get one template
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

// Patch template
exports.updateTemplate = catchAsync(async (req, res, next) => {
  const template = await Template.findById(req.params.id);
  if (!template) return next(new ResponseError("Template not found", 404));
  if (!isAuthorized(req.user, template.creator)) {
    return next(new ResponseError("You cannot update this template", 403));
  }

  Object.assign(template, req.body);
  await template.save();
  res.status(200).json({ status: "success", data: template });
});

// Delete
exports.deleteTemplate = catchAsync(async (req, res, next) => {
  const template = await Template.findById(req.params.id);
  if (!template) return next(new ResponseError("Template not found", 404));
  if (!isAuthorized(req.user, template.creator)) {
    return next(new ResponseError("You cannot delete this template", 403));
  }

  await template.deleteOne();
  res.status(204).json({ status: "success", data: null });
});
