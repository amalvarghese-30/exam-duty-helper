#!/usr/bin/env node

/**
 * Migration Script - Phase 1 Integration
 * 
 * This script helps migrate your existing system to the new allocation engine.
 * 
 * Run: node migrate-to-phase1.js
 */

const mongoose = require("mongoose");
const path = require("path");

// Models
const Teacher = require("./models/Teacher");
const Exam = require("./models/Exam");
const DepartmentPolicy = require("./models/DepartmentPolicy");
const DutyAllocation = require("./models/DutyAllocation");

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/exam-duty-helper";

/**
 * Main migration function
 */
async function migrate() {
    try {
        console.log("🚀 Starting Phase 1 Migration...\n");

        // Connect to MongoDB
        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");

        // Step 1: Add fields to existing teachers
        console.log("📝 Step 1: Updating Teacher schema...");
        const teacherResult = await Teacher.updateMany(
            {},
            {
                $setOnInsert: {
                    seniority_years: 0,
                    reliability_score: 0.8,
                    is_active: true,
                    allowed_roles: ["invigilator"],
                },
            },
            { upsert: false }
        );
        console.log(
            `✅ Updated ${teacherResult.modifiedCount} teachers\n`
        );

        // Step 2: Add fields to existing exams
        console.log("📝 Step 2: Updating Exam schema...");
        const examResult = await Exam.updateMany(
            { required_roles: { $exists: false } },
            {
                $set: {
                    required_roles: { invigilator: 1 },
                    category: "regular",
                    is_locked: false,
                },
            }
        );
        console.log(`✅ Updated ${examResult.modifiedCount} exams\n`);

        // Step 3: Create default department policies
        console.log("📝 Step 3: Creating default DepartmentPolicies...");

        // Get all unique departments
        const departments = await Teacher.distinct("department");
        console.log(`   Found ${departments.length} departments`);

        for (const dept of departments) {
            if (!dept) continue;

            const exists = await DepartmentPolicy.findOne({
                department: dept,
            });

            if (!exists) {
                await DepartmentPolicy.create({
                    department: dept,
                    max_daily_duties: 3,
                    allow_external_allocation: true,
                    priority_subjects: [],
                    min_gap_between_duties_hours: 1,
                    seniority_override: false,
                    min_seniority_years: 0,
                    role_preferences: {
                        supervisor: { min_seniority: 5 },
                        coordinator: { min_seniority: 8 },
                        relief: { min_seniority: 1 },
                        invigilator: { min_seniority: 0 },
                    },
                    target_duty_range: { min: 1, max: 5 },
                    is_active: true,
                });

                console.log(`   ✅ Created policy for ${dept}`);
            }
        }
        console.log();

        // Step 4: Add role field to existing allocations
        console.log("📝 Step 4: Updating DutyAllocation schema...");
        const allocResult = await DutyAllocation.updateMany(
            { role: { $exists: false } },
            {
                $set: {
                    role: "invigilator",
                    allocation_method: "legacy",
                    allocation_score: 0,
                    is_locked: false,
                    admin_override: false,
                },
            }
        );
        console.log(
            `✅ Updated ${allocResult.modifiedCount} allocations\n`
        );

        // Step 5: Verification
        console.log("📊 Verification Report:");
        const teacherCount = await Teacher.countDocuments();
        const examCount = await Exam.countDocuments();
        const policyCount = await DepartmentPolicy.countDocuments();
        const allocCount = await DutyAllocation.countDocuments();

        console.log(`   Teachers: ${teacherCount}`);
        console.log(`   Exams: ${examCount}`);
        console.log(`   Policies: ${policyCount}`);
        console.log(`   Allocations: ${allocCount}\n`);

        // Step 6: Check for any issues
        console.log("🔍 Data Quality Checks:");

        const teachersWithoutSeniority = await Teacher.countDocuments({
            seniority_years: { $exists: false },
        });
        console.log(
            `   Teachers without seniority: ${teachersWithoutSeniority}`
        );

        const examsWithoutRoles = await Exam.countDocuments({
            required_roles: { $exists: false },
        });
        console.log(`   Exams without required_roles: ${examsWithoutRoles}`);

        console.log("\n✨ Migration completed successfully!\n");

        // Step 7: Print setup instructions
        console.log("📋 Next Steps:");
        console.log(
            "   1. Start Python scheduler: cd ai-engine && python api.py"
        );
        console.log(
            "   2. Add routes to backend: require('./routes/allocationRoutes')"
        );
        console.log(
            '   3. Test: curl -X POST http://localhost:3000/api/allocations/run'
        );
        console.log(
            "   4. Review PHASE_1_IMPLEMENTATION.md for configuration details\n"
        );

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

// Run migration
migrate();
