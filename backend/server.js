require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const teacherDashboardRoutes = require("./routes/teacherDashboardRoutes");

const examRoutes = require("./routes/examRoutes");
const teacherLeaveRoutes = require("./routes/teacherLeaveRoutes");

const autoAllocateRoutes = require("./routes/autoAllocateRoutes");
const allocationRoutes = require("./routes/allocationRoutes");

const swapRoutes = require("./routes/swapRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

const fairnessRoutes = require("./routes/fairnessRoutes");
const policyRoutes = require("./routes/policyRoutes");

const app = express();

// ==============================
// CORS CONFIGURATION
// ==============================

app.use(
    cors({
        origin: "http://localhost:8080",
        credentials: true,
    })
);

app.use(express.json());

// ==============================
// DATABASE CONNECTION
// ==============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas connected successfully"))
    .catch((err) => console.log(err));

// ==============================
// ROUTES
// ==============================

// Authentication
app.use("/api/auth", authRoutes);

// Teacher core APIs
app.use("/api/teacher", teacherRoutes);

// Teacher dashboard APIs
app.use("/api/teacher/dashboard", teacherDashboardRoutes);

// Exams
app.use("/api/exams", examRoutes);

// Teacher leave
app.use("/api/teacher/leave", teacherLeaveRoutes);

// Auto allocation engine
app.use("/api/auto-allocate", autoAllocateRoutes);

// Allocation management
app.use("/api/allocations", allocationRoutes);

// Swap recommendation system
app.use("/api/swaps", swapRoutes);

// Admin dashboard
app.use("/api/admin", adminDashboardRoutes);

// Fairness analytics
app.use("/api/fairness", fairnessRoutes);

// NLP policy engine
app.use("/api/policy", policyRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// ==============================
// SERVER START
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});