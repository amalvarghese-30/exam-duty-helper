require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const teacherRoutes = require("./routes/teacherRoutes");
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const teacherLeaveRoutes = require("./routes/teacherLeaveRoutes");
const autoAllocateRoutes = require("./routes/autoAllocateRoutes");
const allocationRoutes = require("./routes/allocationRoutes");
const swapRoutes = require("./routes/swapRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const teacherDashboardRoutes = require("./routes/teacherDashboardRoutes");
const fairnessRoutes = require("./routes/fairnessRoutes");
// const phase3Routes = require("./routes/phase3Routes"); // TODO: Uncomment when Phase 3 controllers are created

const app = express();

app.use(cors({
    origin: "http://localhost:8080",
    credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas connected successfully"))
    .catch(err => console.log(err));

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/teacher-leave", teacherLeaveRoutes);
app.use("/api/auto-allocate", autoAllocateRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/teacher", teacherDashboardRoutes);
app.use("/api/fairness", fairnessRoutes);
// app.use("/api/phase3", phase3Routes); // TODO: Uncomment when Phase 3 controllers are created

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
);