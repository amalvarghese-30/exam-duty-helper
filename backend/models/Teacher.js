const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    department: {
        type: String,
        default: ""
    },

    subject: {
        type: String,
        default: ""
    },

    availability: [
        {
            date: String,
            slot: String
        }
    ],

    totalDuties: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model("Teacher", teacherSchema);

teacherSchema.methods.getWorkloadCategory = function () {
if (this.totalDuties === 0) return "LOW";
if (this.totalDuties <= 2) return "MEDIUM";
return "HIGH";
};
