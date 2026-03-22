require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const teacherRoutes = require("./routes/teacherRoutes");
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const dutyRoutes = require("./routes/dutyRoutes");
const teacherLeaveRoutes = require("./routes/teacherLeaveRoutes");
const autoAllocateRoutes = require("./routes/autoAllocateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas connected successfully"))
    .catch(err => console.log(err));

// ROUTES
app.use("/auth", authRoutes);
app.use("/teachers", teacherRoutes);
app.use("/exams", examRoutes);
app.use("/duties", dutyRoutes);
app.use("/teacher-leave", teacherLeaveRoutes);
app.use("/allocate", autoAllocateRoutes);

app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
);