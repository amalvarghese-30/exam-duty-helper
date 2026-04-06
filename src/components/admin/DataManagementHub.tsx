import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ModuleHero from '@/components/ModuleHero';
import { Database, Users, CalendarDays, ClipboardList, CalendarCheck2 } from 'lucide-react';

const API = 'http://localhost:5000';

interface HubResponse {
  counts: {
    teachers: number;
    exams: number;
    leaves: number;
    allocations: number;
  };
  policy: {
    autoRunOnExamChange: boolean;
    lastTriggeredAt?: string;
    updatedAt?: string;
  };
  teachers: Array<{ _id: string; name: string; email: string; department: string; subject: string }>;
  exams: Array<{ _id: string; subject: string; class_name: string; exam_date: string; start_time: string; room_number: string }>;
  leaves: Array<{ _id: string; leave_date: string; reason: string; teacher_id?: { name: string; email: string } }>;
  allocations: Array<{ _id: string; status: string; teacher_id?: { name: string; email: string }; exam_id?: { subject: string; class_name: string; exam_date: string; start_time: string } }>;
}

export default function DataManagementHub() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HubResponse | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/auto-allocate/data-hub`);
      setData(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load data hub');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">Loading centralized data...</CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">No data available.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleHero
        eyebrow="Centralized Data Management"
        title="Unified Scheduling Data Hub"
        description="One place to monitor teachers, exams, leaves, and allocations with policy status for complete operational visibility."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Teachers" value={data.counts.teachers} icon={<Users className="h-5 w-5" />} />
        <Metric title="Exams" value={data.counts.exams} icon={<CalendarDays className="h-5 w-5" />} />
        <Metric title="Leave Records" value={data.counts.leaves} icon={<CalendarCheck2 className="h-5 w-5" />} />
        <Metric title="Allocations" value={data.counts.allocations} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Policy State
          </CardTitle>
          <CardDescription>Operational settings used by automated assignment.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Auto Run: {data.policy.autoRunOnExamChange ? 'Enabled' : 'Disabled'}</Badge>
          {data.policy.updatedAt && <Badge variant="outline">Policy Updated: {new Date(data.policy.updatedAt).toLocaleString()}</Badge>}
          {data.policy.lastTriggeredAt && <Badge variant="outline">Last Auto Run: {new Date(data.policy.lastTriggeredAt).toLocaleString()}</Badge>}
        </CardContent>
      </Card>

      <DataList
        title="Recent Teachers"
        rows={data.teachers.slice(0, 8).map((row) => `${row.name} • ${row.department || 'General'} • ${row.subject || 'N/A'}`)}
      />
      <DataList
        title="Upcoming Exams"
        rows={data.exams.slice(0, 10).map((row) => `${row.subject} (${row.class_name}) • ${new Date(row.exam_date).toLocaleDateString()} ${row.start_time?.slice(0, 5)} • Room ${row.room_number || 'TBA'}`)}
      />
      <DataList
        title="Recent Leave Entries"
        rows={data.leaves.slice(0, 10).map((row) => `${row.teacher_id?.name || 'Unknown'} • ${new Date(row.leave_date).toLocaleDateString()} • ${row.reason || 'No reason'}`)}
      />
      <DataList
        title="Latest Allocations"
        rows={data.allocations.slice(0, 10).map((row) => `${row.teacher_id?.name || 'Unknown'} -> ${row.exam_id?.subject || 'Unknown'} (${row.exam_id?.class_name || 'N/A'}) on ${row.exam_id?.exam_date ? new Date(row.exam_id.exam_date).toLocaleDateString() : 'N/A'}`)}
      />
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
          {icon}
        </div>
        <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function DataList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : (
          rows.map((row, idx) => (
            <div key={`${title}-${idx}`} className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-foreground">
              {row}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
