# Phase 3: Intelligent Automation & Analytics Platform
## Complete Architecture & Implementation Guide

**Objective:** Transform Phase 1+2 scheduling engine into institutional dashboard platform
**Timeline:** 4 weeks (1 developer)
**Complexity:** Medium (mostly UI + API integration)
**Status:** Ready for implementation

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│         PHASE 3: INSTITUTIONAL DASHBOARD LAYER          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ADMIN DASHBOARD (React Components)              │  │
│  │  ├─ Simulation Panel                             │  │
│  │  ├─ Fairness Analytics                           │  │
│  │  ├─ Swap Recommendations                         │  │
│  │  ├─ Policy Manager                               │  │
│  │  ├─ Emergency Handler                            │  │
│  │  └─ Teacher Explanation View                     │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  NEW BACKEND APIs (Node.js/Express)              │  │
│  │  ├─ /api/phase3/simulations/*                    │  │
│  │  ├─ /api/phase3/analytics/*                      │  │
│  │  ├─ /api/phase3/swaps/*                          │  │
│  │  ├─ /api/phase3/policies/*                       │  │
│  │  ├─ /api/phase3/exports/*                        │  │
│  │  └─ /api/phase3/explanations/*                   │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PHASE 2 ENGINE (Python Scheduler)               │  │
│  │  ├─ optimizer.py (OR-Tools)                      │  │
│  │  ├─ swap_engine.py                               │  │
│  │  ├─ rescheduler.py                               │  │
│  │  ├─ gemini_reviewer.py                           │  │
│  │  └─ allocator.py                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MONGODB (Enhanced Schema)                       │  │
│  │  ├─ Teacher                                      │  │
│  │  ├─ Exam                                         │  │
│  │  ├─ DutyAllocation                               │  │
│  │  ├─ AllocationSimulation (NEW)                   │  │
│  │  ├─ AllocationHistory (NEW)                      │  │
│  │  └─ DepartmentPolicy                             │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Phase 3 Component Structure

```
src/
├── pages/
│   └── AdminDashboard.tsx (REDESIGNED)
│       └── Tabs:
│           ├─ Simulator
│           ├─ Analytics
│           ├─ Swaps
│           ├─ Policies
│           ├─ Emergency
│           └─ Explanations
│
├── components/
│   ├── phase3/
│   │   ├── AllocationSimulator/
│   │   │   ├─ SimulationPanel.tsx
│   │   │   ├─ ComparisonChart.tsx
│   │   │   ├─ ChangeHighlight.tsx
│   │   │   └─ ApprovalFlow.tsx
│   │   │
│   │   ├── FairnessAnalytics/
│   │   │   ├─ FairnessScore.tsx
│   │   │   ├─ WorkloadHistogram.tsx
│   │   │   ├─ DepartmentHeatmap.tsx
│   │   │   ├─ VarianceAnalysis.tsx
│   │   │   └─ OverloadWarning.tsx
│   │   │
│   │   ├── SwapRecommendations/
│   │   │   ├─ SwapCard.tsx
│   │   │   ├─ SwapPreview.tsx
│   │   │   ├─ SwapBatch.tsx
│   │   │   └─ ApplySwapDialog.tsx
│   │   │
│   │   ├── PolicyEditor/
│   │   │   ├─ PolicyForm.tsx
│   │   │   ├─ TemplateSelector.tsx
│   │   │   └─ ConflictDetector.tsx
│   │   │
│   │   ├── EmergencyHandler/
│   │   │   ├─ EmergencyPanel.tsx
│   │   │   ├─ ReplacementSuggestions.tsx
│   │   │   └─ ConfirmDialog.tsx
│   │   │
│   │   ├── TeacherExplanation/
│   │   │   ├─ ExplanationCard.tsx
│   │   │   ├─ FairnessContext.tsx
│   │   │   └─ AppealForm.tsx
│   │   │
│   │   └── Exports/
│   │       ├─ ExportMenu.tsx
│   │       ├─ ExcelGenerator.tsx
│   │       └─ PDFGenerator.tsx
│   │
│   └── shared/
│       ├─ Charts.tsx (Recharts wrappers)
│       ├─ DataTable.tsx (TanStack Table wrapper)
│       └─ LoadingStates.tsx
│
├── hooks/
│   ├─ useAllocationSimulation.ts
│   ├─ useFairnessAnalytics.ts
│   ├─ useSwapEngine.ts
│   ├─ usePolicyManager.ts
│   └─ useExports.ts
│
├── types/
│   ├─ simulation.ts
│   ├─ analytics.ts
│   ├─ swaps.ts
│   ├─ policies.ts
│   └─ exports.ts
│
└── lib/
    ├─ phase3-api.ts (API client)
    ├─ simulation-utils.ts
    ├─ export-generators.ts
    └─ fairness-calculators.ts

backend/
├── routes/
│   └── phase3Routes.js (NEW)
│
├── services/
│   ├─ SimulationService.js (NEW)
│   ├─ AnalyticsService.js (NEW)
│   ├─ ExportService.js (NEW)
│   └─ AllocationService.js (ENHANCED)
│
└── models/
    ├─ AllocationSimulation.js (NEW)
    └─ AllocationHistory.js (NEW)
```

---

## 🎯 Phase 3 Features (Detailed Specs)

### 1️⃣ ALLOCATION SIMULATION MODE

**Purpose:** Admins preview allocation before approving

**User Flow:**
```
admin selects constraints
↓
clicks "Run Simulation"
↓
system shows preview (read-only)
↓
compares with current allocation
↓
admin reviews changes
↓
clicks "Approve & Apply"
```

**Backend Endpoint:**
```
POST /api/phase3/simulations/run
{
  "institution_id": "abc123",
  "exam_ids": ["e1", "e2"],
  "teacher_ids": ["t1", "t2"],
  "policies": {...},
  "use_optimization": true
}

Response:
{
  "simulation_id": "sim_xyz",
  "allocation": {...},
  "comparison": {
    "added": [...],
    "removed": [...],
    "unchanged": [...]
  },
  "fairness_metrics": {...},
  "execution_time": 8.5
}
```

**Frontend Component:**
```tsx
<AllocationSimulator
  currentAllocation={allocation}
  onApprove={handleApprove}
  isLoading={loading}
/>
```

**Data Storage:**
```
AllocationSimulation {
  _id
  institution_id
  running_allocation_id
  simulation_result
  created_by
  created_at
  approved_at
  is_applied: boolean
}
```

---

### 2️⃣ FAIRNESS ANALYTICS DASHBOARD

**Purpose:** Transparency into fairness metrics

**Displays:**
- Fairness score (0-100)
- Workload distribution histogram
- Department heatmap
- Variance analysis
- Overload warnings
- Reliability trends

**Charts:**
```tsx
// Workload histogram
<BarChart data={workloadData}>
  <XAxis dataKey="duties" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="count" />
  <ReferenceLine y={mean} label="Mean" />
</BarChart>

// Department heatmap
<HeatmapChart
  data={departmentLoad}
  departments={depts}
  metrics={['load', 'fairness', 'overload_risk']}
/>
```

**Backend Endpoint:**
```
GET /api/phase3/analytics/:allocation_id
{
  "fairness_score": 78,
  "fairness_assessment": "Good",
  "workload_stats": {
    "mean": 4.2,
    "std_dev": 1.2,
    "variance": 1.44,
    "min": 2,
    "max": 7
  },
  "department_stats": {
    "dept_a": { "load": 5.2, "overload_risk": "low" },
    "dept_b": { "load": 3.8, "overload_risk": "medium" }
  },
  "overloaded_teachers": [
    {"id": "t1", "name": "Dr Smith", "duties": 7, "threshold": 5.2}
  ],
  "underloaded_teachers": [
    {"id": "t2", "name": "Dr Jones", "duties": 2, "threshold": 2.1}
  ],
  "patterns": [
    {"pattern": "overload in science dept", "impact": "high"},
    {"pattern": "junior teachers underutilized", "impact": "medium"}
  ]
}
```

---

### 3️⃣ SWAP RECOMMENDATION PANEL

**Purpose:** One-click fairness improvement

**User Flow:**
```
view recommendations
↓
preview swap impact
↓ 
click "Apply Swap"
↓
system updates allocation
↓
shows new fairness score
```

**Backend Endpoint:**
```
GET /api/phase3/swaps/:allocation_id?limit=10

Response:
{
  "swaps": [
    {
      "id": "swap_1",
      "overloaded": {"id": "t1", "name": "Alice", "duties": 7},
      "underloaded": {"id": "t2", "name": "Bob", "duties": 2},
      "swappable_duties": [
        {"exam_id": "e1", "subject": "Math"}
      ],
      "improvement_percent": 15.2,
      "priority": 15.2
    }
  ]
}

POST /api/phase3/swaps/:allocation_id/:swap_id/apply
Response: { success: true, new_allocation: {...} }
```

**Components:**
```tsx
<SwapRecommendationPanel
  swaps={swaps}
  allocation={current}
  onApplySwap={handleSwap}
/>
```

---

### 4️⃣ TEACHER EXPLANATION MODULE

**Purpose:** Transparency for teachers

**Teacher sees:**
```
Why was I assigned this?
• You had 2 duties (below average 4.2)
• Your expertise matches exam subject
• Department needed coverage
• Your availability was full
```

**Backend Endpoint:**
```
GET /api/phase3/explanations/:allocation_id/:teacher_id

Response:
{
  "teacher_id": "t1",
  "duties_assigned": 4,
  "explanation": "You received 4 duties because...",
  "fairness_context": {
    "your_duties": 4,
    "average_duties": 4.2,
    "your_percentile": 45,
    "department_avg": 4.0
  },
  "factors": [
    {"factor": "availability", "weight": 0.3, "contribution": "positive"},
    {"factor": "reliability", "weight": 0.2, "contribution": "positive"},
    {"factor": "fairness", "weight": 0.4, "contribution": "neutral"}
  ]
}
```

**Component:**
```tsx
<ExplanationCard
  teacherId={teacherId}
  allocationId={allocationId}
/>
```

---

### 5️⃣ EMERGENCY REPLACEMENT UI

**Purpose:** Fast response to teacher absence

**User Flow:**
```
teacher unavailable
↓
click "Find Replacement"
↓
system shows candidates
↓
admin selects best fit
↓
click "Confirm Replacement"
↓
system updates, sends notifications
```

**Backend Endpoint:**
```
POST /api/phase3/emergency/replace
{
  "teacher_id": "t1",
  "exam_id": "e1",
  "reason": "illness"
}

Response:
{
  "affected_exams": [
    {
      "exam_id": "e1",
      "subject": "Math",
      "time": "2025-03-15 09:00",
      "replacements": [
        {"id": "t2", "name": "Dr Jones", "reliability": 0.95, "available": true},
        {"id": "t3", "name": "Dr Brown", "reliability": 0.87, "available": true}
      ]
    }
  ]
}

POST /api/phase3/emergency/apply-replacement
{
  "teacher_id": "t1",
  "replacement_id": "t2",
  "exam_id": "e1"
}
```

---

### 6️⃣ DEPARTMENT POLICY EDITOR

**Purpose:** Institutional configuration

**Editable Fields:**
```
- max_duties_per_day: 3
- max_duties_per_week: 10
- min_gap_between_duties: 2 hours
- eligible_roles: [invigilator, supervisor]
- cross_department_eligible: true
- priority_subjects: [Math, Science]
- seniority_multiplier: 1.2
```

**Backend:**
```
GET /api/phase3/policies/:department_id
PUT /api/phase3/policies/:department_id
POST /api/phase3/policies/templates (CBSE, Autonomous, etc.)

POST /api/phase3/policies/validate
{
  "policies": {...},
  "exams": [...]
}
Response: { violations: [] }
```

---

### 7️⃣ EXCEL/PDF EXPORT

**Purpose:** Operational workflows

**Export Types:**
```
1. Department-wise duty chart
2. Teacher duty list
3. Room-wise allocation
4. Daily schedule
5. Fairness report
```

**Backend:**
```
POST /api/phase3/exports/excel
{
  "allocation_id": "alloc_123",
  "export_type": "department_chart",
  "filters": {...}
}

Response: { download_url: "..." }

POST /api/phase3/exports/pdf
Similar structure
```

---

## 📊 Type Definitions

```typescript
// types/simulation.ts
export interface AllocationSimulation {
  id: string;
  institution_id: string;
  simulation_result: AllocationResult;
  comparison: {
    added: Change[];
    removed: Change[];
    unchanged: Assignment[];
  };
  fairness_metrics: FairnessMetrics;
  execution_time: number;
  created_at: Date;
  approved_at?: Date;
  is_applied: boolean;
}

// types/analytics.ts
export interface FairnessAnalytics {
  fairness_score: number;
  fairness_assessment: 'Good' | 'Fair' | 'Poor';
  workload_stats: WorkloadStats;
  department_stats: Record<string, DeptStats>;
  overloaded_teachers: TeacherLoad[];
  underloaded_teachers: TeacherLoad[];
  patterns: Pattern[];
}

// types/swaps.ts
export interface SwapRecommendation {
  id: string;
  overloaded: TeacherInfo;
  underloaded: TeacherInfo;
  swappable_duties: SwappableDuty[];
  improvement_percent: number;
  priority: number;
}

// types/policies.ts
export interface DepartmentPolicy {
  department_id: string;
  institution_id: string;
  max_daily_duties: number;
  max_weekly_duties: number;
  min_gap_hours: number;
  eligible_roles: string[];
  cross_dept_eligible: boolean;
  priority_subjects: string[];
  seniority_multiplier: number;
}
```

---

## 🔌 Backend API Routes

```javascript
// backend/routes/phase3Routes.js

router.post('/simulations/run', simulationController.runSimulation);
router.get('/simulations/:id', simulationController.getSimulation);
router.post('/simulations/:id/approve', simulationController.approveSimulation);

router.get('/analytics/:allocation_id', analyticsController.getAnalytics);
router.get('/analytics/:allocation_id/export', analyticsController.exportAnalytics);

router.get('/swaps/:allocation_id', swapController.getRecommendations);
router.post('/swaps/:allocation_id/:swap_id/apply', swapController.applySwap);
router.post('/swaps/:allocation_id/batch-apply', swapController.batchApplySwaps);

router.get('/policies/:department_id', policyController.getPolicy);
router.put('/policies/:department_id', policyController.updatePolicy);
router.post('/policies/templates', policyController.listTemplates);
router.post('/policies/validate', policyController.validatePolicies);

router.post('/emergency/replace', emergencyController.findReplacements);
router.post('/emergency/apply-replacement', emergencyController.applyReplacement);

router.get('/explanations/:allocation_id/:teacher_id', explanationController.getExplanation);

router.post('/exports/excel', exportController.generateExcel);
router.post('/exports/pdf', exportController.generatePDF);
router.get('/exports/:export_id/download', exportController.downloadFile);
```

---

## 🛣️ Implementation Roadmap (4 Weeks)

### Week 1: Foundation
- [ ] Create Phase 3 component structure
- [ ] Setup type definitions
- [ ] Create Phase 3 API routes (stubs)
- [ ] Add MongoDB schemas (AllocationSimulation, AllocationHistory)
- [ ] Setup Recharts + TanStack Table integration

### Week 2: Core Features
- [ ] Build AllocationSimulator component
- [ ] Build FairnessAnalytics dashboard
- [ ] Build SwapRecommendation panel
- [ ] Connect to Phase 2 backend

### Week 3: Admin Tools
- [ ] Build PolicyEditor component
- [ ] Build EmergencyHandler UI
- [ ] Build ExportGenerators
- [ ] Add Excel + PDF generation

### Week 4: Polish + Testing
- [ ] Teacher explanation panel
- [ ] Integration testing
- [ ] Performance optimization
- [ ] User acceptance testing

---

## 💾 MongoDB Schema Additions

```javascript
// AllocationSimulation
{
  _id: ObjectId,
  institution_id: String,
  allocation_id: ObjectId, // Running/previous allocation
  simulation_result: Object, // Full allocation output
  comparison: {
    added: [],
    removed: [],
    unchanged: []
  },
  fairness_metrics: {},
  execution_time: Number,
  created_by: String,
  created_at: Date,
  approved_at: Date | null,
  is_applied: Boolean,
  approval_reason: String
}

// AllocationHistory
{
  _id: ObjectId,
  allocation_id: ObjectId,
  change_type: 'created' | 'modified' | 'approved' | 'published' | 'rolled_back',
  changed_by: String,
  previous_state: Object,
  new_state: Object,
  reason: String,
  timestamp: Date
}
```

---

## ⚡ Key Dependencies to Add

```json
{
  "recharts": "^2.10.0",
  "@tanstack/react-table": "^8.16.0",
  "xlsx": "^0.18.5",
  "js-pdf": "^2.5.1",
  "html2pdf.js": "^0.10.1",
  "date-fns": "^2.30.0",
  "lodash": "^4.17.21"
}
```

---

## 🚀 Success Metrics

After Phase 3 completion:

```
✅ Admin can simulate allocation before approval
✅ Full fairness metrics visible in dashboard
✅ One-click swap recommendations working
✅ Teachers see fairness explanations
✅ Emergency replacements in <2 minutes
✅ Department policies configurable via UI
✅ Exports (Excel/PDF) automated
✅ System ready for institutional rollout
```

---

**Next Step:** Proceed with Week 1 implementation?
