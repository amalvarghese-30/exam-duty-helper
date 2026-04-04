// src/components/teacher/TeacherDashboard.tsx (Refined)
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, ClipboardList, CalendarDays, TrendingUp, CheckCircle, Clock, AlertCircle, Sparkles, Briefcase, Target } from 'lucide-react';
import TeacherDuties from './TeacherDuties';
import TeacherAvailability from './TeacherAvailability';
import TeacherOverview from './TeacherOverview';
import TeacherChatAssistant from './TeacherChatAssistant';
import { TeacherDashboardService } from '@/services/TeacherDashboardService';

const navItems = [
    { label: 'Overview', href: '/teacher', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'My Duties', href: '/teacher/duties', icon: <ClipboardList className="h-4 w-4" /> },
    { label: 'Availability', href: '/teacher/availability', icon: <CalendarDays className="h-4 w-4" /> },
];

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total_duties: 0,
        upcoming_duties: 0,
        leave_days: 0,
        accepted_duties: 0,
        pending_approvals: 0
    });
    const [teacherProfile, setTeacherProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, profileRes] = await Promise.all([
                    TeacherDashboardService.getTeacherStats(),
                    TeacherDashboardService.getTeacherProfile()
                ]);

                if (statsRes.success && statsRes.data) {
                    setStats(statsRes.data);
                }
                if (profileRes.success && profileRes.data) {
                    setTeacherProfile(profileRes.data);
                    localStorage.setItem('userName', profileRes.data.name);
                    localStorage.setItem('userDepartment', profileRes.data.department || '');
                    localStorage.setItem('userSubject', profileRes.data.subject || '');
                }
            } catch (error) {
                console.error('Failed to fetch teacher data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statsCards = [
        { title: 'Total Duties', value: stats.total_duties, icon: <Briefcase className="h-5 w-5" />, color: 'text-primary', bg: 'bg-primary/10' },
        { title: 'Upcoming', value: stats.upcoming_duties, icon: <Clock className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Accepted', value: stats.accepted_duties || 0, icon: <CheckCircle className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50' },
        { title: 'Pending', value: stats.pending_approvals || 0, icon: <AlertCircle className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const fairnessScore = stats.total_duties > 0 ? Math.min(100, Math.round(85 - (stats.total_duties - 3) * 5)) : 85;

    if (loading) {
        return (
            <DashboardLayout navItems={navItems} title="Teacher Dashboard">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout navItems={navItems} title="Teacher Dashboard">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-yellow-400" />
                            <span className="text-xs font-medium text-yellow-400 uppercase tracking-wider">AI Powered Dashboard</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-1">
                            Welcome back, {teacherProfile?.name || 'Teacher'}!
                        </h1>
                        <p className="text-slate-300 text-sm max-w-xl">
                            Here's your exam duty overview. The system has optimized your schedule for maximum efficiency and fairness.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-medium">AI Allocation Active</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statsCards.map((card, idx) => (
                    <Card key={idx} className="shadow-sm hover:shadow-md transition-all duration-200 border-0">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`${card.bg} rounded-xl p-2.5`}>
                                    <div className={card.color}>{card.icon}</div>
                                </div>
                                <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{card.value}</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{card.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* AI Fairness Card */}
            <Card className="shadow-sm border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 mb-6">
                <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md flex-shrink-0">
                            <Target className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                <h3 className="font-semibold">AI Fairness Assessment</h3>
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                    <span className="text-xs font-medium">Score: {fairnessScore}%</span>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                                Your workload is {stats.total_duties > 3 ? 'slightly above' : 'well within'} the departmental average.
                                {stats.total_duties > 5 ? ' Consider requesting a swap if needed.' : ' Keep up the great work!'}
                            </p>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${fairnessScore}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm border-0">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base">Performance Overview</CardTitle>
                                <CardDescription className="ml-auto text-xs">Last 30 days</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <TeacherOverview />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base">Your Assigned Duties</CardTitle>
                                <CardDescription className="text-xs">All exam duties assigned to you</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <TeacherDuties />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base">Leave & Availability</CardTitle>
                                <CardDescription className="text-xs">Manage your unavailable dates</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <TeacherAvailability />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <TeacherChatAssistant />
                </div>
            </div>
        </DashboardLayout>
    );
}

export function TeacherDutiesPage() {
    return (
        <DashboardLayout navItems={navItems} title="My Duties">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="shadow-sm border-0">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-base">My Duties</CardTitle>
                            <CardDescription className="text-xs">All exam duties assigned to you</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <TeacherDuties />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <TeacherChatAssistant />
                </div>
            </div>
        </DashboardLayout>
    );
}

export function TeacherAvailabilityPage() {
    return (
        <DashboardLayout navItems={navItems} title="Availability & Leave">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="shadow-sm border-0">
                        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-base">Manage Leave Dates</CardTitle>
                            <CardDescription className="text-xs">Add or remove dates when you're unavailable</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <TeacherAvailability />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <TeacherChatAssistant />
                </div>
            </div>
        </DashboardLayout>
    );
}