# AI-Based Exam Duty Allocation

## 🎓 Academic Details
- **Course:** Natural Language Processing (NLP)
- **Class:** Semester VI (Third Year Engineering)
- **College:** Pillai College of Engineering , You can learn more about the college by visiting the official website of Pillai College of Engineering. https://www.pce.ac.in/

## 📌 Overview
The Exam Duty Helper is an intelligent administrative solution that automates the complex task of faculty invigilation scheduling. By utilizing a Distributed Full-Stack Pipeline, the system bridges the gap between natural language institutional policies and strict algorithmic scheduling. It allows administrators to input rules in plain English, which are then parsed by AI to generate a conflict-free, fair, and explainable duty roster.

## 🎯 Objective
- Manual exam scheduling often leads to subject conflicts, unfair workload distribution, and administrative overhead. This project aims to:

- Automate Constraint Satisfaction: Eliminate manual errors in checking teacher availability and subject expertise.

- Enable Natural Language Control: Allow non-technical admins to set complex rules (e.g., "Exclude Professor X from morning slots") using LLMs.

- Provide Explainable AI (XAI): Generate human-readable justifications for every allocation to ensure transparency and trust among faculty.

## 🧠 Technologies Used
Frontend
React.js
TypeScript
Vite
Tailwind CSS
ShadCN UI Components
Recharts (analytics visualization)

Backend
Node.js
Express.js
MongoDB (Mongoose ODM)
REST API Architecture

AI Engine
Python (Flask API)
Constraint-Based Scheduling Pipeline
Gemini API (Natural Language Rule Parsing)
Simulation Predictor Module
Fairness Analysis Engine
Swap Recommendation Engine

Other Tools & Libraries
Axios (API communication)
React Router (navigation)
Sonner (notifications)
Framer Motion (UI animations)

## 📊 Dataset
The system uses a custom-generated academic scheduling dataset modeled after exam duty allocation patterns followed at Pillai College of Engineering.

Dataset includes:

- Teacher information
- Exam schedules
- Leave records
- Allocation constraints
- Department policies

Additional file:

rooms.csv — contains room numbers available for exam duty allocation

## ⚙️ Installation
Step 1: Clone Repository
git clone https://github.com/amalvarghese-30/exam-duty-helper.git
cd exam-duty-helper
Step 2: Install Frontend Dependencies
npm install
npm run dev

Frontend runs at:

http://localhost:8080
Step 3: Start Backend Server
cd backend
npm install
node server.js

Backend runs at:

http://localhost:3000
Step 4: Start AI Engine
cd ai-engine
pip install -r requirements.txt
python api.py

AI Engine runs at:

http://localhost:5000

Login as Admin
Add teacher details, exam schedule, and leave records
Enter allocation rules manually or using natural language
Run the AI allocation engine
Review fairness analytics and swap suggestions
Simulate allocation before final confirmation
Publish schedule and notify teachers

Teachers can:

View assigned duties
Check availability status
Request leave
Understand allocation reasoning via explanation assistant


## 📈 Results
The system successfully generates:

Conflict-free duty allocations
Leave-aware scheduling
Balanced workload distribution
Natural language policy interpretation
Allocation simulation previews
Swap recommendations for fairness improvement
Explainable AI-based duty assignment justification

Overall improvements achieved:

Reduced manual scheduling effort
Improved fairness across departments
Increased transparency in allocation decisions
Faster allocation workflow execution

## 🎥 Demo Video
YouTube link here

## 👥 Team Members
- Athira Saji
- Amal Varghese
- Priya Amrolkar
- Aadinath Vijeesh
- Shreyash Bansod
- Ahbin Saibu
- Abhiram Sethu
- Aswin Kumar
- Purva Badekar
- Vyas Angre
- Christopher Varghese
 
## 📌 GitHub Contributions
- Athira – AI Scheduler Engine (constraint-based allocation pipeline, fairness balancing logic, subject-conflict avoidance rules, workload equalization strategy)
- Amal – Distributed System Integration (Flask AI engine APIs, MongoDB backend connectivity, leave-aware scheduling bridge, room auto-allocation logic, email notification pipeline)
- Abhiram – Teacher Dashboard APIs (teacher lookup by email, duty retrieval endpoints, availability synchronization with allocation engine)
- Vyas – Admin Dashboard Metrics (exam statistics APIs, allocation analytics endpoints, workload visualization support)
- Christopher – Gemini NLP Rule Parser Integration (natural-language policy conversion into structured scheduling constraints)
- Abhin – Duty Allocation Persistence Layer (MongoDB allocation storage, reset pipeline, roster synchronization logic)
- Purva – Fairness Analytics Module (teacher workload tracking, duty balancing metrics, allocation validation summaries)
- Priya – Simulation Risk Prediction Interface (allocation preview workflow and visualization components)
- Aswin – Conversational Rule Editor UI (admin natural-language scheduling rule input interface)
- Shreyash – Explainable AI Assistant Integration (teacher-facing explanation chatbot for allocation reasoning)
- Aadinath – Allocation Visualization Dashboard (roster rendering components and simulation output panels)

References
  AI & NLP
Google Gemini API Documentation
https://ai.google.dev/
Gemini Python SDK Guide
https://ai.google.dev/gemini-api/docs/python
Prompt Engineering Concepts
https://ai.google.dev/docs/prompting

🟢 Backend Development
Node.js Official Documentation
https://nodejs.org/en/docs
Express.js Documentation
https://expressjs.com/
MongoDB Documentation
https://www.mongodb.com/docs/
Mongoose ODM Guide
https://mongoosejs.com/docs/

⚛️ Frontend Development
React Documentation
https://react.dev/
Vite Build Tool
https://vitejs.dev/guide/
Tailwind CSS Utility Framework
https://tailwindcss.com/docs
ShadCN UI Components
https://ui.shadcn.com/

🐍 AI Engine (Python Services)
Flask Documentation
https://flask.palletsprojects.com/
Python Official Documentation
https://docs.python.org/3/

📊 Scheduling & Constraint Logic Concepts
Constraint Satisfaction Problem (CSP) Overview
https://en.wikipedia.org/wiki/Constraint_satisfaction_problem
Scheduling Algorithms Introduction
https://developers.google.com/optimization/scheduling
