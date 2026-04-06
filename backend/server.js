require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const teacherRoutes = require("./routes/teacherRoutes");
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const teacherLeaveRoutes = require("./routes/teacherLeaveRoutes");
const autoAllocateRoutes = require("./routes/autoAllocateRoutes");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const defaultLocalOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
];
const allowedOrigins = (process.env.CLIENT_ORIGIN || defaultLocalOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

if (!process.env.MONGO_URI) {
    throw new Error("Missing required environment variable: MONGO_URI");
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser tools (no Origin header) and configured browser origins.
        if (!origin || allowedOrigins.includes(origin) || localOriginPattern.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas connected successfully"))
    .catch(err => console.log(err));

// ROUTES
app.use("/auth", authRoutes);
app.use("/teachers", teacherRoutes);
app.use("/exams", examRoutes);
app.use("/teacher-leave", teacherLeaveRoutes);
app.use("/auto-allocate", autoAllocateRoutes);

app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);