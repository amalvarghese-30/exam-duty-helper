import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DutyRow {
  id: string;
  status: string;
  exam: {
    subject: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_number: string;
  } | null;
}

export default function TeacherDuties() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<DutyRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;

      const { data } = await supabase
        .from('duty_allocations')
        .select('id, status, exam:exam_schedules(subject, exam_date, start_time, end_time, room_number)')
        .eq('teacher_id', teacher.id)
        .order('allocated_at', { ascending: false });

      if (data) setDuties(data as unknown as DutyRow[]);
    };
    fetch();
  }, [user]);

  const statusColor = (s: string) => {
    if (s === 'assigned') return 'bg-primary/10 text-primary border-primary/20';
    if (s === 'accepted') return 'bg-success/10 text-success border-success/20';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="animate-fade-in">
      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No duties assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              duties.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.exam?.subject || '—'}</TableCell>
                  <TableCell>{d.exam?.exam_date ? new Date(d.exam.exam_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.exam?.start_time?.slice(0,5)} – {d.exam?.end_time?.slice(0,5)}
                  </TableCell>
                  <TableCell>{d.exam?.room_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(d.status)}>{d.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
