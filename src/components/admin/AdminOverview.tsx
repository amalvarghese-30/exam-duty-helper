import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ClipboardList, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AdminDashboardService } from '@/services/AdminDashboardService';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    total_teachers: 0,
    exam_schedules: 0,
    duties_allocated: 0,
    pending_swaps: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await AdminDashboardService.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Teachers', value: stats.total_teachers, icon: <Users className="h-5 w-5" />, color: 'text-primary' },
    { title: 'Exam Schedules', value: stats.exam_schedules, icon: <Calendar className="h-5 w-5" />, color: 'text-success' },
    { title: 'Duties Allocated', value: stats.duties_allocated, icon: <ClipboardList className="h-5 w-5" />, color: 'text-accent' },
    { title: 'Pending Swaps', value: stats.pending_swaps, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-warning' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-5">
                <div className="animate-pulse h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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