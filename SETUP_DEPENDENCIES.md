# Environment & Dependencies Setup

## System Requirements

- **Node.js** ≥ 14.0
- **Python** ≥ 3.8
- **MongoDB** (any recent version)
- **10 MB** disk space for code
- **2 GB** RAM (for running both services)

## Python Dependencies

### Core Requirements
```bash
cd ai-engine
pip install flask==2.3.0
```

### Optional (Phase 2)
```bash
pip install ortools==9.7.2996      # For optimization
pip install numpy==1.24.0          # Numerical computations
```

### Recommended (Development)
```bash
pip install pytest==7.4.0          # Testing
pip install black==23.0.0          # Code formatting
pip install pylint==2.17.0         # Linting
```

### Check Installation
```bash
python -c "import flask; print(flask.__version__)"
# Output: 2.3.0
```

## Node.js Dependencies

### Core Requirements
```bash
cd backend

# Already in package.json, just ensure:
npm install axios@latest
```

### Verify
```bash
npm list axios
# Should show: axios@X.X.X
```

## Full Setup from Scratch

### 1. Prerequisites
```bash
# Check Node
node --version    # Should be ≥ 14.0

# Check Python
python --version  # Should be ≥ 3.8

# Check MongoDB (running)
mongosh  # Should connect successfully
```

### 2. Python Environment (Recommended - Virtual Environment)

#### Windows
```bash
cd ai-engine

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install flask

# Verify
python -c "import flask; print('✅ Flask installed')"
```

#### Mac/Linux
```bash
cd ai-engine

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install flask

# Verify
python -c "import flask; print('✅ Flask installed')"
```

### 3. Node.js Setup
```bash
cd backend

# Install dependencies
npm install

# Verify
npm list
# Should show express, mongoose, axios, etc.
```

### 4. MongoDB Data Setup

```bash
# Connect to MongoDB
mongosh

# Switch to database
use exam-duty-helper

# Create collections (if not exists)
db.teachers.insertOne({ dummy: true })
db.exams.insertOne({ dummy: true })
db.departmentpolicies.insertOne({ dummy: true })
db.dutyallocations.insertOne({ dummy: true })

# Verify
db.getCollectionNames()
# Should show: [teachers, exams, departmentpolicies, dutyallocations, ...]

# Exit
exit
```

## Running the Complete System

### Terminal Configuration

**You'll need 3 terminals:**

#### Terminal 1: Python Scheduler
```bash
cd exam-duty-helper/ai-engine

# If using venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Start Flask server
python api.py

# Output:
# WARNING in app.run() is not recommended for production use...
# Running on http://127.0.0.1:5000
# Press CTRL+C to quit
```

#### Terminal 2: Node Backend
```bash
cd exam-duty-helper/backend

# Start Node server
npm start

# Output:
# Server running on port 3000
# Connected to MongoDB
```

#### Terminal 3: Testing/Monitoring
```bash
# Use this for:
# - curl commands
# - Database queries
# - Log inspection
```

## Environment Variables

### Python (.env in ai-engine/)
```
FLASK_ENV=development
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
LOG_LEVEL=INFO
```

### Node (.env in backend/)
```
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/exam-duty-helper
PORT=3000
SCHEDULER_API_URL=http://localhost:5000/api/allocate
```

## Port Configuration

**Default Ports:**
- Python Flask API: `5000`
- Node Backend API: `3000`
- MongoDB: `27017`

**If ports are in use:**

### Change Python Port
```python
# In ai-engine/api.py, last line
app.run(host="0.0.0.0", port=5001)  # Changed from 5000
```

### Change Node Port
```javascript
// In backend/server.js
app.listen(3001, () => {  // Changed from 3000
  console.log(`Server running on port 3001`);
});
```

Then update backend `.env`:
```
SCHEDULER_API_URL=http://localhost:5001/api/allocate
```

## Dependency Tree

```
Your Application
├── Node.js Backend
│   ├── express (REST API)
│   ├── mongoose (MongoDB ORM)
│   ├── axios (HTTP client)
│   └── dotenv (Config)
│
├── Python Scheduler
│   ├── Flask (REST API)
│   ├── pymongo (Optional, direct DB access)
│   └── logging (Built-in)
│
└── MongoDB
    └── Collections: teachers, exams, allocations, policies
```

## Verification Checklist

After setup, run these checks:

### ✅ Check 1: Python Flask Running
```bash
curl http://localhost:5000/api/health

# Expected:
# {
#   "status": "healthy",
#   "service": "scheduler-api",
#   "version": "1.0.0-alpha"
# }
```

### ✅ Check 2: Node Backend Running
```bash
curl http://localhost:3000/health

# or just visit: http://localhost:3000 in browser
```

### ✅ Check 3: MongoDB Connected
```bash
mongosh

use exam-duty-helper
db.teachers.countDocuments()
# Should return: 0 (or number of teachers if data exists)

exit
```

### ✅ Check 4: Data Setup
```bash
# Check migration was run
cd backend
node scripts/migrate-to-phase1.js

# Should complete without errors
```

### ✅ Check 5: Full Allocation Test
```bash
# Get an institution_id from MongoDB
mongosh
db.teachers.findOne({ institution_id: { $exists: true } })
# Copy the institution_id

# Run allocation (from Terminal 3)
curl -X POST http://localhost:3000/api/allocations/run \
  -H "Content-Type: application/json" \
  -d '{"institution_id": "PASTE_ID_HERE"}'

# Should return success status with allocation data
```

## Common Installation Issues

### Issue: "ModuleNotFoundError: No module named 'flask'"

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall
pip install flask
```

### Issue: "Cannot find module 'axios'" (Node)

**Solution:**
```bash
cd backend
npm install
npm install --save axios
```

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check if MongoDB is running
# Windows: Services → MongoDB Server
# Mac: brew services list
# Linux: sudo service mongod status

# If not running, start it
mongod  # Mac/Linux
# Or use MongoDB Compass desktop app

# Check connection
mongosh
# Should connect to: mongodb://localhost:27017/
exit
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find what's using port 5000
lsof -i :5000              # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or use different port
# Then update ai-engine/api.py

# Restart Flask
python api.py
```

## Performance Tips

### For Development
- Keep both servers in separate terminals (for logs)
- Use `npm start` with nodemon (auto-restart on changes)
- Use Python with `--reload` for Flask (built-in)

### For Production (Later)
```bash
# Production Python
gunicorn -w 4 -b 0.0.0.0:5000 api:app

# Production Node (with PM2)
npm install -g pm2
pm2 start backend/server.js
pm2 logs
```

## Testing the Setup

### Quick Test Suite
```bash
# Terminal 3: Run these sequentially

# 1. Health checks
echo "Testing Flask..."
curl http://localhost:5000/api/health

echo "Testing Node..."
curl http://localhost:3000/health

# 2. Get constraints info
echo "Getting constraints info..."
curl http://localhost:5000/api/constraints-info

# 3. Run allocation (need a valid institution_id)
echo "Running allocation..."
curl -X POST http://localhost:3000/api/allocations/run \
  -H "Content-Type: application/json" \
  -d '{"institution_id": "YOUR_INSTITUTION_ID"}'

# 4. Check stats
echo "Checking stats..."
curl http://localhost:3000/api/allocations/stats/YOUR_INSTITUTION_ID
```

## Debugging

### Python Debugging
```python
# In ai-engine/api.py
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Then use:
logger.debug("Debug message")
logger.info("Info message")
logger.error("Error message")
```

### Node Debugging
```javascript
// In backend/services/AllocationService.js
console.log("Debug:", data);
console.error("Error:", error);

// Or use Node debugger
node --inspect backend/server.js
# Then visit chrome://inspect in Chrome
```

## Cleanup

### Remove Virtual Environment (Python)
```bash
cd ai-engine
rm -rf venv  # Mac/Linux
rmdir /s venv  # Windows
```

### Clean Node Modules
```bash
cd backend
rm -rf node_modules
npm cache clean --force
```

### Reset MongoDB
```bash
mongosh
db.dropDatabase()
exit
```

---

## Next: Integration Guide

Once setup is verified, follow `QUICKSTART.md` for the 5-minute integration steps.
