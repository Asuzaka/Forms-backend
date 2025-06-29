const mongoose = require("mongoose");

const baseQuestion = {
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["singleLine", "multiLine", "numberInput", "checkbox"],
  },
  required: { type: Boolean, default: false },
  text: { type: String, required: true },
  visible: { type: Boolean, default: true },
  description: String,
};

const checkboxOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const questionUnionSchema = new mongoose.Schema(
  {
    ...baseQuestion,
    placeholder: String,
    multiple: Boolean,
    options: [checkboxOptionSchema],
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: String,
    topic: String,
    tags: [String],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    access: {
      type: String,
      enum: ["public", "restricted"],
      default: "public",
    },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    questions: [questionUnionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", templateSchema);
