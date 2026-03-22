import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wand2, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';

interface Allocation {
  id: string;
  teacher_id: string;
  exam_id: string;
  status: string;
  teacher: { name: string; department: string } | null;
  exam: { subject: string; exam_date: string; start_time: string; end_time: string; room_number: string } | null;
}

export default function DutyAllocation() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'calendar'>('table');

  const fetchAllocations = async () => {
    const { data } = await supabase
      .from('duty_allocations')
      .select('*, teacher:teachers(name, department), exam:exam_schedules(subject, exam_date, start_time, end_time, room_number)')
      .order('allocated_at', { ascending: false });
    if (data) setAllocations(data as unknown as Allocation[]);
  };

  useEffect(() => { fetchAllocations(); }, []);

  const runAllocation = async () => {
    setLoading(true);
    try {
      // Fetch all exams and teachers
      const [{ data: exams }, { data: teachers }, { data: existingAllocs }, { data: leaveDates }] = await Promise.all([
        supabase.from('exam_schedules').select('*'),
        supabase.from('teachers').select('*').eq('availability_status', 'available'),
        supabase.from('duty_allocations').select('*'),
        supabase.from('teacher_leave_dates').select('*'),
      ]);

      if (!exams?.length) { toast.error('No exams to allocate'); setLoading(false); return; }
      if (!teachers?.length) { toast.error('No available teachers'); setLoading(false); return; }

      // Build leave set
      const leaveSet = new Set((leaveDates || []).map(l => `${l.teacher_id}_${l.leave_date}`));
      // Build existing allocation set
      const existingSet = new Set((existingAllocs || []).map(a => `${a.teacher_id}_${a.exam_id}`));
      // Track workload per teacher
      const workload: Record<string, number> = {};
      teachers.forEach(t => { workload[t.id] = 0; });
      (existingAllocs || []).forEach(a => {
        if (workload[a.teacher_id] !== undefined) workload[a.teacher_id]++;
      });

      // Track teacher time slots to prevent overlaps
      const teacherSlots: Record<string, { date: string; start: string; end: string }[]> = {};
      teachers.forEach(t => { teacherSlots[t.id] = []; });
      (existingAllocs || []).forEach(a => {
        const exam = exams.find(e => e.id === a.exam_id);
        if (exam && teacherSlots[a.teacher_id]) {
          teacherSlots[a.teacher_id].push({ date: exam.exam_date, start: exam.start_time, end: exam.end_time });
        }
      });

      const newAllocations: { teacher_id: string; exam_id: string; status: string }[] = [];

      for (const exam of exams) {
        const needed = exam.required_invigilators;
        const alreadyAssigned = (existingAllocs || []).filter(a => a.exam_id === exam.id).length;
        const remaining = needed - alreadyAssigned;

        if (remaining <= 0) continue;

        // Filter eligible teachers for this exam
        const eligible = teachers
          .filter(t => {
            // Not already assigned to this exam
            if (existingSet.has(`${t.id}_${exam.id}`)) return false;
            if (newAllocations.some(a => a.teacher_id === t.id && a.exam_id === exam.id)) return false;
            // Not on leave
            if (leaveSet.has(`${t.id}_${exam.exam_date}`)) return false;
            // No time overlap
            const slots = [...(teacherSlots[t.id] || [])];
            const hasOverlap = slots.some(s =>
              s.date === exam.exam_date && s.start < exam.end_time && s.end > exam.start_time
            );
            return !hasOverlap;
          })
          .sort((a, b) => (workload[a.id] || 0) - (workload[b.id] || 0)); // Lowest workload first

        for (let i = 0; i < remaining && i < eligible.length; i++) {
          const teacher = eligible[i];
          newAllocations.push({ teacher_id: teacher.id, exam_id: exam.id, status: 'assigned' });
          workload[teacher.id] = (workload[teacher.id] || 0) + 1;
          if (!teacherSlots[teacher.id]) teacherSlots[teacher.id] = [];
          teacherSlots[teacher.id].push({ date: exam.exam_date, start: exam.start_time, end: exam.end_time });
        }
      }

      if (newAllocations.length === 0) {
        toast.info('All duties are already allocated');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('duty_allocations').insert(newAllocations);
      if (error) { toast.error(error.message); setLoading(false); return; }

      toast.success(`${newAllocations.length} duties allocated successfully!`);
      fetchAllocations();
    } catch (err: any) {
      toast.error(err.message || 'Allocation failed');
    }
    setLoading(false);
  };

  const clearAllocations = async () => {
    const { error } = await supabase.from('duty_allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) { toast.error(error.message); return; }
    toast.success('All allocations cleared');
    fetchAllocations();
  };

  const statusColor = (s: string) => {
    if (s === 'assigned') return 'bg-primary/10 text-primary border-primary/20';
    if (s === 'accepted') return 'bg-success/10 text-success border-success/20';
    if (s === 'on_leave') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-muted text-muted-foreground';
  };

  // Calendar view
  const calendarData = allocations.reduce<Record<string, Allocation[]>>((acc, a) => {
    const date = a.exam?.exam_date || '';
    if (!acc[date]) acc[date] = [];
    acc[date].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button onClick={runAllocation} disabled={loading}>
            <Wand2 className="h-4 w-4 mr-2" />
            {loading ? 'Allocating...' : 'AI Auto-Allocate'}
          </Button>
          <Button variant="outline" onClick={clearAllocations}>
            <RefreshCw className="h-4 w-4 mr-2" /> Clear All
          </Button>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setView('table')}>Table</Button>
          <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setView('calendar')}>
            <CalendarIcon className="h-4 w-4 mr-1" /> Calendar
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No allocations yet. Click "AI Auto-Allocate" to assign duties.
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.teacher?.name || '—'}</TableCell>
                    <TableCell>{a.exam?.subject || '—'}</TableCell>
                    <TableCell>{a.exam?.exam_date ? new Date(a.exam.exam_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.exam?.start_time?.slice(0,5)} – {a.exam?.end_time?.slice(0,5)}
                    </TableCell>
                    <TableCell>{a.exam?.room_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(a.status)}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(calendarData).sort().map(([date, allocs]) => (
            <Card key={date} className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allocs.map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{a.exam?.subject}</p>
                      <p className="text-xs text-muted-foreground">{a.teacher?.name} • {a.exam?.room_number}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {a.exam?.start_time?.slice(0,5)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {Object.keys(calendarData).length === 0 && (
            <Card className="col-span-full shadow-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                No allocations to display in calendar view.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
