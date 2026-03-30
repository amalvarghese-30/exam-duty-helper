# Phase 1 Quick Start Guide

## 5-Minute Setup

### 1. Update Node.js Backend (2 minutes)

**In `backend/server.js`**, add these lines:

```javascript
// Add after other route imports
const allocationRoutes = require('./routes/allocationRoutes');

// Add after other route middleware
app.use('/api/allocations', allocationRoutes);
```

### 2. Configure Python Scheduler (1 minute)

**In `ai-engine/api.py`**, update the port if needed:

```python
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)  # Change port here if needed
```

### 3. Run Migration Script (1 minute)

```bash
cd backend
npm install  # If not already done

node scripts/migrate-to-phase1.js
```

This will:
- ✅ Add new fields to existing teachers/exams
- ✅ Create default department policies
- ✅ Update allocation records with role information
- ✅ Verify data integrity

### 4. Start Both Services (1 minute)

**Terminal 1 - Python Scheduler:**
```bash
cd ai-engine
python api.py
# Output: Running on http://0.0.0.0:5000
```

**Terminal 2 - Node Backend:**
```bash
cd backend
npm start
# Output: Server running on port 3000
```

---

## Testing the System

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "scheduler-api",
  "version": "1.0.0-alpha"
}
```

### Test 2: List Constraints
```bash
curl http://localhost:5000/api/constraints-info
```

### Test 3: Run Allocation (Main Test)
```bash
curl -X POST http://localhost:3000/api/allocations/run \
  -H "Content-Type: application/json" \
  -d '{"institution_id": "YOUR_INSTITUTION_ID"}'
```

Replace `YOUR_INSTITUTION_ID` with an actual institution ID from your database.

### Test 4: Get Statistics
```bash
curl http://localhost:3000/api/allocations/stats/YOUR_INSTITUTION_ID
```

---

## Common Configuration Changes

### Adjust Daily Duty Limit

In MongoDB:
```javascript
db.departmentpolicies.updateOne(
  { department: "CSE" },
  { $set: { max_daily_duties: 2 } }
)
```

### Set Teacher Seniority

```javascript
db.teachers.updateOne(
  { email: "dr.smith@university.edu" },
  { $set: { seniority_years: 8 } }
)
```

### Configure Exam Roles

```javascript
db.exams.updateOne(
  { subject: "DSA" },
  { 
    $set: { 
      required_roles: {
        invigilator: 3,
        supervisor: 1,
        coordinator: 1
      }
    }
  }
)
```

### Mark Teacher as Inactive

```javascript
db.teachers.updateOne(
  { email: "dr.jones@university.edu" },
  { $set: { is_active: false } }
)
```

---

## Expected Behavior

### Good Allocation
```json
{
  "status": "success",
  "data": {
    "allocated_exams": 10,
    "total_exams": 10,
    "success_rate": 100.0,
    "workload_statistics": {
      "mean": 2.5,
      "std_dev": 0.6
    }
  }
}
```

### Partial Allocation (Warning)
```json
{
  "status": "partial",
  "data": {
    "allocated_exams": 8,
    "total_exams": 10,
    "success_rate": 80.0,
    "unallocated_exams": ["exam_id_1", "exam_id_2"]
  }
}
```

### Issues to Address
- **Low success rate (<80%)** → Add more teachers or remove constraints
- **High std_dev (>1.5)** → Increase fairness weight in scorer
- **Many conflicts** → Review department policies

---

## Common Issues & Fixes

### Issue: "No valid candidates for allocation"

**Cause:** Hard constraints too strict

**Fix:** Check constraints in `ai-engine/scheduler/constraints.py`:
```python
# Maybe try relaxing availability check
def _check_available(self, teacher, exam):
    # If no availability is specified, assume available
    if not available_dates:
        return True
```

### Issue: Same teacher gets multiple duties same day

**Cause:** Daily limit not working

**Fix:** Verify policy in `DepartmentPolicy`:
```bash
db.departmentpolicies.findOne({ department: "CSE" })
# Should show: max_daily_duties: 2 or 3
```

### Issue: Python API not responding

**Fix:**
```bash
# Check if Flask is installed
pip install flask

# Check if port 5000 is free
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Try different port:
# Edit ai-engine/api.py and change port=5000 to port=5001
```

---

## Performance Tips

### For Small Institutions (< 50 teachers, 100 exams)
- Default settings work fine
- Allocation completes in < 1 second

### For Medium Institutions (50-200 teachers, 100-500 exams)
- Increase fairness weight for better distribution
- Consider Phase 2 optimization

### For Large Institutions (200+ teachers, 500+ exams)
- Phase 2 OR-Tools becomes important
- May want to split by department/day

---

## Monitoring Allocation Quality

### Check Fairness
```bash
# Get stats
curl http://localhost:3000/api/allocations/stats/INST_ID

# Good: std_dev < 0.8
# Acceptable: std_dev < 1.5
# Poor: std_dev > 1.5
```

### Check Conflicts
```bash
# In allocation response, check:
"conflicts": []  # Should be empty or minimal

# Review conflict types:
# - overload: teacher > max_daily_duties
# - double_booking: overlapping times
# - policy_violation: seniority/etc
# - missing_role: role couldn't be filled
```

### Check Teacher Reports
```bash
curl http://localhost:3000/api/allocations/teacher/INST_ID/TEACHER_ID

# Should see:
# - Reasonable number of duties
# - No same-day conflicts
# - All preferred
```

---

## Advanced: Custom Scoring

To adjust allocation preferences, modify `ai-engine/scheduler/scorer.py`:

```python
def compute_overall_score(self, teacher, exam, ...):
    score = 0.0
    
    # Increase workload priority (favor under-loaded teachers)
    score += remaining_capacity_score * 7.0  # Was 5.0
    
    # Decrease fairness (accept some imbalance)
    score += fairness_score * 2.0  # Was 3.0
    
    # Bonus for specific departments
    if teacher['department'] == 'CSE':
        score += 2.0
    
    return score
```

Then restart Python API:
```bash
# Control+C to stop
python api.py
```

---

## Next Steps

### After Phase 1 works well:

1. **Frontend Integration**
   - Add button to trigger allocation
   - Show allocation results table
   - Build teacher accept/reject UI

2. **Reporting**
   - Export allocations to PDF
   - Email notifications
   - Dashboard metrics

3. **Phase 2 Optimization**
   - Install OR-Tools: `pip install ortools`
   - Implement CP-SAT solver in `optimizer.py`
   - Enable in `/api/allocate/with-optimization`

4. **Phase 3 AI**
   - Connect to Gemini API
   - Implement fairness reviewer
   - Add swap recommendations

---

## Support

**Need help?**

1. Check: `PHASE_1_IMPLEMENTATION.md` (full documentation)
2. Review: `ai-engine/scheduler/` comments
3. Test: `/api/health` endpoint
4. Debug: Check logs in both Python and Node terminals

