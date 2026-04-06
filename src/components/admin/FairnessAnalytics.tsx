import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ModuleHero from '@/components/ModuleHero';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Scale, Users, ShieldCheck, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:5000';

interface TeacherLoadRow {
  teacherId: string;
  teacherName: string;
  email: string;
  department: string;
  subject: string;
  duties: number;
}

interface FairnessData {
  teacherLoad: TeacherLoadRow[];
  summary: {
    totalTeachers: number;
    totalAssignedDuties: number;
    averageDuties: number;
    minDuties: number;
    maxDuties: number;
    dutyRange: number;
    standardDeviation: number;
    fairnessScore: number;
    highLoadTeachers: number;
    lowLoadTeachers: number;
  };
  cycle: {
    totalExams: number;
    assignedExams: number;
    unassignedExams: number;
  };
}

export default function FairnessAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FairnessData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/auto-allocate/fairness`);
      setData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load fairness analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sortedTeachers = useMemo(() => {
    if (!data?.teacherLoad) return [];
    return [...data.teacherLoad].sort((a, b) => b.duties - a.duties);
  }, [data]);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">Loading fairness dashboard...</CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">No fairness data available.</CardContent>
      </Card>
    );
  }

  const scoreTone =
    data.summary.fairnessScore >= 80
      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/35 dark:border-emerald-700/40'
      : data.summary.fairnessScore >= 60
        ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/35 dark:border-amber-700/40'
        : 'bg-rose-50 border-rose-200 dark:bg-rose-950/35 dark:border-rose-700/40';

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleHero
        eyebrow="Fairness Analytics Dashboard"
        title="Workload Equity and Allocation Health"
        description="Track whether allocation is balanced across faculty, identify over-loaded teachers, and monitor unassigned exam risk before final publishing."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<Scale className="h-5 w-5" />} title="Fairness Score" value={`${data.summary.fairnessScore}/100`} subtitle="Higher is better" tone={scoreTone} />
        <MetricCard icon={<Users className="h-5 w-5" />} title="Teacher Spread" value={`${data.summary.minDuties} - ${data.summary.maxDuties}`} subtitle={`Range ${data.summary.dutyRange}`} />
        <MetricCard icon={<ShieldCheck className="h-5 w-5" />} title="Assigned Exams" value={`${data.cycle.assignedExams}/${data.cycle.totalExams}`} subtitle="Cycle coverage" />
        <MetricCard icon={<AlertTriangle className="h-5 w-5" />} title="Unassigned Risk" value={String(data.cycle.unassignedExams)} subtitle="Needs manual attention" />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Duty Distribution by Teacher</CardTitle>
          <CardDescription>Visual distribution of assigned invigilation duties.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedTeachers} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="teacherName"
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value: number) => [`${value} duties`, 'Assigned']} />
                <Bar dataKey="duties" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardHeader>
          <CardTitle>Teacher Load Table</CardTitle>
          <CardDescription>Operational view for targeted balancing actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedTeachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teacher load data available yet.</p>
          ) : (
            sortedTeachers.map((row) => (
              <div key={row.teacherId} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/60">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{row.teacherName}</p>
                  <p className="text-xs text-muted-foreground">{row.department} • {row.subject} • {row.email}</p>
                </div>
                <Badge variant="outline" className="w-fit border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                  {row.duties} duties
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  tone?: string;
}) {
  return (
    <Card className={`shadow-card ${tone || ''}`}>
      <CardContent className="p-5">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
          {icon}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
