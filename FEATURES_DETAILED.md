# Exam Duty Helper - Detailed Feature Documentation

## 1) System Overview
This project is a full-stack exam duty management platform with:
- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend API: Node.js + Express + MongoDB (Mongoose)
- AI Engine: Python Flask service

Main goals:
- Manage teachers, exams, and leave records
- Generate duty allocations automatically
- Keep allocations fair and conflict-aware
- Provide explainable outputs and teacher-facing assistance

---

## 2) Architecture and Service Flow
1. User performs an action in frontend (admin or teacher dashboard).
2. Frontend calls backend REST APIs.
3. For AI allocation flows, backend calls AI engine at `http://127.0.0.1:5001/generate`.
4. AI engine:
   - Parses natural-language rules into constraints
   - Runs scheduler to generate roster
   - Generates explanation text
   - Optionally sends notification emails
5. Backend writes final allocation data to MongoDB (except simulation mode).
6. Frontend renders results (allocation table, fairness analytics, conflicts, etc.).

---

## 3) Authentication and Role-Based Access
### What it does
- Supports register/login.
- Protects admin and teacher pages based on role.

### How it works
- Register creates `User` with default role `teacher` and auto-creates matching `Teacher` profile.
- Login validates credentials using bcrypt and returns JWT.
- Frontend `ProtectedRoute` checks role and blocks unauthorized pages.

### Backend endpoints
- `POST /auth/register`
- `POST /auth/login`

### AI used?
- No.

---

## 4) Landing Page, Dashboard Shell, and Theme System
### What it does
- Professional landing page for project presentation.
- Unified dashboard style across modules.
- Dark/light mode toggle.

### How it works
- Frontend route `/` serves landing page.
- `ThemeProvider` controls class-based theme switching.
- Shared layout and module header components keep UI uniform.

### Frontend routes
- `/`
- `/auth`
- `/contributors`
- Admin: `/admin`, `/admin/*`
- Teacher: `/teacher`, `/teacher/*`

### AI used?
- No.

---

## 5) Teacher Management
### What it does
- Admin can create, edit, view, and delete teacher records.

### How it works
- CRUD operations update `Teacher` collection.
- Teachers contain name, email, department, subject, total duty count.

### Backend endpoints
- `GET /teachers`
- `GET /teachers/email/:email`
- `POST /teachers`
- `PUT /teachers/:id`
- `DELETE /teachers/:id`

### AI used?
- No.

---

## 6) Exam Schedule Management
### What it does
- Admin manages exam records (subject, date, time, room, class).

### How it works
- Exam CRUD updates `Exam` collection.
- Exams are sorted by class/date/time for clean display.
- If auto-run policy is enabled, create/update/delete exam triggers automated allocation.

### Backend endpoints
- `GET /exams`
- `GET /exams/:id`
- `POST /exams`
- `PUT /exams/:id`
- `DELETE /exams/:id`

### AI used?
- Indirectly, only when policy auto-trigger is ON.

---

## 7) Leave Management (Leave-Aware Workflow)
### What it does
- Teachers can submit leave dates.
- Allocation process respects leave automatically.

### How it works
1. Leave records are stored in `TeacherLeave` collection.
2. During allocation/simulation, backend merges leave dates into teacher availability data.
3. Scheduler skips teachers unavailable on the exam date.

### Backend endpoints
- `GET /teacher-leave/:teacherId`
- `POST /teacher-leave`
- `DELETE /teacher-leave/:id`

### AI used?
- No direct AI needed for leave storage.
- AI-assisted allocation pipeline consumes leave-aware teacher data.

---

## 8) AI-Powered Duty Allocation (Core Feature)
### What it does
- Automatically assigns teachers to exam duties using rules + constraints + fairness logic.

### How it works (pipeline)
1. Backend reads teachers, exams, and leaves.
2. Backend composes leave-aware teacher availability.
3. Backend calls AI engine `/generate` with:
   - teacher list
   - exam list
   - rules text
4. AI engine parses rules and runs scheduler.
5. Backend writes generated roster to `DutyAllocation` and updates `Teacher.totalDuties`.

### Backend endpoints
- `POST /auto-allocate` (manual rules)
- `GET /auto-allocate` (list current allocations)
- `DELETE /auto-allocate/clear` (reset allocations)

### AI used?
- Yes.
- Model used: `gemini-2.5-flash` (rule parsing and explanation generation).
- Deterministic scheduler applies parsed constraints to produce final roster.

---

## 9) Automated Allocation with Saved Policy
### What it does
- Lets admin save default rule policy and optionally auto-run allocation on exam changes.

### How it works
- Policy is stored in `AllocationPolicy` model.
- On exam create/update/delete, backend checks policy:
  - If `autoRunOnExamChange = true`, backend triggers `/auto-allocate/run-automated`.

### Backend endpoints
- `GET /auto-allocate/policy`
- `PUT /auto-allocate/policy`
- `POST /auto-allocate/run-automated`

### AI used?
- Yes, same allocation pipeline and model as core allocation.

---

## 10) Fairness Analytics
### What it does
- Shows workload distribution quality across teachers.

### How it works
- Backend computes duty counts per teacher.
- Calculates:
  - average duties
  - min/max duties
  - duty range
  - standard deviation
  - fairness score
- Includes cycle summary (assigned vs unassigned exams).

### Backend endpoint
- `GET /auto-allocate/fairness`

### AI used?
- No. Metrics are computed algorithmically in backend.

---

## 11) Swap Recommendations
### What it does
- Suggests teacher-duty swaps to improve workload balance while preserving constraints.

### How it works
- Evaluates pairwise swaps from current allocations.
- Rejects invalid swaps with subject conflict, leave conflict, or date conflict.
- Scores valid swaps by workload improvement and ranks top recommendations.

### Backend endpoint
- `GET /auto-allocate/swap-recommendations`

### AI used?
- No. Recommendation scoring is heuristic/backend logic.

---

## 12) Real-Time Conflict Detection
### What it does
- Detects scheduling health issues in current data.

### Conflict types checked
- Room conflicts (same room/date/time)
- Teacher date conflicts (multiple duties same day)
- Leave conflicts (teacher assigned on leave date)
- Subject conflicts (teacher assigned own subject)

### Backend endpoint
- `GET /auto-allocate/conflicts`

### AI used?
- No. Pure backend rule validation.

---

## 13) Allocation Simulation (What-If Analysis)
### What it does
- Runs a trial allocation without writing to DB.
- Supports hypothetical absent teachers and custom rules.

### How it works
1. Loads teachers, exams, leaves.
2. Adds forced absences for provided teacher emails.
3. Calls AI engine to generate hypothetical roster.
4. Returns summary (`assignedCount`, `unassignedCount`, `fairnessRange`) without persisting.

### Backend endpoint
- `POST /auto-allocate/simulate`

### AI used?
- Yes, same AI engine flow.
- Includes fallback behavior if Gemini parsing/explanation fails.

---

## 14) Teacher Explanation Assistant
### What it does
- Teacher can ask duty-related questions and receive contextual answers.

### How it works
- Input: teacher email + question.
- Backend fetches teacher duties and workload stats.
- Assistant returns tailored responses for queries like:
  - next duty
  - fairness/load
  - leave effect
  - general schedule summary
- Also returns quick facts (total duties, upcoming duties, fairness score, average duties).

### Backend endpoint
- `POST /auto-allocate/teacher-assistant`

### AI used?
- Current assistant reply logic is primarily backend rule-based text generation.

---

## 15) Centralized Data Hub
### What it does
- Gives admin a one-screen operational snapshot.

### Data included
- Counts: teachers/exams/leaves/allocations
- Policy state and last trigger metadata
- Recent teacher, exam, leave, and allocation records

### Backend endpoint
- `GET /auto-allocate/data-hub`

### AI used?
- No.

---

## 16) AI Engine Internals (Important)
### Components
- `app.py`: Flask entrypoint (`/generate`)
- `gemini_parser.py`: converts natural-language rules to JSON constraints
- `scheduler.py`: constraint-driven assignment engine
- `explain.py`: narrative explanation of generated roster
- `notifier.py`: optional email notifications

### AI model usage
- `gemini-2.5-flash` is used in:
  - rule parsing
  - schedule explanation
  - first few email draft generations (hybrid mode)

### Non-AI fallback behavior
- If AI parsing fails: safe default constraints are used.
- If explanation fails: fallback summary text is returned.
- If email credentials missing: notification step is skipped safely.

---

## 17) Data Models Used
- `User`
- `Teacher`
- `Exam`
- `TeacherLeave`
- `DutyAllocation`
- `AllocationPolicy`

---

## 18) End-to-End Example (Admin Auto Allocation)
1. Admin updates policy rules and enables auto-run.
2. Admin creates or edits exams.
3. Backend exam route triggers automated run.
4. Backend calls AI engine with latest rules + leave-aware teacher data.
5. Scheduler generates roster.
6. Backend stores allocations and updates teacher duty counters.
7. Admin checks fairness/conflicts/swaps/simulation panels.

---

## 19) Endpoint Map (Quick Reference)
- Auth: `/auth/*`
- Teachers: `/teachers/*`
- Exams: `/exams/*`
- Leaves: `/teacher-leave/*`
- Allocation and analytics: `/auto-allocate/*`

---

## 20) Notes and Current Limits
- AI quality depends on Gemini API availability and quota.
- Scheduler currently uses greedy assignment with fairness re-sorting (not exhaustive optimization).
- Production security hardening recommended:
  - move JWT secret to environment variable
  - add role verification middleware on backend routes
  - add audit logging for admin actions

---

## 21) One-Line Summary
This project combines traditional backend scheduling logic with selective Gemini-based intelligence to deliver explainable, leave-aware, fairness-focused exam duty allocation and admin analytics in a production-style dashboard.
