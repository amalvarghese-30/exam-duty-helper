import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, TrendingUp, Users, Clock, BarChart3, Zap } from 'lucide-react';

interface TeacherWorkload {
    teacher_id: string;
    name: string;
    department: string;
    total_duties: number;
    department_avg: number;
    fairness_score: number;
    status: 'overloaded' | 'balanced' | 'underloaded';
    pending_approvals: number;
    swap_eligible: boolean;
    upcoming_duties: Array<{
        exam_id: string;
        subject: string;
        date: string;
        role: string;
    }>;
}

interface TeacherWorkloadDashboardProps {
    institution: any;
    user?: any;
}

export const TeacherWorkloadDashboard: React.FC<TeacherWorkloadDashboardProps> = ({
    institution,
    user
}) => {
    const [loading, setLoading] = useState(true);
    const [workloads, setWorkloads] = useState<TeacherWorkload[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filterDept, setFilterDept] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'duties' | 'fairness'>('duties');

    useEffect(() => {
        loadTeacherWorkloads();
    }, [institution]);

    const loadTeacherWorkloads = async () => {
        try {
            setLoading(true);
            setError(null);

            // In production, fetch from /api/allocations/teacher/:institution_id/:teacher_id
            // For demo, use mock data
            const mockWorkloads: TeacherWorkload[] = [
                {
                    teacher_id: 't1',
                    name: 'Dr. Rajesh Kumar',
                    department: 'Computer Science',
                    total_duties: 8,
                    department_avg: 6.5,
                    fairness_score: 85,
                    status: 'balanced',
                    pending_approvals: 0,
                    swap_eligible: false,
                    upcoming_duties: [
                        {
                            exam_id: 'e1',
                            subject: 'Data Structures',
                            date: '2026-04-10',
                            role: 'Invigilator'
                        },
                        {
                            exam_id: 'e2',
                            subject: 'Algorithms',
                            date: '2026-04-12',
                            role: 'Supervisor'
                        }
                    ]
                },
                {
                    teacher_id: 't2',
                    name: 'Dr. Priya Sharma',
                    department: 'Computer Science',
                    total_duties: 4,
                    department_avg: 6.5,
                    fairness_score: 72,
                    status: 'underloaded',
                    pending_approvals: 1,
                    swap_eligible: true,
                    upcoming_duties: [
                        {
                            exam_id: 'e3',
                            subject: 'Web Development',
                            date: '2026-04-15',
                            role: 'Invigilator'
                        }
                    ]
                },
                {
                    teacher_id: 't3',
                    name: 'Dr. Vikram Singh',
                    department: 'Mathematics',
                    total_duties: 11,
                    department_avg: 5.5,
                    fairness_score: 45,
                    status: 'overloaded',
                    pending_approvals: 2,
                    swap_eligible: true,
                    upcoming_duties: [
                        {
                            exam_id: 'e4',
                            subject: 'Calculus',
                            date: '2026-04-08',
                            role: 'Supervisor'
                        },
                        {
                            exam_id: 'e5',
                            subject: 'Linear Algebra',
                            date: '2026-04-14',
                            role: 'Invigilator'
                        },
                        {
                            exam_id: 'e6',
                            subject: 'Probability',
                            date: '2026-04-18',
                            role: 'Invigilator'
                        }
                    ]
                }
            ];

            setWorkloads(mockWorkloads);
        } catch (error) {
            console.error('Error loading workloads:', error);
            setError(error instanceof Error ? error.message : 'Failed to load workloads');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'overloaded':
                return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100' };
            case 'balanced':
                return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100' };
            case 'underloaded':
                return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' };
            default:
                return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100' };
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'overloaded':
                return '⚠️ Overloaded';
            case 'balanced':
                return '✅ Balanced';
            case 'underloaded':
                return '📭 Available Capacity';
            default:
                return status;
        }
    };

    const getFairnessColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    const filteredWorkloads = workloads
        .filter((w) => filterDept === 'all' || w.department === filterDept)
        .sort((a, b) => {
            if (sortBy === 'duties') {
                return b.total_duties - a.total_duties;
            } else {
                return a.fairness_score - b.fairness_score;
            }
        });

    const departments = ['all', ...new Set(workloads.map((w) => w.department))];

    if (loading) {
        return (
            <Card>
                <CardContent className="p-12 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Teacher Workload Distribution
                    </CardTitle>
                    <CardDescription>
                        Individual duty load, fairness metrics, and pending approvals
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {/* Filters & Controls */}
            <Card>
                <CardContent className="pt-6 flex gap-4 flex-wrap">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
                        <select
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                            className="p-2 border rounded text-sm"
                        >
                            {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept === 'all' ? 'All Departments' : dept}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'duties' | 'fairness')}
                            className="p-2 border rounded text-sm"
                        >
                            <option value="duties">Most Duties</option>
                            <option value="fairness">Lowest Fairness</option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2 text-xs text-gray-600">
                        <span>Showing {filteredWorkloads.length} teachers</span>
                    </div>
                </CardContent>
            </Card>

            {/* Teacher Cards */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredWorkloads.map((teacher) => {
                    const status = getStatusColor(teacher.status);
                    const deviation = ((teacher.total_duties - teacher.department_avg) / teacher.department_avg * 100).toFixed(1);

                    return (
                        <Card key={teacher.teacher_id} className={`border-2 ${status.border} ${status.bg}`}>
                            <CardContent className="pt-6">
                                {/* Header Row */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{teacher.name}</h4>
                                        <p className="text-xs text-gray-600">{teacher.department}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge className={status.badge}>
                                            {getStatusLabel(teacher.status)}
                                        </Badge>
                                        <Badge className={`${getFairnessColor(teacher.fairness_score)}`}>
                                            {teacher.fairness_score}% Fair
                                        </Badge>
                                    </div>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    {/* Total Duties */}
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Your Duties</p>
                                        <p className="text-2xl font-bold text-gray-900">{teacher.total_duties}</p>
                                    </div>

                                    {/* Department Average */}
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Dept Avg</p>
                                        <p className="text-2xl font-bold text-gray-700">
                                            {teacher.department_avg.toFixed(1)}
                                        </p>
                                    </div>

                                    {/* Deviation */}
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Deviation</p>
                                        <p className={`text-2xl font-bold ${parseFloat(deviation) > 0 ? 'text-orange-600' : 'text-blue-600'
                                            }`}>
                                            {deviation}%
                                        </p>
                                    </div>

                                    {/* Pending Approvals */}
                                    <div className="text-center">
                                        <p className="text-xs text-gray-600 mb-1">Pending</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {teacher.pending_approvals}
                                        </p>
                                    </div>
                                </div>

                                {/* Upcoming Duties */}
                                {teacher.upcoming_duties.length > 0 && (
                                    <div className="mb-4 p-3 bg-white rounded border">
                                        <p className="text-xs font-medium text-gray-700 mb-2">📅 Upcoming Duties</p>
                                        <div className="space-y-1 max-h-24 overflow-y-auto">
                                            {teacher.upcoming_duties.slice(0, 2).map((duty, idx) => (
                                                <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                                    <span className="text-gray-400">•</span>
                                                    <span className="font-medium">{duty.subject}</span>
                                                    <span className="text-gray-500">({duty.role})</span>
                                                    <span className="text-gray-400 ml-auto">
                                                        {new Date(duty.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                            ))}
                                            {teacher.upcoming_duties.length > 2 && (
                                                <div className="text-xs text-gray-500 italic">
                                                    +{teacher.upcoming_duties.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Indicators */}
                                <div className="flex gap-2">
                                    {teacher.swap_eligible && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
                                            <Zap className="h-3 w-3" />
                                            Swap Eligible
                                        </Badge>
                                    )}
                                    {teacher.pending_approvals > 0 && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                            {teacher.pending_approvals} Awaiting Approval
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={loadTeacherWorkloads}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                    ↻ Refresh Workloads
                </button>
            </div>
        </div>
    );
};
