require('dotenv').config();
const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');

const testTeachers = [
    {
        name: 'Dr. Anjali Mehta',
        email: 'anjali.mehta@univtest.edu',
        department: 'Computer Science',
        subject: 'Data Structures',
        seniority_years: 8,
        totalDuties: 0,
        is_active: true
    },
    {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@univtest.edu',
        department: 'Computer Science',
        subject: 'Algorithms',
        seniority_years: 5,
        totalDuties: 0,
        is_active: true
    },
    {
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@univtest.edu',
        department: 'Mathematics',
        subject: 'Calculus',
        seniority_years: 10,
        totalDuties: 0,
        is_active: true
    }
];

async function createTestTeachers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        for (const teacher of testTeachers) {
            const existing = await Teacher.findOne({ email: teacher.email });
            if (!existing) {
                await Teacher.create(teacher);
                console.log(`✅ Created teacher: ${teacher.name}`);
            } else {
                console.log(`⚠️ Teacher already exists: ${teacher.email}`);
            }
        }

        console.log('\n✅ Test teachers created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createTestTeachers();