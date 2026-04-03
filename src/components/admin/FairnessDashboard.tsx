// src/components/admin/FairnessDashboard.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface FairnessMetrics {
    avgDuties: number;
    stdDev: number;
    score: number;
    distribution: Array<{ teacher: string; count: number }>;
    minDuties: number;
    maxDuties: number;
    fairnessRating: string;
    recommendations: string[];
}

export default function FairnessDashboard() {
    const [data, setData] = useState<FairnessMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFairnessMetrics();
    }, []);

    const fetchFairnessMetrics = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/fairness/metrics");
            setData(response.data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to load fairness metrics");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!data) return null;

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600";
        if (score >= 70) return "text-yellow-600";
        return "text-red-600";
    };

    const getScoreIcon = (score: number) => {
        if (score >= 90) return <TrendingUp className="h-5 w-5 text-green-600" />;
        if (score >= 70) return <TrendingUp className="h-5 w-5 text-yellow-600" />;
        return <TrendingDown className="h-5 w-5 text-red-600" />;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold">Fairness Analytics</h2>
                    <p className="text-muted-foreground mt-1">
                        Monitor and evaluate duty allocation fairness
                    </p>
                </div>
                <button
                    onClick={fetchFairnessMetrics}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Average Duties
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.avgDuties.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            per teacher
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Load Deviation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stdDev.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            standard deviation
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Min / Max Duties
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.minDuties} / {data.maxDuties}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            range of duties
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Fairness Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                                {data.score.toFixed(1)}
                            </div>
                            {getScoreIcon(data.score)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.fairnessRating}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Teacher Load Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Teacher Load Distribution</CardTitle>
                    <CardDescription>
                        Current duty counts per teacher
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.distribution.map((teacher) => (
                            <div key={teacher.teacher} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>{teacher.teacher}</span>
                                    <span className="font-medium">{teacher.count} duties</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-primary rounded-full h-2 transition-all"
                                        style={{
                                            width: `${(teacher.count / data.maxDuties) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* AI Recommendations */}
            {data.recommendations && data.recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Recommendations</CardTitle>
                        <CardDescription>
                            Suggestions to improve fairness
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {data.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                                    <span className="text-sm">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}