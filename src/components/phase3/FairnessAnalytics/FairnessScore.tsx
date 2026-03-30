import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    ComposedChart,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Users, Activity } from 'lucide-react';
import type { FairnessAnalytics as FairnessAnalyticsType } from '@/types/phase3-types';

interface FairnessAnalyticsBoardProps {
    metrics: FairnessAnalyticsType;
    allocation: any;
}

export const FairnessAnalyticsBoard: React.FC<FairnessAnalyticsBoardProps> = ({
    metrics,
    allocation
}) => {
    // Transform data for charts
    const workloadDistribution = useMemo(() => {
        return metrics.workload_stats?.distribution || [
            { range: '0-2', count: 2 },
            { range: '2-4', count: 5 },
            { range: '4-6', count: 8 },
            { range: '6-8', count: 4 },
            { range: '8+', count: 1 }
        ];
    }, [metrics]);

    const departmentData = useMemo(() => {
        if (!metrics.department_stats) return [];
        return Object.entries(metrics.department_stats).map(([key, value]: any) => ({
            name: value.department_name || key,
            fairness: Math.round(value.fairness_score || 0),
            teachers: value.total_teachers || 0,
            avgDuties: (value.avg_duties_per_teacher || 0).toFixed(1),
            risk:
                value.overload_risk === 'high' ? 3 : value.overload_risk === 'medium' ? 2 : 1
        }));
    }, [metrics]);

    const fairnessGaugeData = [
        {
            name: 'Fairness',
            value: metrics.fairness_score || 0,
            fill:
                (metrics.fairness_score || 0) >= 75
                    ? '#10b981'
                    : (metrics.fairness_score || 0) >= 60
                        ? '#f59e0b'
                        : '#ef4444'
        }
    ];

    const getScoreColor = (score: number): string => {
        if (score >= 75) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadgeColor = (score: number) => {
        if (score >= 75) return 'bg-green-100 text-green-800 border-0';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-0';
        return 'bg-red-100 text-red-800 border-0';
    };

    return (
        <div className="space-y-4">
            {/* Alerts */}
            {metrics.overloaded_teachers && metrics.overloaded_teachers.length > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                        {metrics.overloaded_teachers.length} teacher(s) are overloaded (duties &gt;
                        mean + 1.5σ). Consider using the Swap Recommendations feature.
                    </AlertDescription>
                </Alert>
            )}

            {metrics.fairness_assessment === 'Poor' && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        Fairness score is low. Run swaps or re-simulate with different parameters.
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Score Card */}
            <Card className="border-l-4 border-blue-500">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Overall Fairness Assessment</CardTitle>
                            <CardDescription>Current allocation fairness metrics</CardDescription>
                        </div>
                        <Badge className={getScoreBadgeColor(metrics.fairness_score || 0)}>
                            {metrics.fairness_assessment || 'Unknown'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className={`text-5xl font-bold ${getScoreColor(metrics.fairness_score || 0)}`}>
                                {metrics.fairness_score || 0}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">Fairness Score (0-100)</p>
                        </div>

                        <div className="flex items-center justify-center">
                            {metrics.fairness_score && metrics.fairness_score >= 75 ? (
                                <div className="text-center">
                                    <Activity className="h-8 w-8 text-green-600 mx-auto" />
                                    <p className="text-xs text-gray-600 mt-2">Good Distribution</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <TrendingDown className="h-8 w-8 text-red-600 mx-auto" />
                                    <p className="text-xs text-gray-600 mt-2">Needs Improvement</p>
                                </div>
                            )}
                        </div>

                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie
                                    data={fairnessGaugeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={60}
                                    paddingAngle={2}
                                    dataKey="value"
                                    endAngle={0}
                                    startAngle={180}
                                >
                                    {fairnessGaugeData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Workload Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Workload Distribution</CardTitle>
                    <CardDescription>Number of teachers by duty count</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={workloadDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#3b82f6" name="Number of Teachers" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Statistics */}
                    <div className="grid grid-cols-5 gap-2 mt-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-600">Mean</p>
                            <p className="text-lg font-bold">
                                {metrics.workload_stats?.mean.toFixed(1) || 'N/A'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600">Std Dev</p>
                            <p className="text-lg font-bold">
                                {metrics.workload_stats?.std_dev.toFixed(2) || 'N/A'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600">Variance</p>
                            <p className="text-lg font-bold">
                                {metrics.workload_stats?.variance.toFixed(2) || 'N/A'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600">Min</p>
                            <p className="text-lg font-bold">{metrics.workload_stats?.min || 'N/A'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-600">Max</p>
                            <p className="text-lg font-bold">{metrics.workload_stats?.max || 'N/A'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Department Comparison */}
            {departmentData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Department Fairness Comparison</CardTitle>
                        <CardDescription>Fairness scores by department</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={departmentData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis yAxisId="left" label={{ value: 'Fairness Score', angle: -90, position: 'insideLeft' }} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg Duties', angle: 90, position: 'insideRight' }} />
                                <Tooltip />
                                <Legend />
                                <Bar yAxisId="left" dataKey="fairness" fill="#10b981" name="Fairness Score" radius={[8, 8, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="avgDuties" stroke="#ef4444" name="Avg Duties" strokeWidth={2} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Overloaded Teachers */}
            {metrics.overloaded_teachers && metrics.overloaded_teachers.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-red-900">
                            <Users className="inline mr-2 h-5 w-5" />
                            Overloaded Teachers ({metrics.overloaded_teachers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {metrics.overloaded_teachers.map((teacher, idx) => (
                                <div key={idx} className="flex justify-between text-sm p-2 bg-white rounded border border-red-100">
                                    <div>
                                        <p className="font-semibold text-gray-900">{teacher.name}</p>
                                        <p className="text-xs text-gray-600">{teacher.subjects?.join(', ') || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">{teacher.duties_assigned} duties</p>
                                        <p className="text-xs text-gray-600">
                                            +{(teacher.excess_or_deficit || 0).toFixed(1)} above avg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Underloaded Teachers */}
            {metrics.underloaded_teachers && metrics.underloaded_teachers.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-blue-900">
                            <Users className="inline mr-2 h-5 w-5" />
                            Underloaded Teachers ({metrics.underloaded_teachers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {metrics.underloaded_teachers.map((teacher, idx) => (
                                <div key={idx} className="flex justify-between text-sm p-2 bg-white rounded border border-blue-100">
                                    <div>
                                        <p className="font-semibold text-gray-900">{teacher.name}</p>
                                        <p className="text-xs text-gray-600">{teacher.subjects?.join(', ') || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-blue-600">{teacher.duties_assigned} duties</p>
                                        <p className="text-xs text-gray-600">
                                            {(teacher.excess_or_deficit || 0).toFixed(1)} below avg
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Patterns Detected */}
            {metrics.patterns && metrics.patterns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Patterns Detected</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {metrics.patterns.map((pattern, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 text-sm">{pattern.pattern}</p>
                                            <p className="text-xs text-gray-600 mt-1">{pattern.recommendation}</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`ml-2 ${pattern.impact === 'high'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : pattern.impact === 'medium'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                }`}
                                        >
                                            {pattern.impact}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FairnessAnalyticsBoard;
