import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardList, Calendar, AlertCircle, CheckCircle, Clock,
  Award, BookOpen, User, Sparkles, TrendingUp, Shield, Target
} from 'lucide-react';
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

interface TeacherProfile {
  name: string;
  email: string;
  department: string;
  subject: string;
  seniority_years: number;
  totalDuties: number;
}

export default function TeacherOverview() {
  const { user } = useAuth();
  const [recentDuties, setRecentDuties] = useState<Duty[]>([]);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [stats, setStats] = useState({ total_duties: 0, upcoming_duties: 0, leave_days: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dutiesRes, profileRes] = await Promise.all([
          TeacherDashboardService.getTeacherStats(),
          TeacherDashboardService.getTeacherDuties({ limit: 5 }),
          TeacherDashboardService.getTeacherProfile()
        ]);

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        if (dutiesRes.success && dutiesRes.data) {
          setRecentDuties(dutiesRes.data.slice(0, 5));
        }
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
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
    const statusConfig: Record<string, { color: string; icon: JSX.Element; label: string }> = {
      upcoming: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: <Clock className="h-3 w-3" />, label: 'Upcoming' },
      assigned: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: <AlertCircle className="h-3 w-3" />, label: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: <CheckCircle className="h-3 w-3" />, label: 'Accepted' },
      completed: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', icon: <CheckCircle className="h-3 w-3" />, label: 'Completed' }
    };
    const config = statusConfig[status.toLowerCase()] || statusConfig.assigned;
    return (
      <Badge variant="outline" className={`${config.color} border-0 flex items-center gap-1 px-2 py-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="animate-pulse h-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      {profile && (
        <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg">{profile.name}</h3>
                <div className="flex flex-wrap gap-3 mt-1">
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {profile.department || 'Department not set'}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {profile.subject || 'Subject not set'}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    {profile.seniority_years || 0} years experience
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-primary">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl">
          <ClipboardList className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.total_duties}</p>
          <p className="text-xs text-muted-foreground">Total Duties</p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl">
          <Calendar className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.upcoming_duties}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl">
          <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.leave_days}</p>
          <p className="text-xs text-muted-foreground">Leave Days</p>
        </div>
      </div>

      {/* Recent Duties */}
      {recentDuties.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent & Upcoming Duties
          </h4>
          <div className="space-y-2">
            {recentDuties.map((duty, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:shadow-md transition-all">
                <div>
                  <p className="font-medium text-sm">{duty.subject_name || 'Untitled Exam'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    📅 {duty.date ? new Date(duty.date).toLocaleDateString() : 'Date TBA'} •
                    ⏰ {duty.time_from?.slice(0, 5) || 'TBA'} - {duty.time_to?.slice(0, 5) || 'TBA'} •
                    🏫 {duty.room || 'Room TBA'}
                  </p>
                </div>
                {getStatusBadge(duty.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Helpful Tip */}
      <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl p-5 border border-blue-600/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">💡 AI Assistant Tip</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Use the AI Chat Assistant on the right to ask questions about your duties,
              request swaps, or understand how allocations are made. I'm here 24/7 to help!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}