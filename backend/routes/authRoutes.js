const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Teacher = require("../models/Teacher");

// REGISTER
router.post("/register", async (req, res) => {
    console.log("📝 Registration request received:", req.body);

    try {
        const { fullName, email, password, department, subject } = req.body;

        // Validate required fields
        if (!fullName || !email || !password) {
            console.log("❌ Missing required fields:", { fullName, email, password });
            return res.status(400).json({
                error: "Missing required fields: fullName, email, and password are required"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
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

        // Create teacher profile automatically with department and subject
        try {
            await Teacher.create({
                name: fullName,
                email: email,
                department: department || "",
                subject: subject || "",
                totalDuties: 0,
                seniority_years: 0,
                reliability_score: 0.8,
                allowed_roles: ["invigilator"],
                is_active: true
            });
            console.log("✅ Teacher profile created for:", email, "Dept:", department, "Subject:", subject);
        } catch (teacherErr) {
            console.log("⚠️ Teacher profile creation failed:", teacherErr.message);
            // Don't fail registration if teacher profile creation fails
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
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
        console.error("Error stack:", err.stack);
        res.status(500).json({
            error: err.message,
            details: err.stack
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    console.log("🔐 Login request received:", { email: req.body.email });

    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });
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

        // Fetch teacher profile for additional info
        let teacher = null;
        try {
            teacher = await Teacher.findOne({ email });
        } catch (err) {
            console.log("⚠️ Could not fetch teacher profile:", err.message);
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        console.log("✅ Login successful for:", email);

        res.json({
            token,
            role: user.role,
            user: {
                id: user._id,
                email: user.email,
                name: user.fullName,
                department: teacher?.department || "",
                subject: teacher?.subject || ""
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