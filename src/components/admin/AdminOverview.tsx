// src/components/admin/AdminOverview.tsx (Refined - Clean Professional Layout)
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, ClipboardList, TrendingUp, Award, Zap, Shield, Target } from 'lucide-react';
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

  const allocationRate = stats.exam_schedules > 0
    ? Math.round((stats.duties_allocated / (stats.exam_schedules * 3)) * 100)
    : 0;

  const cards = [
    {
      title: 'Total Teachers',
      value: stats.total_teachers,
      icon: <Users className="h-5 w-5" />,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Exam Schedules',
      value: stats.exam_schedules,
      icon: <Calendar className="h-5 w-5" />,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: 'Duties Allocated',
      value: stats.duties_allocated,
      icon: <ClipboardList className="h-5 w-5" />,
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
    },
    {
      title: 'Allocation Rate',
      value: `${allocationRate}%`,
      icon: <Target className="h-5 w-5" />,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-6">
                <div className="animate-pulse h-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400 uppercase tracking-wider">Admin Panel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Welcome back, Administrator
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Manage teacher allocations, exam schedules, and monitor fairness metrics powered by AI optimization.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">AI Engine Active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, idx) => (
          <Card key={idx} className="shadow-sm hover:shadow-md transition-all duration-200 border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md`}>
                  <div className="text-white">{card.icon}</div>
                </div>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{card.value}</span>
              </div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{card.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insights Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="shadow-sm border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base">AI Allocation Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Allocation Rate</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{allocationRate}%</span>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${allocationRate}%` }}
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                Workload distribution is balanced across departments.
                {stats.pending_swaps > 0 ? ` ${stats.pending_swaps} swap request(s) pending review.` : ' No fairness violations detected.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">System Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Allocation Engine</span>
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Fairness Monitor</span>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Swap Recommendations</span>
                <span className="text-sm font-medium text-amber-600">{stats.pending_swaps} Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}