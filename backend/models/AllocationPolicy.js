const mongoose = require("mongoose");

const allocationPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "default",
      unique: true,
    },
    rulesText: {
      type: String,
      default:
        "1. Teachers should not invigilate their own subject.\n2. Teachers on leave should not be assigned.\n3. Distribute duties so each teacher gets approximately equal total duties.\n4. Avoid assigning teachers multiple times on same date.",
    },
    autoRunOnExamChange: {
      type: Boolean,
      default: false,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AllocationPolicy", allocationPolicySchema);
