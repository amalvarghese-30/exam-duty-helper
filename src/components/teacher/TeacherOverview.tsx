import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Calendar, AlertCircle } from 'lucide-react';

export default function TeacherOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ duties: 0, upcoming: 0, leaveDays: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;

      const [duties, leave] = await Promise.all([
        supabase.from('duty_allocations').select('*, exam:exam_schedules(exam_date)').eq('teacher_id', teacher.id),
        supabase.from('teacher_leave_dates').select('id', { count: 'exact', head: true }).eq('teacher_id', teacher.id),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const upcoming = (duties.data || []).filter(d => {
        const examDate = (d as any).exam?.exam_date;
        return examDate && examDate >= today;
      }).length;

      setStats({
        duties: duties.data?.length || 0,
        upcoming,
        leaveDays: leave.count || 0,
      });
    };
    fetch();
  }, [user]);

  const cards = [
    { title: 'Total Duties', value: stats.duties, icon: <ClipboardList className="h-5 w-5" />, color: 'text-primary' },
    { title: 'Upcoming', value: stats.upcoming, icon: <Calendar className="h-5 w-5" />, color: 'text-success' },
    { title: 'Leave Days', value: stats.leaveDays, icon: <AlertCircle className="h-5 w-5" />, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{c.value}</p>
                </div>
                <div className={`${c.color} opacity-70`}>{c.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
