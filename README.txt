📦 Step 1 — Root folder (Frontend) installation

Open terminal inside:

exam-duty-helper/

Run:

npm install

This installs (from your project):

React
Vite
Axios
Tailwind
React Router
ShadCN UI
React Query
Sonner (toast)
Recharts (dashboard charts)

These are already listed in your root package.json

📦 Step 2 — Backend installation

Go inside backend:

cd backend

Then install required packages:

npm install express mongoose bcryptjs jsonwebtoken cors dotenv nodemon

Recommended extra utilities:

npm install morgan helmet

So your backend stack becomes:

Package	Purpose
express	server
mongoose	MongoDB connection
bcryptjs	password hashing
jsonwebtoken	authentication
cors	frontend connection
dotenv	env variables
nodemon	auto restart server
helmet	security headers
morgan	request logging
📦 Step 3 — Create backend package.json scripts

Open:

backend/package.json

Add:

"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}

Now run backend using:

npm run dev
📦 Step 4 — Environment variables setup

Create:

backend/.env

Example:

MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=supersecretkey

Then inside server.js confirm:

require("dotenv").config();
📦 Step 5 — Run the full project

Open two terminals

Terminal 1 (backend)
cd backend
npm run dev

Server starts:

http://localhost:5000
Terminal 2 (frontend)
npm run dev

Frontend starts:

http://localhost:5173
📦 Step 6 — Required MongoDB collections (auto-created)

Once running, these collections appear automatically:

users
teachers
exams
dutyallocations
teacherleaves

Your backend models already define them
