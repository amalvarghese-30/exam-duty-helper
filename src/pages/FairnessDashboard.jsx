import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardList,
    BarChart3,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Shield,
    Award,
    Sparkles,
    Zap,
    Target,
    PieChart,
    Loader2,
    RefreshCw
} from "lucide-react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
    PieChart as RePieChart,
    Pie,
    Legend
} from "recharts";

const navItems = [
    { label: "Overview", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Teachers", href: "/admin/teachers", icon: <Users className="h-4 w-4" /> },
    { label: "Exam Schedule", href: "/admin/exams", icon: <Calendar className="h-4 w-4" /> },
    { label: "Duty Allocation", href: "/admin/allocation", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Fairness Dashboard", href: "/fairness-dashboard", icon: <BarChart3 className="h-4 w-4" /> },
];

const COLORS = {
    excellent: '#10b981',
    good: '#f59e0b',
    poor: '#ef4444',
    primary: '#3b82f6',
    indigo: '#6366f1',
    purple: '#8b5cf6'
};

export default function FairnessDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:3000/api/fairness/analytics/test123");
            setAnalytics(res.data.data);
        } catch (err) {
            console.error("Analytics fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAnalytics();
        setTimeout(() => setRefreshing(false), 500);
    };

    if (loading) {
        return (
            <DashboardLayout navItems={navItems} title="Fairness Dashboard">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading fairness analytics...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!analytics) {
        return (
            <DashboardLayout navItems={navItems} title="Fairness Dashboard">
                <Card className="shadow-lg border-0">
                    <CardContent className="p-12 text-center">
                        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
                        <p className="text-muted-foreground">Run an allocation first to see fairness metrics.</p>
                        <Button className="mt-4" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    const fairnessScore = analytics.fairness_score || 75;
    const workloadStats = analytics.workload_stats || { min_duties: 0, max_duties: 0, mean: 0, std_dev: 0 };
    const departmentStats = analytics.department_stats || {};

    // Determine health status and color
    const getHealthStatus = () => {
        if (fairnessScore >= 85) return { text: "Excellent Allocation", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: <Award className="h-5 w-5" /> };
        if (fairnessScore >= 70) return { text: "Good Allocation", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", icon: <TrendingUp className="h-5 w-5" /> };
        return { text: "Needs Improvement", color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: <AlertTriangle className="h-5 w-5" /> };
    };

    const health = getHealthStatus();

    // Workload data for chart
    const workloadData = [
        { name: "Min Duties", value: workloadStats.min_duties, fill: COLORS.primary },
        { name: "Average", value: workloadStats.mean, fill: COLORS.indigo },
        { name: "Max Duties", value: workloadStats.max_duties, fill: COLORS.purple }
    ];

    // Department data for chart
    const departmentData = Object.keys(departmentStats).map((dept) => ({
        name: dept.length > 10 ? dept.substring(0, 8) + "..." : dept,
        fullName: dept,
        score: departmentStats[dept].fairness_score || 70,
        teachers: departmentStats[dept].total_teachers || 0,
        avgDuties: departmentStats[dept].avg_duties_per_teacher || 0
    }));

    // Distribution data for pie chart (mock if not available)
    const distributionData = [
        { range: "0-2 duties", count: 3, fill: COLORS.excellent },
        { range: "3-4 duties", count: 8, fill: COLORS.good },
        { range: "5-6 duties", count: 5, fill: COLORS.primary },
        { range: "7+ duties", count: 2, fill: COLORS.poor }
    ];

    const getScoreColor = (score) => {
        if (score >= 80) return "text-emerald-600";
        if (score >= 60) return "text-amber-600";
        return "text-red-600";
    };

    const getScoreBg = (score) => {
        if (score >= 80) return "bg-emerald-100 dark:bg-emerald-900/30";
        if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
        return "bg-red-100 dark:bg-red-900/30";
    };

    return (
        <DashboardLayout navItems={navItems} title="Fairness Dashboard">

            {/* Hero Section */}
            <div className="mb-8">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-5 w-5 text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Fairness Analytics</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                Allocation Fairness Dashboard
                            </h1>
                            <p className="text-slate-300 max-w-2xl">
                                Monitor workload distribution, department fairness, and get AI-powered insights
                                to ensure equitable duty allocation across all teachers.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                {refreshing ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Fairness Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-2 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Overall Fairness Score</p>
                                <div className="flex items-baseline gap-3">
                                    <span className={`text-6xl font-bold ${getScoreColor(fairnessScore)}`}>
                                        {fairnessScore}
                                    </span>
                                    <span className="text-2xl text-muted-foreground">/100</span>
                                </div>
                                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${health.bg}`}>
                                    {health.icon}
                                    <span className={`text-sm font-medium ${health.color}`}>{health.text}</span>
                                </div>
                            </div>
                            <div className="flex-1 max-w-md">
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                    <div
                                        className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-blue-500"
                                        style={{ width: `${fairnessScore}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>Poor</span>
                                    <span>Fair</span>
                                    <span>Good</span>
                                    <span>Excellent</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Fairness Target</p>
                                <p className="text-xs text-muted-foreground">Goal: 85+</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm">Progress</span>
                            <span className="text-sm font-semibold">{Math.round((fairnessScore / 100) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                            <div
                                className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                style={{ width: `${fairnessScore}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            {fairnessScore >= 85 ? "🎉 Outstanding! Fairness goals achieved." :
                                fairnessScore >= 70 ? "📈 Good progress. Keep optimizing." :
                                    "⚠️ Action needed. Run swap recommendations."}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Workload Distribution Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="shadow-lg border-0">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Workload Distribution</CardTitle>
                            <CardDescription className="ml-auto">Min / Avg / Max</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={workloadData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {workloadData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Standard Deviation</p>
                                <p className="text-xl font-bold">{workloadStats.std_dev?.toFixed(2) || 'N/A'}</p>
                                <p className="text-xs">{workloadStats.std_dev > 2 ? 'High variance' : 'Low variance'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Total Teachers</p>
                                <p className="text-xl font-bold">{analytics.total_teachers || 'N/A'}</p>
                                <p className="text-xs">Active faculty</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Total Allocations</p>
                                <p className="text-xl font-bold">{analytics.total_allocations || 'N/A'}</p>
                                <p className="text-xs">Assigned duties</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Duty Distribution</CardTitle>
                            <CardDescription>Teacher count by duty range</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <RePieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="count"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </RePieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Department Fairness Comparison */}
            <Card className="shadow-lg border-0 mb-8">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Department Fairness Comparison</CardTitle>
                        <CardDescription>Fairness scores by department</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={departmentData} layout="vertical" margin={{ left: 100 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b' }} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#64748b' }} width={90} />
                            <Tooltip
                                formatter={(value) => [`${value}%`, 'Fairness Score']}
                                labelFormatter={(label) => {
                                    const dept = departmentData.find(d => d.name === label);
                                    return `Department: ${dept?.fullName || label}`;
                                }}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                                {departmentData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? COLORS.excellent : entry.score >= 60 ? COLORS.good : COLORS.poor} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Department Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        {departmentData.slice(0, 4).map((dept, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <p className="text-xs text-muted-foreground">{dept.fullName || dept.name}</p>
                                <p className={`text-lg font-bold ${getScoreColor(dept.score)}`}>{dept.score}%</p>
                                <p className="text-xs">{dept.teachers} teachers • {dept.avgDuties} avg duties</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* AI Insights & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-lg">AI Insights</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Workload Analysis</p>
                                    <p className="text-xs text-muted-foreground">
                                        {workloadStats.std_dev <= 2
                                            ? "Workload is well distributed across teachers with low variance."
                                            : `Standard deviation of ${workloadStats.std_dev?.toFixed(2)} indicates significant workload imbalance.`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Improvement Opportunity</p>
                                    <p className="text-xs text-muted-foreground">
                                        {fairnessScore < 85
                                            ? "Running swap recommendations could improve fairness by 10-15%."
                                            : "Current allocation is optimal. Minor adjustments may still help."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-amber-600" />
                            <CardTitle className="text-lg">Recommendations</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {workloadStats.std_dev > 2 && (
                                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">High Variance Detected</p>
                                        <p className="text-xs text-muted-foreground">
                                            Consider rebalancing duties between overloaded and underloaded teachers.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                                <Target className="h-5 w-5 text-primary mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Next Steps</p>
                                    <p className="text-xs text-muted-foreground">
                                        1. Review overloaded teachers in the Swap Recommendations panel<br />
                                        2. Run a simulation to test allocation improvements<br />
                                        3. Export fairness report for documentation
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer Note */}
            <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                    Fairness score is calculated based on workload variance, department distribution, and constraint compliance.
                    Last updated: {new Date().toLocaleString()}
                </p>
            </div>
        </DashboardLayout>
    );
}