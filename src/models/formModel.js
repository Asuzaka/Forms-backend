const mongoose = require("mongoose");

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

const singleLineQuestionSchema = new mongoose.Schema(
  {
    ...questionBase,
    type: { type: String, enum: ["singleLine"], required: true },
    answer: String,
    placeholder: String,
    maxLength: Number,
  },
  { _id: false }
);

const multiLineQuestionSchema = new mongoose.Schema(
  {
    ...questionBase,
    type: { type: String, enum: ["multiLine"], required: true },
    answer: String,
    lines: Number,
    placeholder: String,
  },
  { _id: false }
);

const numberInputQuestionSchema = new mongoose.Schema(
  {
    ...questionBase,
    type: { type: String, enum: ["numberInput"], required: true },
    answer: Number,
  },
  { _id: false }
);

const checkboxOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    selected: { type: Boolean, default: false },
  },
  { _id: false }
);

const checkboxQuestionSchema = new mongoose.Schema(
  {
    ...questionBase,
    type: { type: String, enum: ["checkbox"], required: true },
    options: [checkboxOptionSchema],
    multiple: Boolean,
  },
  { _id: false }
);

const questionSchema = {
  type: [mongoose.Schema.Types.Mixed],
  default: [],
};

const formSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      enum: ["education", "quiz", "other"],
      default: "other",
      required: [true, "A form must have a topic"],
    },
    description: String,
    image: String,
    title: String,
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A form must have a creator"],
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      default: null,
    },
    publishTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      default: null,
    },
    publish: {
      type: Boolean,
      default: false,
    },
    publishUrl: {
      type: String,
      default: "",
    },
    questions: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    seen: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model("Form", formSchema);
