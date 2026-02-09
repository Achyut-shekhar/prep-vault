const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    resourceCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Vault", vaultSchema);
