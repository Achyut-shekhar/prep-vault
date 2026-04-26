const mongoose = require("mongoose");

const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    model: {
      type: String,
      default: "",
    },
    sourceUrl: {
      type: String,
      default: "",
    },
    requestType: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("AiUsageLog", aiUsageLogSchema);
