import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    AlertCircle,
    Loader2,
    CheckCircle2,
    MessageSquare,
    TrendingUp,
    Users
} from 'lucide-react';
import type { AllocationExplanation } from '@/types/phase3-types';

interface TeacherExplanationPanelProps {
    allocation: any;
    teacherId: string;
    teacherName: string;
    onAppealSubmitted?: () => void;
}

interface ExplanationFactor {
    name: string;
    contribution: number;
    weight: number;
    description: string;
}

interface SimilarTeacher {
    name: string;
    department: string;
    duties: number;
    fairness_score: number;
    experience: string;
}

export const TeacherExplanationPanel: React.FC<TeacherExplanationPanelProps> = ({
    allocation,
    teacherId,
    teacherName,
    onAppealSubmitted
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [explanation, setExplanation] = useState<AllocationExplanation | null>(
        null
    );
    const [appealSubmitted, setAppealSubmitted] = useState(false);
    const [appealMessage, setAppealMessage] = useState('');

    // Load explanation on mount
    useEffect(() => {
        loadExplanation();
    }, [allocation._id, teacherId]);

    const loadExplanation = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/phase3/explanations/${allocation._id}/${teacherId}`
            );

            if (!response.ok) {
                throw new Error('Failed to load explanation');
            }

            const data = await response.json();

            if (data.success) {
                setExplanation(data.data);
            } else {
                setError(data.error || 'Failed to load explanation');
            }
        } catch (error) {
            console.error('Failed to load explanation:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load explanation'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAppeal = async () => {
        if (!appealMessage.trim()) {
            setError('Please enter an appeal message');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/phase3/appeals/submit`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        allocation_id: allocation._id,
                        teacher_id: teacherId,
                        message: appealMessage,
                        reason: 'Teacher allocation appeal'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to submit appeal');
            }

            const data = await response.json();

            if (data.success) {
                setAppealSubmitted(true);
                setAppealMessage('');
                setTimeout(() => setAppealSubmitted(false), 3000);
                onAppealSubmitted?.();
            } else {
                setError(data.error || 'Failed to submit appeal');
            }
        } catch (error) {
            console.error('Failed to submit appeal:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to submit appeal'
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading && !explanation) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    if (error && !explanation) {
        return (
            <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
        );
    }

    if (!explanation) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <p className="text-gray-600">No allocation data available</p>
                </CardContent>
            </Card>
        );
    }

    // Transform factors for chart
    const chartData = explanation.factors.map((f: ExplanationFactor) => ({
        name: f.name.substring(0, 15),
        contribution: f.contribution,
        full_name: f.name
    }));

    const totalDuties = explanation.assigned_duties?.length || 0;
    const totalExams = explanation.assigned_exams?.length || 0;
    const fairnessScore = explanation.fairness_score || 0;

    return (
        <div className="space-y-4">
            {/* Teacher Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">{teacherName}</CardTitle>
                    <CardDescription>
                        Allocation explanation for exam duties
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Status Alerts */}
            {error && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {appealSubmitted && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Appeal submitted successfully. The admin team will review your request.
                    </AlertDescription>
                </Alert>
            )}

            {/* Allocation Summary */}
            <div className="grid grid-cols-3 gap-2">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{totalDuties}</div>
                            <div className="text-xs text-gray-600">Total Duties</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{totalExams}</div>
                            <div className="text-xs text-gray-600">Exams Assigned</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-center">
                            <div
                                className={`text-2xl font-bold ${fairnessScore >= 70
                                        ? 'text-green-600'
                                        : fairnessScore >= 50
                                            ? 'text-yellow-600'
                                            : 'text-red-600'
                                    }`}
                            >
                                {fairnessScore.toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-600">Fairness Score</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Allocation Decision Factors */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Decision Factors
                    </CardTitle>
                    <CardDescription>
                        How your allocation was calculated
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Factor Chart */}
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip
                                    content={(props) => {
                                        const { active, payload } = props;
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white p-2 border rounded shadow text-xs">
                                                    <p className="font-semibold">{data.full_name}</p>
                                                    <p className="text-blue-600">
                                                        Contribution: {data.contribution}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="contribution" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Detailed Factor List */}
                    <div className="space-y-2">
                        {explanation.factors.map((factor: ExplanationFactor, idx: number) => (
                            <div
                                key={idx}
                                className="p-3 border rounded-lg bg-gray-50"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm">{factor.name}</span>
                                    <Badge variant="outline">
                                        {(factor.contribution * 100).toFixed(1)}%
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-600">{factor.description}</p>
                                <div className="mt-2 bg-white rounded h-1.5">
                                    <div
                                        className="bg-blue-500 h-full rounded"
                                        style={{ width: `${Math.min(factor.contribution * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Assigned Duties */}
            {explanation.assigned_duties && explanation.assigned_duties.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Your Assigned Duties</CardTitle>
                        <CardDescription>
                            Exams you are scheduled to invigilate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {explanation.assigned_duties.map((duty: any, idx: number) => (
                                <div key={idx} className="p-3 border rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{duty.exam_name}</div>
                                            <div className="text-xs text-gray-600">
                                                {duty.exam_code}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(duty.date).toLocaleDateString()} at{' '}
                                                {duty.start_time}
                                            </div>
                                        </div>
                                        <Badge variant="outline">{duty.duration}h</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Similar Teachers Comparison */}
            {explanation.similar_teachers && explanation.similar_teachers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Teachers in Similar Situations
                        </CardTitle>
                        <CardDescription>
                            How your allocation compares to peers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {explanation.similar_teachers.map(
                                (teacher: SimilarTeacher, idx: number) => (
                                    <div key={idx} className="p-3 border rounded-lg bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {teacher.name}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {teacher.department} · {teacher.experience}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold">
                                                    {teacher.duties}
                                                </div>
                                                <div className="text-xs text-gray-600">duties</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-gray-600">Fairness:</span>
                                            <div className="flex-1 bg-white rounded h-2">
                                                <div
                                                    className={`h-full rounded ${teacher.fairness_score >= 70
                                                            ? 'bg-green-500'
                                                            : teacher.fairness_score >= 50
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            teacher.fairness_score,
                                                            100
                                                        )}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold">
                                                {teacher.fairness_score.toFixed(0)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Appeal Section */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        Disagree with Your Allocation?
                    </CardTitle>
                    <CardDescription>
                        Submit an appeal for the admin team to review
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <textarea
                        value={appealMessage}
                        onChange={(e) => setAppealMessage(e.target.value)}
                        placeholder="Explain why you believe your allocation should be reconsidered..."
                        className="w-full p-2 border border-blue-200 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                        rows={3}
                    />
                    <Button
                        onClick={handleSubmitAppeal}
                        disabled={loading || !appealMessage.trim()}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Submit Appeal
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherExplanationPanel;
