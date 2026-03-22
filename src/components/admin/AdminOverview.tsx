import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ClipboardList, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API = "http://localhost:5000";

export default function AdminOverview() {
  const [stats, setStats] = useState({ teachers: 0, exams: 0, allocations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [teachersRes, examsRes, dutiesRes] = await Promise.all([
          axios.get(`${API}/teachers`),
          axios.get(`${API}/exams`),
          axios.get(`${API}/duties`),
        ]);

        setStats({
          teachers: teachersRes.data.length,
          exams: examsRes.data.length,
          allocations: dutiesRes.data.length,
        });
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
    { title: 'Total Teachers', value: stats.teachers, icon: <Users className="h-5 w-5" />, color: 'text-primary' },
    { title: 'Exam Schedules', value: stats.exams, icon: <Calendar className="h-5 w-5" />, color: 'text-success' },
    { title: 'Duties Allocated', value: stats.allocations, icon: <ClipboardList className="h-5 w-5" />, color: 'text-accent' },
    { title: 'Pending Swaps', value: 0, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-warning' },
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