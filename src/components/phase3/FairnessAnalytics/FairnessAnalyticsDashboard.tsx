import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, TrendingUp, Users, BarChart3 } from 'lucide-react';

interface FairnessStats {
    fairness_score: number;
    workload_variance: number;
    mean_workload: number;
    std_dev: number;
    overloaded_teachers: Array<{ teacher_id: string; name: string; duties: number }>;
    underloaded_teachers: Array<{ teacher_id: string; name: string; duties: number }>;
    department_distribution: Record<string, { avg_duties: number; min: number; max: number }>;
    daily_distribution: Record<string, number>;
}

interface FairnessAnalyticsDashboardProps {
    currentAllocation: any;
    institution: any;
}

export const FairnessAnalyticsDashboard: React.FC<FairnessAnalyticsDashboardProps> = ({
    currentAllocation,
    institution
}) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<FairnessStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFairnessStats();
    }, [currentAllocation]);

    const loadFairnessStats = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/allocations/stats/${institution._id || institution.id}`
            );

            if (!response.ok) {
                throw new Error('Failed to load fairness statistics');
            }

            const data = await response.json();
            setStats(data.data);
        } catch (error) {
            console.error('Error loading fairness stats:', error);
            setError(error instanceof Error ? error.message : 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const getFairnessColor = (score: number) => {
        if (score >= 80) return '#10b981'; // green
        if (score >= 60) return '#f59e0b'; // amber
        return '#ef4444'; // red
    };

    const getFairnessLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Poor';
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-12 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
        );
    }

    if (!stats) {
        return <div className="text-center py-12 text-gray-500">No allocation data available</div>;
    }

    return (
        <div className="space-y-4">
            {/* Header with Fairness Score */}
            <Card>
                <CardHeader>
                    <CardTitle>Fairness Analytics</CardTitle>
                    <CardDescription>
                        Workload distribution and teaching resource balance
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Main Fairness Score */}
                        <div className="rounded-lg p-6 text-center" style={{ backgroundColor: `${getFairnessColor(stats.fairness_score)}20` }}>
                            <div className="text-sm font-medium text-gray-600 mb-2">Fairness Score</div>
                            <div className="text-4xl font-bold mb-2" style={{ color: getFairnessColor(stats.fairness_score) }}>
                                {stats.fairness_score.toFixed(1)}%
                            </div>
                            <div className="text-xs font-medium text-gray-500">
                                {getFairnessLabel(stats.fairness_score)}
                            </div>
                        </div>

                        {/* Workload Variance */}
                        <div className="rounded-lg bg-blue-50 p-6 text-center">
                            <div className="text-sm font-medium text-gray-600 mb-2">Variance</div>
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                {stats.workload_variance.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Lower is better</div>
                        </div>

                        {/* Mean Workload */}
                        <div className="rounded-lg bg-green-50 p-6 text-center">
                            <div className="text-sm font-medium text-gray-600 mb-2">Avg Duties/Teacher</div>
                            <div className="text-3xl font-bold text-green-600 mb-2">
                                {stats.mean_workload.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">Across all teachers</div>
                        </div>

                        {/* Std Dev */}
                        <div className="rounded-lg bg-purple-50 p-6 text-center">
                            <div className="text-sm font-medium text-gray-600 mb-2">Std Dev</div>
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                                {stats.std_dev.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">Distribution spread</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Overloaded Teachers Alert */}
            {stats.overloaded_teachers.length > 0 && (
                <Card className="border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                            <AlertTriangle className="h-5 w-5" />
                            Overloaded Teachers ({stats.overloaded_teachers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                            {stats.overloaded_teachers.map((teacher, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded border border-orange-100">
                                    <div>
                                        <p className="font-medium text-orange-900">{teacher.name}</p>
                                        <p className="text-xs text-orange-700">{teacher.teacher_id}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                        {teacher.duties} duties
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Underloaded Teachers Info */}
            {stats.underloaded_teachers.length > 0 && (
                <Card className="border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                            <Users className="h-5 w-5" />
                            Available Capacity ({stats.underloaded_teachers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-56 overflow-y-auto">
                            {stats.underloaded_teachers.map((teacher, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100">
                                    <div>
                                        <p className="font-medium text-blue-900">{teacher.name}</p>
                                        <p className="text-xs text-blue-700">{teacher.teacher_id}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                        {teacher.duties} duties
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Department Distribution */}
            {Object.keys(stats.department_distribution).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Department Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(stats.department_distribution).map(([dept, data]) => (
                                <div key={dept}>
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-medium text-gray-700">{dept}</p>
                                        <span className="text-sm text-gray-600">
                                            Avg: {data.avg_duties.toFixed(1)} | Range: {data.min}-{data.max}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${Math.min((data.avg_duties / stats.mean_workload) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Daily Distribution */}
            {Object.keys(stats.daily_distribution).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Daily Duty Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-2">
                            {Object.entries(stats.daily_distribution)
                                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                                .map(([date, count]) => (
                                    <div key={date} className="text-center p-3 bg-gray-50 rounded border">
                                        <div className="text-xs font-medium text-gray-600 truncate">
                                            {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-lg font-bold text-gray-900 mt-1">{count}</div>
                                        <div className="text-xs text-gray-500">duties</div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={loadFairnessStats}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                    ↻ Refresh Statistics
                </button>
            </div>
        </div>
    );
};
