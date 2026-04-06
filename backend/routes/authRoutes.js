const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Teacher = require("../models/Teacher");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";

function escapeRegex(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    throw new Error("Missing required environment variable: JWT_SECRET");
}

// REGISTER
router.post("/register", async (req, res) => {
    console.log("📝 Registration request received");

    try {
        const { fullName, password } = req.body;
        const email = String(req.body.email || "").trim().toLowerCase();

        // Validate required fields
        if (!fullName || !email || !password) {
            console.log("❌ Missing required registration fields");
            return res.status(400).json({
                error: "Missing required fields: fullName, email, and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });
        if (existingUser) {
            console.log("❌ User already exists:", email);
            return res.status(400).json({
                error: "User with this email already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("✅ Password hashed successfully");

        // Create user
        const user = new User({
            fullName,
            email,
            password: hashedPassword,
            role: "teacher" // Default role
        });

        await user.save();
        console.log("✅ User created successfully:", user._id);

        // Create teacher profile automatically
        try {
            await Teacher.create({
                name: fullName,
                email: email,
                department: "",
                subject: "",
                totalDuties: 0
            });
            console.log("✅ Teacher profile created for:", email);
        } catch (teacherErr) {
            console.log("⚠️ Teacher profile creation failed:", teacherErr.message);
            // Don't fail registration if teacher profile creation fails
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("✅ Registration successful for:", email);

        res.status(201).json({
            token,
            role: user.role,
            user: {
                id: user._id,
                email: user.email,
                name: user.fullName
            }
        });

    } catch (err) {
        console.error("❌ REGISTER ERROR:", err);
        res.status(500).json({
            error: "Registration failed"
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    console.log("🔐 Login request received:", { email: req.body.email });

    try {
        const password = req.body.password;
        const email = String(req.body.email || "").trim();

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });
        if (!user) {
            console.log("❌ User not found:", email);
            return res.status(404).json({
                error: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Invalid password for:", email);
            return res.status(401).json({
                error: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("✅ Login successful for:", email);

        res.json({
            token,
            role: user.role,
            user: {
                id: user._id,
                email: user.email,
                name: user.fullName
            }
        });

    } catch (err) {
        console.error("❌ LOGIN ERROR:", err);
        res.status(500).json({
            error: err.message
        });
    }
});

module.exports = router;