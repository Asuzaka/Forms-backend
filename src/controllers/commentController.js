const Comment = require("../models/commentModel");
const ResponseError = require("../services/ResponseError");
const catchAsync = require("../services/CatchAsync");

exports.getCommentsByTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  if (!templateId)
    return next(new ResponseError("no template Id was providede", 400));

  const comments = await Comment.find({ template: templateId })
    .populate("user", "name photo")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: comments.length,
    data: comments,
  });
});
