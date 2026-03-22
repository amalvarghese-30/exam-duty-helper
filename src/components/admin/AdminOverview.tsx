import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ClipboardList, AlertTriangle } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({ teachers: 0, exams: 0, allocations: 0, pending: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [t, e, a] = await Promise.all([
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('exam_schedules').select('id', { count: 'exact', head: true }),
        supabase.from('duty_allocations').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        teachers: t.count ?? 0,
        exams: e.count ?? 0,
        allocations: a.count ?? 0,
        pending: 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Teachers', value: stats.teachers, icon: <Users className="h-5 w-5" />, color: 'text-primary' },
    { title: 'Exam Schedules', value: stats.exams, icon: <Calendar className="h-5 w-5" />, color: 'text-success' },
    { title: 'Duties Allocated', value: stats.allocations, icon: <ClipboardList className="h-5 w-5" />, color: 'text-accent' },
    { title: 'Pending Swaps', value: stats.pending, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to manage teachers, exam schedules, and run AI-powered duty allocation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
