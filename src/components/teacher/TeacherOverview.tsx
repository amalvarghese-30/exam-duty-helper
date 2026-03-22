import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = "http://localhost:5000";

export default function TeacherOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ duties: 0, upcoming: 0, leaveDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        // Get teacher ID by email
        const teacherRes = await axios.get(`${API}/teachers/email/${user.email}`);
        const teacherId = teacherRes.data._id;

        // Fetch duties for this teacher
        const dutiesRes = await axios.get(`${API}/duties/teacher/${teacherId}`);
        const duties = dutiesRes.data;

        // Fetch leave dates
        const leaveRes = await axios.get(`${API}/teacher-leave/${teacherId}`);
        const leaveDates = leaveRes.data;

        const today = new Date().toISOString().split('T')[0];
        const upcomingDuties = duties.filter((d: any) => {
          const examDate = d.exam?.exam_date;
          return examDate && examDate >= today;
        }).length;

        setStats({
          duties: duties.length,
          upcoming: upcomingDuties,
          leaveDays: leaveDates.length,
        });
      } catch (error) {
        console.error('Failed to fetch teacher stats:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const cards = [
    { title: 'Total Duties', value: stats.duties, icon: <ClipboardList className="h-5 w-5" />, color: 'text-primary' },
    { title: 'Upcoming', value: stats.upcoming, icon: <Calendar className="h-5 w-5" />, color: 'text-success' },
    { title: 'Leave Days', value: stats.leaveDays, icon: <AlertCircle className="h-5 w-5" />, color: 'text-warning' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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