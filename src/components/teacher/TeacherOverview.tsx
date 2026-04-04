// src/components/teacher/TeacherOverview.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { TeacherDashboardService } from '@/services/TeacherDashboardService';

interface Duty {
  exam_id: string;
  subject_name: string;
  date: string;
  time_from: string;
  time_to: string;
  room: string;
  duty_types: string[];
  status: string;
}

export default function TeacherOverview() {
  const { user } = useAuth();
  const [recentDuties, setRecentDuties] = useState<Duty[]>([]);
  const [stats, setStats] = useState({ total_duties: 0, upcoming_duties: 0, leave_days: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dutiesRes] = await Promise.all([
          TeacherDashboardService.getTeacherStats(),
          TeacherDashboardService.getTeacherDuties({ limit: 5 })
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }

        if (dutiesRes.success && dutiesRes.data) {
          setRecentDuties(dutiesRes.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Failed to fetch teacher data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: JSX.Element }> = {
      upcoming: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3" /> },
      assigned: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-3 w-3" /> },
      accepted: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
      completed: { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="h-3 w-3" /> }
    };
    const config = statusConfig[status.toLowerCase()] || statusConfig.assigned;
    return (
      <Badge variant="outline" className={`${config.color} border-0 flex items-center gap-1`}>
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-muted rounded-lg" />
        <div className="animate-pulse h-48 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-primary/5 rounded-lg">
          <ClipboardList className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.total_duties}</p>
          <p className="text-xs text-muted-foreground">Total Duties</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.upcoming_duties}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.leave_days}</p>
          <p className="text-xs text-muted-foreground">Leave Days</p>
        </div>
      </div>

      {/* Recent Duties */}
      {recentDuties.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Duties</h4>
          <div className="space-y-2">
            {recentDuties.map((duty, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{duty.subject_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {duty.date ? new Date(duty.date).toLocaleDateString() : 'Date TBA'} •
                    {duty.room || 'Room TBA'}
                  </p>
                </div>
                {getStatusBadge(duty.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Tip */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
        <p className="text-sm font-medium mb-1">💡 Need help?</p>
        <p className="text-xs text-muted-foreground">
          Use the AI Chat Assistant on the right to ask questions about your duties,
          request swaps, or understand how allocations are made.
        </p>
      </div>
    </div>
  );
}