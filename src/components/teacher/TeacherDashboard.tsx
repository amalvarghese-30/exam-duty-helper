import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ClipboardList, CalendarDays, Bell, History, MessageSquare, HelpCircle, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await TeacherDashboardService.getTeacherStats();
                if (response.success && response.data) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statsCards = [
        {
            title: 'Total Duties',
            value: stats.total_duties,
            icon: <ClipboardList className="h-5 w-5" />,
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            title: 'Upcoming',
            value: stats.upcoming_duties,
            icon: <Clock className="h-5 w-5" />,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Accepted',
            value: stats.accepted_duties || 0,
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            title: 'Pending',
            value: stats.pending_approvals || 0,
            icon: <AlertCircle className="h-5 w-5" />,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
        },
    ];

    if (loading) {
        return (
            <DashboardLayout navItems={navItems} title="Teacher Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout navItems={navItems} title="Teacher Dashboard">
            {/* Welcome Section */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || 'Teacher'}!</h2>
                <p className="text-muted-foreground mt-1">Here's your exam duty overview and AI assistant</p>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statsCards.map((card, idx) => (
                    <Card key={idx} className="shadow-card hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{card.title}</p>
                                    <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
                                </div>
                                <div className={`${card.bg} rounded-full p-3`}>
                                    <div className={card.color}>{card.icon}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid - 2 Columns for Duties, 1 Column for Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Teacher Content (spans 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Overview Section */}
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Your Performance Overview
                            </CardTitle>
                            <CardDescription>
                                Summary of your duty allocations and upcoming responsibilities
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TeacherOverview />
                        </CardContent>
                    </Card>

                    {/* Duties Section */}
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-primary" />
                                Your Assigned Duties
                            </CardTitle>
                            <CardDescription>
                                All exam duties assigned to you
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TeacherDuties />
                        </CardContent>
                    </Card>

                    {/* Availability Section */}
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                Leave & Availability
                            </CardTitle>
                            <CardDescription>
                                Manage your unavailable dates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TeacherAvailability />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - AI Chat Assistant Sidebar */}
                <div className="lg:col-span-1">
                    <TeacherChatAssistant />
                </div>
            </div>
        </DashboardLayout>
    );
}

// Export individual page components for routing
export function TeacherDutiesPage() {
    return (
        <DashboardLayout navItems={navItems} title="My Duties">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle>My Duties</CardTitle>
                            <CardDescription>All exam duties assigned to you</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle>Manage Leave Dates</CardTitle>
                            <CardDescription>Add or remove dates when you're unavailable</CardDescription>
                        </CardHeader>
                        <CardContent>
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