import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ModuleHero from '@/components/ModuleHero';
import { ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface ConflictResponse {
  generatedAt: string;
  summary: {
    totalRoomConflicts: number;
    totalTeacherConflicts: number;
    totalLeaveConflicts: number;
    totalSubjectConflicts: number;
    healthy: boolean;
  };
  roomConflicts: Array<{ room: string; date: string; time: string; exams: Array<{ subject: string; class_name: string }> }>;
  teacherConflicts: Array<{ teacher: { name: string; email: string }; date: string; exams: string[] }>;
  leaveConflicts: Array<{ teacher: string; email: string; date: string; exam: string }>;
  subjectConflicts: Array<{ teacher: string; subject: string; date: string }>;
}

export default function ConflictDetection() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ConflictResponse | null>(null);

  const fetchConflicts = async () => {
    try {
      const res = await axios.get(`${API}/auto-allocate/conflicts`);
      setData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load conflict detection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
    const timer = setInterval(fetchConflicts, 15000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">Scanning conflicts...</CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">No conflict data available.</CardContent>
      </Card>
    );
  }

  const summaryCards = [
    { label: 'Room Conflicts', value: data.summary.totalRoomConflicts },
    { label: 'Teacher Date Clashes', value: data.summary.totalTeacherConflicts },
    { label: 'Leave Violations', value: data.summary.totalLeaveConflicts },
    { label: 'Subject Violations', value: data.summary.totalSubjectConflicts },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleHero
        eyebrow="Real-Time Conflict Detection"
        title="Live Clash Monitoring"
        description="Detects room overlap, teacher date clashes, leave violations, and subject-rule mismatches every 15 seconds."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {data.summary.healthy ? (
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Healthy
            </Badge>
          ) : (
            <Badge variant="outline" className="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Attention Required
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">Last scan: {new Date(data.generatedAt).toLocaleTimeString()}</span>
        </div>
        <Button variant="outline" onClick={fetchConflicts}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Now
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConflictBlock title="Room Conflicts" items={data.roomConflicts.map((item) => `${item.room} on ${new Date(item.date).toLocaleDateString()} at ${item.time}: ${item.exams.map((exam) => `${exam.subject} (${exam.class_name})`).join(', ')}`)} />
      <ConflictBlock title="Teacher Date Conflicts" items={data.teacherConflicts.map((item) => `${item.teacher?.name || 'Unknown'} on ${new Date(item.date).toLocaleDateString()} for ${item.exams.join(', ')}`)} />
      <ConflictBlock title="Leave Conflicts" items={data.leaveConflicts.map((item) => `${item.teacher} assigned ${item.exam} on leave date ${new Date(item.date).toLocaleDateString()}`)} />
      <ConflictBlock title="Subject Rule Conflicts" items={data.subjectConflicts.map((item) => `${item.teacher} assigned own subject ${item.subject} on ${new Date(item.date).toLocaleDateString()}`)} />
    </div>
  );
}

function ConflictBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{items.length === 0 ? 'No issues detected.' : `${items.length} issue(s) found.`}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records.</p>
        ) : (
          items.map((line, idx) => (
            <div key={`${title}-${idx}`} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-sm text-foreground">
              {line}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
