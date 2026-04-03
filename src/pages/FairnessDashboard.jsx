import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardList,
    BarChart3
} from "lucide-react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from "recharts";

const navItems = [
    { label: "Overview", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Teachers", href: "/admin/teachers", icon: <Users className="h-4 w-4" /> },
    { label: "Exam Schedule", href: "/admin/exams", icon: <Calendar className="h-4 w-4" /> },
    { label: "Duty Allocation", href: "/admin/allocation", icon: <ClipboardList className="h-4 w-4" /> },
    { label: "Fairness Dashboard", href: "/fairness-dashboard", icon: <BarChart3 className="h-4 w-4" /> },
];

export default function FairnessDashboard() {

    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get(
                "http://localhost:3000/api/fairness/analytics/test123"
            );

            setAnalytics(res.data.data);

        } catch (err) {
            console.error("Analytics fetch failed:", err);
        }
    };

    if (!analytics)
        return (
            <DashboardLayout navItems={navItems} title="Fairness Dashboard">
                Loading analytics...
            </DashboardLayout>
        );

    const workloadData = [
        {
            name: "Min Duties",
            value: analytics.workload_stats.min_duties
        },
        {
            name: "Max Duties",
            value: analytics.workload_stats.max_duties
        },
        {
            name: "Average",
            value: analytics.workload_stats.mean
        }
    ];

    const departmentData = Object.keys(
        analytics.department_stats
    ).map((dept) => ({
        name: dept,
        score:
            analytics.department_stats[dept].fairness_score
    }));

    const fairnessScore = analytics.fairness_score;

    const getHealthStatus = () => {
        if (fairnessScore >= 85)
            return "🟢 Excellent Allocation";
        if (fairnessScore >= 70)
            return "🟡 Acceptable Allocation";
        return "🔴 Needs Improvement";
    };

    return (
        <DashboardLayout navItems={navItems} title="Fairness Dashboard">

            {/* FAIRNESS SCORE */}
            <div style={{ marginBottom: 30 }}>
                <h2>Overall Fairness Score</h2>
                <h1 style={{ fontSize: 40 }}>
                    {fairnessScore}
                </h1>
                <p>{getHealthStatus()}</p>
            </div>

            {/* WORKLOAD DISTRIBUTION */}
            <div style={{ marginBottom: 40 }}>
                <h3>Teacher Workload Distribution</h3>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={workloadData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* DEPARTMENT FAIRNESS */}
            <div>
                <h3>Department Fairness Comparison</h3>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="score" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* ALERT PANEL */}
            <div style={{ marginTop: 40 }}>
                <h3>Allocation Insights</h3>

                {analytics.workload_stats.std_dev > 2 ? (
                    <p>
                        ⚠️ High workload imbalance detected.
                        Consider running swap optimization.
                    </p>
                ) : (
                    <p>
                        ✅ Workload distribution is balanced.
                    </p>
                )}

            </div>

        </DashboardLayout>
    );
}