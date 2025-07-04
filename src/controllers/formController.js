const Form = require("../models/formModel");
const Template = require("../models/templateModel");
const ResponseError = require("../services/ResponseError");
const catchAsync = require("../services/CatchAsync");
const mongoose = require("mongoose");

exports.submitForm = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ResponseError("Template not found", 404));
  }

  if (!id) return next(new ResponseError("No id was provided", 400));
  const { answers } = req.body;
  const template = await Template.findById(id);

  if (!template) return next(new ResponseError("Template not found", 404));

  const isPublic = template.access === "public";
  const isAllowed = template.allowedUsers?.includes(req.user.id);
  const isOwner = template.creator.toString() === req.user.id;

  if (!isPublic && !isOwner && !isAllowed && req.user.role !== "admin") {
    return next(
      new ResponseError("You are not allowed to submit this form", 403)
    );
  }

  const newForm = await Form.create({
    template: id,
    creator: template.creator,
    user: req.user.id,
    answers,
    title: `Submission for ${template.title}`,
  });

  res.status(201).json({ status: "success", data: newForm });
});

exports.getTemplateForms = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    return next(new ResponseError("Template not found", 404));
  }

  const template = await Template.findById(req.params.templateId);

  if (!template) return next(new ResponseError("Template not found", 404));

  const isOwner = template.creator.toString() === req.user.id;
  if (!isOwner && req.user.role !== "admin") {
    return next(new ResponseError("Access denied", 403));
  }

  const forms = await Form.find({ template: req.params.templateId })
    .populate("user", "photo name")
    .select("createdAt title");
  res.status(200).json({ status: "success", data: forms });
});

exports.getForm = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ResponseError("Form not found", 404));
  }

  const form = await Form.findById(req.params.id).populate(
    "template",
    "creator description image title"
  );

  if (!form) return next(new ResponseError("Form not found", 404));

  const template = form.template;
  const isOwner = template.creator.toString() === req.user.id;
  const isSubmitter = form.creator._id.toString() === req.user.id;

  if (!isOwner && !isSubmitter && req.user.role !== "admin") {
    return next(new ResponseError("Access denied", 403));
  }

  res.status(200).json({ status: "success", data: form });
});

exports.TemplateForForm = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ResponseError("Form not found", 404));
  }
  const template = await Template.findById(id);

  if (!template) return next(new ResponseError("Form not found", 404));

  if (!template.publish) {
    return next(new ResponseError("Form not found", 404));
  }

  res.status(200).json({ status: "success", data: template });
});
