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
Project Structure
exam-duty-helper/
│
├── src/                  # React frontend
├── backend/
│   ├── models/
│   │   ├── Teacher.js
│   │   ├── User.js
│   │   ├── Exam.js
│   │   ├── DutyAllocation.js
│   │   └── TeacherLeave.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── teacherRoutes.js
│   │   └── autoAllocateRoutes.js
│   │
│   └── server.js
│
└── README.md
Installation Guide
Clone Repository
git clone https://github.com/yourusername/ai-exam-duty-allocation.git
cd ai-exam-duty-allocation
Frontend Setup
npm install
npm run dev

Runs at:

http://localhost:5173
Backend Setup
cd backend
npm install
npm run dev

Runs at:

http://localhost:5000
Environment Variables

Create:

backend/.env

Example:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
Database Collections

MongoDB automatically creates:

users
teachers
exams
dutyallocations
teacherleaves
API Endpoints
Authentication
POST /auth/register
POST /auth/login
Teachers
GET /teachers
GET /teachers/email/:email
POST /teachers
PUT /teachers/:id
DELETE /teachers/:id
Allocation Engine
POST /allocate/auto-allocate

Automatically assigns duties using AI-based scheduling logic.

Example Allocation Flow
Admin uploads exam timetable
        ↓
Teachers submit availability
        ↓
System checks constraints
        ↓
Auto allocation engine runs
        ↓
Teachers receive assigned duties
Future AI Enhancements (Planned)
NLP-based timetable parser
Leave request text classification
ML-based workload prediction
Priority-based teacher ranking
Conflict-aware optimization scoring
Screenshots (Add Later)

You can include:

/screenshots/login.png
/screenshots/admin-dashboard.png
/screenshots/teacher-dashboard.png
/screenshots/allocation-results.png
Academic Relevance

This project demonstrates:

Constraint Satisfaction Algorithms
Workforce Scheduling Optimization
Role-Based Access Systems
REST API Design
Secure Authentication
MongoDB Schema Design
Full-stack AI-assisted automation workflow

Suitable for:

NLP Mini Project
AI Mini Project
Web Engineering Project
Final Year System Design Project
Author

Amal Varghese
B.Tech Computer Science

GitHub:

https://github.com/amalvarghese-30
