const mongoose = require("mongoose");

const checkboxOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    selected: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionBase = {
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

const questionSchemas = [
  new mongoose.Schema(
    {
      ...questionBase,
      type: { type: String, enum: ["singleLine"], required: true },
      answer: String,
      placeholder: String,
      maxLength: Number,
    },
    { _id: false }
  ),

  new mongoose.Schema(
    {
      ...questionBase,
      type: { type: String, enum: ["multiLine"], required: true },
      answer: String,
      lines: Number,
      placeholder: String,
    },
    { _id: false }
  ),

  new mongoose.Schema(
    {
      ...questionBase,
      type: { type: String, enum: ["numberInput"], required: true },
      answer: Number,
    },
    { _id: false }
  ),

  new mongoose.Schema(
    {
      ...questionBase,
      type: { type: String, enum: ["checkbox"], required: true },
      options: [checkboxOptionSchema],
      multiple: Boolean,
    },
    { _id: false }
  ),
];

const formTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Template must have a title"],
    },
    description: String,
    image: String,
    topic: {
      type: String,
      enum: ["education", "quiz", "other"],
      default: "other",
      required: [true, "Template must have a topic"],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Template must have a creator"],
    },
    questions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    thumbail: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Template", formTemplateSchema);
