import { useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ModuleHero from '@/components/ModuleHero';
import { toast } from 'sonner';
import { FlaskConical, Play, Bot } from 'lucide-react';

const API = 'http://localhost:5000';

interface SimulationResult {
  summary: {
    totalExams: number;
    assignedCount: number;
    unassignedCount: number;
    fairnessRange: number;
    absentTeacherEmails: string[];
  };
  interpreted_logic: Record<string, unknown>;
  explanation: string;
  roster: Array<{
    teacher: string;
    exam: string;
    date: string;
  }>;
}

const BASE_RULES = `1. Teachers should not invigilate their own subject.
2. Teachers on leave should not be assigned.
3. Distribute duties so each teacher gets approximately equal total duties.
4. Avoid assigning teachers multiple times on same date.`;

export default function AllocationSimulation() {
  const [rules, setRules] = useState(BASE_RULES);
  const [absentCsv, setAbsentCsv] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const absentTeacherEmails = absentCsv
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const response = await axios.post(`${API}/auto-allocate/simulate`, {
        rules,
        absentTeacherEmails,
      });

      setResult(response.data);
      toast.success('Simulation completed');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const topRows = useMemo(() => result?.roster?.slice(0, 12) || [], [result]);

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleHero
        eyebrow="Allocation Simulation Dashboard"
        title="Risk-Free Scenario Testing"
        description="Run dry-runs with custom constraints and absence scenarios before touching real allocation data."
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-600" />
            Simulation Inputs
          </CardTitle>
          <CardDescription>Define hypothetical rules and teacher absences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="simulation-rules">Rules</Label>
            <Textarea
              id="simulation-rules"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={6}
              className="bg-card"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="simulation-absentees">Absent teacher emails (comma separated)</Label>
            <Input
              id="simulation-absentees"
              value={absentCsv}
              onChange={(e) => setAbsentCsv(e.target.value)}
              placeholder="teacher1@college.edu, teacher2@college.edu"
              className="bg-card"
            />
          </div>
          <Button onClick={runSimulation} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
            <Play className="mr-2 h-4 w-4" />
            {loading ? 'Running Simulation...' : 'Run Simulation'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat title="Total Exams" value={String(result.summary.totalExams)} />
            <Stat title="Assigned" value={String(result.summary.assignedCount)} />
            <Stat title="Unassigned" value={String(result.summary.unassignedCount)} tone="warn" />
            <Stat title="Fairness Range" value={String(result.summary.fairnessRange)} />
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Simulation Explanation
              </CardTitle>
              <CardDescription>Interpretation generated from simulation output.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {(result.explanation || '').split('\n').map((line, idx) => (
                  <p key={idx}>{line || '\u00A0'}</p>
                ))}
              </div>
              {result.summary.absentTeacherEmails?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.summary.absentTeacherEmails.map((email) => (
                    <Badge key={email} variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                      Absent: {email}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Simulated Allocation Preview</CardTitle>
              <CardDescription>Top rows from simulated roster (non-persistent).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {topRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rows returned by simulation.</p>
              ) : (
                topRows.map((row, idx) => (
                  <div key={`${row.teacher}-${row.exam}-${idx}`} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/50">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.exam}</p>
                      <p className="text-xs text-muted-foreground">{new Date(row.date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className={row.teacher === 'UNASSIGNED' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}>
                      {row.teacher}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ title, value, tone }: { title: string; value: string; tone?: 'warn' }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
        <p className={`mt-1 text-2xl font-bold ${tone === 'warn' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
