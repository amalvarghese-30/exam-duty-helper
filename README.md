AI Exam Duty Allocation System

An intelligent web-based platform that automates exam invigilation duty assignment using constraint-based allocation logic. The system ensures fair workload distribution, avoids subject conflicts, respects teacher availability, and streamlines exam-cell operations.

Project Overview

The AI Exam Duty Allocation System helps academic institutions automatically assign invigilation duties to teachers based on multiple constraints such as:

Subject conflict avoidance
Teacher availability
Leave records
Fair workload balancing
Exam timetable slots

The system reduces manual scheduling effort and improves transparency and efficiency in exam duty management.

Key Features
Admin (Exam Cell)
Upload exam timetable
View teacher availability
Run automatic duty allocation
Monitor workload distribution
Manage teacher records
View allocation reports
Teacher
Register/Login securely
View assigned duties
Submit availability
Apply for leave
Track total duties assigned
AI Allocation Logic

The system uses a constraint-based scheduling algorithm that:

Filters teachers unavailable during exam slot
Removes teachers assigned to same subject exam
Excludes teachers on leave
Selects teacher with minimum duty count
Updates workload dynamically

This models a real-world Constraint Satisfaction Problem (CSP) commonly used in:

Staff scheduling
Exam timetabling
Workforce optimization
Resource allocation systems
Tech Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
React Router
Axios
ShadCN UI
Recharts
Backend
Node.js
Express.js
MongoDB Atlas
Mongoose
JWT Authentication
bcrypt password hashing

AI Duty Allocation

Automatically assigns teachers to exams while ensuring:

No teacher invigilates their own subject or if on leave.
Duties are distributed fairly among all teachers.
No teacher is assigned multiple times on the same date.

AI parses the rules, generates a roster, and redistributes duties if needed to maintain fairness.

