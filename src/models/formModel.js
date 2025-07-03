const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    index: Number,
    text: String,
    id: { type: String, required: true },
    answer: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: String,
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [answerSchema],
  },
  { timestamps: true }
);

formSchema.index({ title: 1 });
formSchema.index({ template: 1 });

module.exports = mongoose.model("Form", formSchema);
