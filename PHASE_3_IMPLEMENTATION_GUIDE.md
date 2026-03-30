# Phase 3 Implementation Guide
## Complete Step-by-Step Build Instructions

---

## 📋 Table of Contents
1. [Project Setup](#project-setup)
2. [Component Implementation Order](#component-implementation-order)
3. [Component Templates](#component-templates)
4. [Integration with Phase 2](#integration-with-phase-2)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Checklist](#deployment-checklist)

---

## 🔧 Project Setup

### Step 1: Install Dependencies
```bash
cd exam-duty-helper
npm install recharts @tanstack/react-table xlsx js-pdf html2pdf.js date-fns lodash

# For backend
cd backend
npm install mongoose axios
```

### Step 2: Create Directory Structure
```bash
# Frontend
mkdir -p src/components/phase3/{AllocationSimulator,FairnessAnalytics,SwapRecommendations,PolicyEditor,EmergencyHandler,TeacherExplanation,Exports}
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/lib

# Backend
mkdir -p backend/services
mkdir -p backend/controllers
mkdir -p backend/models
```

### Step 3: Register Phase 3 Routes
Add to `backend/server.js`:
```javascript
const phase3Routes = require('./routes/phase3Routes');
app.use('/api/phase3', phase3Routes);
```

### Step 4: Create MongoDB Models
Add to `backend/models/`:
- `AllocationSimulation.js`
- `AllocationHistory.js`

---

## 📊 Component Implementation Order

### Week 1 (Foundation & Simulator)
```
Day 1-2: Setup + Type definitions ✓
Day 3-4: AllocationSimulator component
Day 5: Connect to backend
```

### Week 2 (Analytics & Swaps)
```
Day 1-2: FairnessAnalytics dashboard
Day 3-4: SwapRecommendations panel
Day 5: Backend analytics service
```

### Week 3 (Admin Tools)
```
Day 1-2: PolicyEditor component
Day 3-4: EmergencyHandler + Explanations
Day 5: Export generators (Excel/PDF)
```

### Week 4 (Polish)
```
Day 1-2: Testing & bug fixes
Day 3-4: Performance optimization
Day 5: User acceptance testing
```

---

## 💻 Component Templates

### 1. AllocationSimulator Component

**File:** `src/components/phase3/AllocationSimulator/SimulationPanel.tsx`

```typescript
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface SimulationPanelProps {
  currentAllocation: any;
  institution: any;
  onApprove: () => void;
}

export const AllocationSimulator: React.FC<SimulationPanelProps> = ({
  currentAllocation,
  institution,
  onApprove
}) => {
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleRunSimulation = async () => {
    try {
      setLoading(true);
      
      // Call Phase 3 API
      const response = await fetch('/api/phase3/simulations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution_id: institution._id,
          exam_ids: currentAllocation.exams.map(e => e._id),
          use_optimization: true,
          time_limit_seconds: 60
        })
      });

      const data = await response.json();
      if (data.success) {
        setSimulation(data.data);
        setShowComparison(true);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSimulation = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `/api/phase3/simulations/${simulation.simulation_id}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            approval_reason: 'Approved via dashboard'
          })
        }
      );

      if (response.ok) {
        onApprove();
        setSimulation(null);
        setShowComparison(false);
      }
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Simulation Controls</h3>
        <Button
          onClick={handleRunSimulation}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running simulation...
            </>
          ) : (
            'Run Allocation Simulation'
          )}
        </Button>
      </div>

      {showComparison && simulation && (
        <div className="space-y-4">
          <SimulationComparisonView
            currentAllocation={currentAllocation}
            simulationResult={simulation}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={handleApproveSimulation}
              disabled={loading}
              className="flex-1"
            >
              Approve & Apply
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowComparison(false);
                setSimulation(null);
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component to show comparison
const SimulationComparisonView: React.FC<any> = ({
  currentAllocation,
  simulationResult
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview Changes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Assignments Added</p>
            <p className="text-xl font-bold text-green-600">
              {simulationResult.comparison.added.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Assignments Removed</p>
            <p className="text-xl font-bold text-red-600">
              {simulationResult.comparison.removed.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fairness Improvement</p>
            <p className="text-xl font-bold text-blue-600">
              +{(simulationResult.improvement_percent || 0).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* List of changes */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
          {simulationResult.comparison.added.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700">ADDED:</p>
              {simulationResult.comparison.added.slice(0, 5).map((item, i) => (
                <p key={i} className="text-xs text-gray-600 ml-2">
                  {item.teacher_id} → {item.exam_id}
                </p>
              ))}
              {simulationResult.comparison.added.length > 5 && (
                <p className="text-xs text-gray-500 ml-2">
                  +{simulationResult.comparison.added.length - 5} more
                </p>
              )}
            </div>
          )}

          {simulationResult.comparison.removed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700">REMOVED:</p>
              {simulationResult.comparison.removed.slice(0, 5).map((item, i) => (
                <p key={i} className="text-xs text-gray-600 ml-2">
                  {item.teacher_id} ✗ {item.exam_id}
                </p>
              ))}
              {simulationResult.comparison.removed.length > 5 && (
                <p className="text-xs text-gray-500 ml-2">
                  +{simulationResult.comparison.removed.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationSimulator;
```

---

### 2. FairnessAnalytics Dashboard

**File:** `src/components/phase3/FairnessAnalytics/FairnessScore.tsx`

```typescript
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  ComposedChart 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { FairnessAnalytics as FairnessAnalyticsType } from '@/types/phase3-types';

interface FairnessScoreBoardProps {
  metrics: FairnessAnalyticsType;
  allocation: any;
}

export const FairnessAnalyticsBoard: React.FC<FairnessScoreBoardProps> = ({
  metrics,
  allocation
}) => {
  // Chart data transformations
  const workloadChartData = useMemo(() => {
    return metrics.workload_stats?.distribution || [];
  }, [metrics]);

  const departmentChartData = useMemo(() => {
    return Object.entries(metrics.department_stats || {}).map(([key, value]: any) => ({
      name: value.department_name || key,
      fairness_score: value.fairness_score,
      avg_duties: value.avg_duties_per_teacher,
      teachers: value.total_teachers
    }));
  }, [metrics]);

  const scoreGaugeData = [
    {
      name: 'Fairness',
      value: metrics.fairness_score,
      fill: metrics.fairness_score >= 75 ? '#10b981' : metrics.fairness_score >= 60 ? '#f59e0b' : '#ef4444'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {metrics.overloaded_teachers && metrics.overloaded_teachers.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {metrics.overloaded_teachers.length} teachers are overloaded (duties > mean + 1.5σ)
          </AlertDescription>
        </Alert>
      )}

      {/* Fairness Score Gauge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Fairness Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600">
                {metrics.fairness_score}
              </div>
              <p className="text-sm text-gray-600 mt-2">Score (0-100)</p>
              <p className="text-lg font-semibold text-gray-700 mt-1">
                {metrics.fairness_assessment}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={scoreGaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {scoreGaugeData.map((item, idx) => (
                    <Cell key={idx} fill={item.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Workload Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Teachers" />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-600">Mean</p>
              <p className="text-lg font-bold">{metrics.workload_stats?.mean.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Std Dev</p>
              <p className="text-lg font-bold">{metrics.workload_stats?.std_dev.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Min</p>
              <p className="text-lg font-bold">{metrics.workload_stats?.min}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600">Max</p>
              <p className="text-lg font-bold">{metrics.workload_stats?.max}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Department Fairness</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={departmentChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="fairness_score" fill="#10b981" name="Fairness Score" />
              <Line yAxisId="right" type="monotone" dataKey="avg_duties" stroke="#ef4444" name="Avg Duties" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overloaded Teachers */}
      {metrics.overloaded_teachers && metrics.overloaded_teachers.length > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-base text-red-900">Overloaded Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metrics.overloaded_teachers.map((teacher) => (
                <div key={teacher.id} className="flex justify-between text-sm p-2 bg-white rounded">
                  <div>
                    <p className="font-semibold text-gray-900">{teacher.name}</p>
                    <p className="text-xs text-gray-600">{teacher.subjects?.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{teacher.duties_assigned} duties</p>
                    <p className="text-xs text-gray-600">
                      (+{(teacher.excess_or_deficit).toFixed(1)} above avg)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patterns Detected */}
      {metrics.patterns && metrics.patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patterns Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.patterns.map((pattern, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium text-gray-900">{pattern.pattern}</p>
                  <p className="text-xs text-gray-600 mt-1">{pattern.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FairnessAnalyticsBoard;
```

---

### 3. SwapRecommendations Component

**File:** `src/components/phase3/SwapRecommendations/SwapCard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { SwapRecommendation } from '@/types/phase3-types';

interface SwapRecommendationPanelProps {
  allocation: any;
  metrics: any;
  onSwapApplied: () => void;
}

export const SwapRecommendationPanel: React.FC<SwapRecommendationPanelProps> = ({
  allocation,
  metrics,
  onSwapApplied
}) => {
  const [loading, setLoading] = useState(false);
  const [swaps, setSwaps] = useState<SwapRecommendation[]>([]);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadSwaps();
  }, [allocation]);

  const loadSwaps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase3/swaps/${allocation._id}`);
      const data = await response.json();
      
      if (data.success) {
        setSwaps(data.data.swaps || []);
      }
    } catch (error) {
      console.error('Failed to load swaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySwap = async (swapId: string) => {
    try {
      setApplying(swapId);
      const response = await fetch(
        `/api/phase3/swaps/${allocation._id}/${swapId}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Applied via recommendation' })
        }
      );

      if (response.ok) {
        // Refresh swaps and metrics
        await loadSwaps();
        onSwapApplied();
      }
    } catch (error) {
      console.error('Failed to apply swap:', error);
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (swaps.length === 0) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-600">No swap recommendations available</p>
          <p className="text-xs text-gray-500 mt-2">Allocation is well-balanced</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {swaps.map((swap) => (
        <Card key={swap.id} className="overflow-hidden">
          <CardContent className="pt-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  Rebalance Workload
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {swap.improvement_percent.toFixed(1)}% fairness improvement
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-0">
                Priority: {swap.priority.toFixed(0)}
              </Badge>
            </div>

            {/* Teachers */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded mb-3">
              {/* Overloaded */}
              <div className="flex-1">
                <p className="text-xs text-gray-600">Overloaded</p>
                <p className="font-semibold text-gray-900">{swap.overloaded.name}</p>
                <p className="text-sm text-red-600 font-bold">
                  {swap.overloaded.duties} duties
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-5 w-5 text-gray-400" />

              {/* Underloaded */}
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-600">Underloaded</p>
                <p className="font-semibold text-gray-900">{swap.underloaded.name}</p>
                <p className="text-sm text-green-600 font-bold">
                  {swap.underloaded.duties} duties
                </p>
              </div>
            </div>

            {/* Swappable duties */}
            {swap.swappable_duties.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Can swap ({swap.swappable_duties.length} exams):
                </p>
                <div className="space-y-1">
                  {swap.swappable_duties.slice(0, 3).map((duty, idx) => (
                    <p key={idx} className="text-xs text-gray-600 ml-2">
                      • {duty.subject} ({duty.date.toString().split('T')[0]})
                    </p>
                  ))}
                  {swap.swappable_duties.length > 3 && (
                    <p className="text-xs text-gray-500 ml-2">
                      +{swap.swappable_duties.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action */}
            <Button
              onClick={() => handleApplySwap(swap.id)}
              disabled={applying === swap.id}
              className="w-full"
              size="sm"
            >
              {applying === swap.id ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Swap'
              )}
            </Button>
          </CardContent>
        </Card>
      ))}

      {swaps.length > 5 && (
        <div className="text-center">
          <Button variant="outline" size="sm">
            View All {swaps.length} Recommendations
          </Button>
        </div>
      )}
    </div>
  );
};

export default SwapRecommendationPanel;
```

---

### 4. PolicyEditor Component

**File:** `src/components/phase3/PolicyEditor/PolicyForm.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import type { DepartmentPolicy } from '@/types/phase3-types';

interface PolicyEditorPanelProps {
  institution: any;
  onSave: () => void;
}

export const PolicyEditorPanel: React.FC<PolicyEditorPanelProps> = ({
  institution,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState<DepartmentPolicy | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('');

  const [formData, setFormData] = useState({
    max_daily_duties: 3,
    max_weekly_duties: 10,
    min_gap_hours: 2,
    cross_department_eligible: true,
    seniority_multiplier: 1.2
  });

  useEffect(() => {
    if (selectedDept) {
      loadPolicies(selectedDept);
    }
  }, [selectedDept]);

  const loadPolicies = async (deptId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/phase3/policies/${deptId}`);
      const data = await response.json();
      
      if (data.success) {
        setPolicies(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Failed to load policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/phase3/policies/${selectedDept}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save policies:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Department Select */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {/* TODO: List departments from institution */}
            {['CS', 'Mathematics', 'Science', 'English'].map((dept) => (
              <Button
                key={dept}
                variant={selectedDept === dept ? 'default' : 'outline'}
                onClick={() => setSelectedDept(dept)}
                className="w-full"
              >
                {dept}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDept && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Policy Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Max Daily Duties */}
            <div>
              <Label className="text-sm font-medium">Max Duties per Day</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.max_daily_duties}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_daily_duties: parseInt(e.target.value)
                  })
                }
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Teachers cannot have more than this many duties on a single day
              </p>
            </div>

            {/* Max Weekly Duties */}
            <div>
              <Label className="text-sm font-medium">Max Duties per Week</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.max_weekly_duties}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_weekly_duties: parseInt(e.target.value)
                  })
                }
                className="mt-1"
              />
            </div>

            {/* Min Gap Hours */}
            <div>
              <Label className="text-sm font-medium">Min Gap Between Duties (hours)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.min_gap_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_gap_hours: parseFloat(e.target.value)
                  })
                }
                className="mt-1"
              />
            </div>

            {/* Seniority Multiplier */}
            <div>
              <Label className="text-sm font-medium">Seniority Multiplier</Label>
              <Input
                type="number"
                min="1"
                step="0.1"
                value={formData.seniority_multiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seniority_multiplier: parseFloat(e.target.value)
                  })
                }
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Senior teachers get 1.2x the workload of junior teachers
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Policies
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PolicyEditorPanel;
```

---

### 5. EmergencyHandler Component

**File:** `src/components/phase3/EmergencyHandler/EmergencyPanel.tsx`

```typescript
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface EmergencyHandlerPanelProps {
  allocation: any;
  institution: any;
  onReplaced: () => void;
}

export const EmergencyHandlerPanel: React.FC<EmergencyHandlerPanelProps> = ({
  allocation,
  institution,
  onReplaced
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [emergencyData, setEmergencyData] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState<Record<string, string>>({});

  const [reason, setReason] = useState<'illness' | 'leave' | 'conflict' | 'emergency' | 'other'>('illness');

  const handleFindReplacements = async () => {
    if (!selectedTeacher) return;

    try {
      setLoading(true);
      const response = await fetch('/api/phase3/emergency/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: selectedTeacher,
          reason: reason,
          availability_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        })
      });

      const data = await response.json();
      if (data.success) {
        setEmergencyData(data.data);
      }
    } catch (error) {
      console.error('Failed to find replacements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyReplacement = async (examId: string) => {
    const replacementId = selectedReplacement[examId];
    if (!selectedTeacher || !replacementId) return;

    try {
      setLoading(true);
      const response = await fetch('/api/phase3/emergency/apply-replacement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: selectedTeacher,
          replacement_id: replacementId,
          exam_id: examId,
          reason: reason
        })
      });

      if (response.ok) {
        onReplaced();
        setEmergencyData(null);
        setSelectedTeacher(null);
      }
    } catch (error) {
      console.error('Failed to apply replacement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Use this panel to handle teacher unavailability and find quick replacements
        </AlertDescription>
      </Alert>

      {/* Teacher Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Unavailable Teacher</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Reason:</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="illness">Illness</option>
              <option value="leave">Leave</option>
              <option value="conflict">Conflict</option>
              <option value="emergency">Emergency</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Teacher:</label>
            <select
              value={selectedTeacher || ''}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            >
              <option value="">Select a teacher...</option>
              {/* TODO: Populate from allocation.teachers */}
              <option value="t1">Dr. Smith</option>
              <option value="t2">Dr. Jones</option>
              <option value="t3">Dr. Brown</option>
            </select>
          </div>

          <Button
            onClick={handleFindReplacements}
            disabled={!selectedTeacher || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Finding replacements...
              </>
            ) : (
              'Find Replacements'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {emergencyData && (
        <div className="space-y-3">
          {emergencyData.affected_exams?.map((exam: any) => (
            <Card key={exam.exam_id}>
              <CardContent className="pt-4">
                <div className="mb-3">
                  <p className="font-semibold text-gray-900">{exam.subject}</p>
                  <p className="text-sm text-gray-600">
                    {exam.date} at {exam.time_slot}
                  </p>
                </div>

                <div className="space-y-2">
                  {exam.replacements?.map((candidate: any) => (
                    <label
                      key={candidate.teacher_id}
                      className="block p-2 border rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name={`exam_${exam.exam_id}`}
                        value={candidate.teacher_id}
                        checked={selectedReplacement[exam.exam_id] === candidate.teacher_id}
                        onChange={(e) =>
                          setSelectedReplacement({
                            ...selectedReplacement,
                            [exam.exam_id]: e.target.value
                          })
                        }
                        className="mr-2"
                      />
                      <span className="font-medium">{candidate.name}</span>
                      <span className="text-xs text-gray-600 ml-2">
                        (Reliability: {(candidate.reliability * 100).toFixed(0)}%)
                      </span>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={() => handleApplyReplacement(exam.exam_id)}
                  disabled={!selectedReplacement[exam.exam_id] || loading}
                  size="sm"
                  className="w-full mt-2"
                >
                  Confirm Replacement
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencyHandlerPanel;
```

---

## 🔌 Integration with Phase 2

### Python-Node Communication

**File:** `backend/services/Phase2Connector.js`

```javascript
const axios = require('axios');

class Phase2Connector {
  constructor(pythonServiceUrl = 'http://localhost:5000') {
    this.pythonUrl = pythonServiceUrl;
  }

  /**
   * Call Phase 2 optimizer via Python service
   */
  async runOptimization(allocationData) {
    try {
      const response = await axios.post(
        `${this.pythonUrl}/api/scheduler/optimize`,
        allocationData,
        { timeout: 65000 } // 65 seconds (Phase 2 timeout is 60s)
      );
      return response.data;
    } catch (error) {
      console.error('Phase 2 optimization failed:', error.message);
      throw new Error(`Phase 2 optimizer error: ${error.message}`);
    }
  }

  /**
   * Get swap recommendations from Phase 2
   */
  async getSwapRecommendations(allocation) {
    try {
      const response = await axios.post(
        `${this.pythonUrl}/api/scheduler/swaps`,
        allocation
      );
      return response.data;
    } catch (error) {
      console.error('Phase 2 swap engine failed:', error.message);
      throw error;
    }
  }

  /**
   * Get fairness analysis from Phase 2
   */
  async analyzeFairness(allocation) {
    try {
      const response = await axios.post(
        `${this.pythonUrl}/api/scheduler/analyze-fairness`,
        allocation
      );
      return response.data;
    } catch (error) {
      console.error('Phase 2 fairness analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Handle emergency rescheduling
   */
  async handleEmergency(emergency) {
    try {
      const response = await axios.post(
        `${this.pythonUrl}/api/scheduler/emergency`,
        emergency
      );
      return response.data;
    } catch (error) {
      console.error('Phase 2 emergency handling failed:', error.message);
      throw error;
    }
  }

  /**
   * Get Gemini fairness review
   */
  async getGeminiReview(allocation) {
    try {
      const response = await axios.post(
        `${this.pythonUrl}/api/scheduler/gemini-review`,
        allocation
      );
      return response.data;
    } catch (error) {
      console.error('Phase 2 Gemini review failed:', error.message);
      // Fallback to statistical analysis
      return null;
    }
  }
}

module.exports = Phase2Connector;
```

### Python Flask Wrapper (AI Engine)

**File:** `ai-engine/phase2_api.py`

```python
from flask import Blueprint, request, jsonify
from scheduler.optimizer import OptimizationEngine
from scheduler.swap_engine import SwapEngine
from scheduler.rescheduler import DynamicRescheduler
from scheduler.gemini_reviewer import GeminiFairnessReviewer
import json

scheduler_api = Blueprint('scheduler', __name__, url_prefix='/api/scheduler')

# Initialize Phase 2 components
optimizer = OptimizationEngine()
swap_engine = SwapEngine()
rescheduler = DynamicRescheduler()
gemini_reviewer = GeminiFairnessReviewer()

@scheduler_api.route('/optimize', methods=['POST'])
def optimize_allocation():
    """Phase 2: Run OR-Tools optimization"""
    data = request.json
    try:
        result = optimizer.solve_allocation(data.get('allocation'), data.get('config'))
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@scheduler_api.route('/swaps', methods=['POST'])
def find_swaps():
    """Phase 2: Get swap recommendations"""
    data = request.json
    try:
        swaps = swap_engine.find_swap_recommendations(
            data.get('allocation'),
            data.get('teachers'),
            data.get('exams')
        )
        return jsonify({'success': True, 'data': swaps})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@scheduler_api.route('/analyze-fairness', methods=['POST'])
def analyze_fairness():
    """Phase 2: Compute fairness analytics"""
    data = request.json
    try:
        analytics = optimizer._compute_fairness_metrics(data.get('allocation'))
        return jsonify({'success': True, 'data': analytics})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@scheduler_api.route('/emergency', methods=['POST'])
def handle_emergency():
    """Phase 2: Emergency rescheduling"""
    data = request.json
    try:
        result = rescheduler.handle_emergency_leave(
            data.get('teacher_id'),
            data.get('allocation'),
            data.get('teachers'),
            data.get('exams')
        )
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@scheduler_api.route('/gemini-review', methods=['POST'])
def gemini_review():
    """Phase 2: AI fairness review"""
    data = request.json
    try:
        review = gemini_reviewer.review_allocation_fairness(
            data.get('allocation'),
            data.get('metrics')
        )
        return jsonify({'success': True, 'data': review})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

---

## 🧪 Testing Strategy

### Unit Tests (Jest)

**File:** `src/components/phase3/__tests__/AllocationSimulator.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AllocationSimulator } from '../AllocationSimulator/SimulationPanel';

describe('AllocationSimulator', () => {
  const mockAllocation = {
    _id: 'alloc_1',
    exams: [{ _id: 'e1' }, { _id: 'e2' }]
  };

  const mockInstitution = {
    _id: 'inst_1',
    name: 'Test University'
  };

  it('renders simulation button', () => {
    render(
      <AllocationSimulator
        currentAllocation={mockAllocation}
        institution={mockInstitution}
        onApprove={() => {}}
      />
    );

    expect(screen.getByText(/Run Allocation Simulation/i)).toBeInTheDocument();
  });

  it('calls API when simulation is run', async () => {
    render(
      <AllocationSimulator
        currentAllocation={mockAllocation}
        institution={mockInstitution}
        onApprove={() => {}}
      />
    );

    fireEvent.click(screen.getByText(/Run Allocation Simulation/i));

    await waitFor(() => {
      expect(screen.getByText(/Preview Changes/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Tests

**File:** `backend/__tests__/phase3.integration.test.js`

```javascript
const request = require('supertest');
const app = require('../server');

describe('Phase 3 API Integration', () => {
  describe('POST /api/phase3/simulations/run', () => {
    it('should run allocation simulation', async () => {
      const response = await request(app)
        .post('/api/phase3/simulations/run')
        .send({
          institution_id: 'inst_1',
          exam_ids: ['e1', 'e2'],
          use_optimization: true
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('simulation_id');
      expect(response.body.data).toHaveProperty('allocation');
    });
  });

  describe('GET /api/phase3/analytics/:allocation_id', () => {
    it('should return fairness analytics', async () => {
      const response = await request(app)
        .get('/api/phase3/analytics/alloc_123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('fairness_score');
      expect(response.body.data).toHaveProperty('workload_stats');
    });
  });
});
```

---

## ✅ Deployment Checklist

- [ ] All type definitions created
- [ ] AllocationSimulator component built
- [ ] FairnessAnalytics dashboard built
- [ ] SwapRecommendations panel built
- [ ] PolicyEditor component built
- [ ] EmergencyHandler panel built
- [ ] TeacherExplanation component built
- [ ] Export generators (Excel/PDF) built
- [ ] Phase 3 routes registered in backend
- [ ] Phase 2 connector service created
- [ ] Python Flask wrapper endpoints created
- [ ] MongoDB models created (AllocationSimulation, AllocationHistory)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] API documentation updated
- [ ] Frontend/backend integration tested end-to-end
- [ ] Performance tested (fairness analytics < 500ms)
- [ ] Error handling implemented
- [ ] Notifications implemented for approvals
- [ ] Audit logging for all changes
- [ ] User documentation created
- [ ] Admin training completed
- [ ] Staged rollout plan created

---

## 🎉 Success Criteria

After Phase 3:

✅ Admins can preview allocations before applying
✅ Complete fairness transparency with metrics
✅ One-click fairness improvement via swaps
✅ Teachers understand their allocations
✅ Institutional policies configurable via UI
✅ Emergency replacements in < 2 minutes
✅ Professional exports (Excel/PDF/ICS)
✅ System audit trail complete
✅ Ready for SaaS scaling (Phase 4)

---

**Questions or blockers? Review the Phase 3 API specs or component templates above.**
