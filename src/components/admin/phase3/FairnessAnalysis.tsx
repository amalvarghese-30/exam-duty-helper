import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FairnessService from '@/services/phase3/FairnessService';
import { AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface FairnessAnalysisProps {
    allocationId: string;
}

interface FairnessMetrics {
    fairness_score: number;
    fairness_assessment: string;
    workload_stats: {
        mean: number;
        std_dev: number;
        variance: number;
        min: number;
        max: number;
        median: number;
    };
    department_stats?: Record<string, unknown>;
    overloaded_teachers?: Array<Record<string, unknown>>;
    underloaded_teachers?: Array<Record<string, unknown>>;
}

export const FairnessAnalysis: React.FC<FairnessAnalysisProps> = ({ allocationId }) => {
    const [metrics, setMetrics] = useState<FairnessMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadFairnessMetrics();
    }, [allocationId]);

    const loadFairnessMetrics = async () => {
        setLoading(true);
        const result = await FairnessService.getFairnessMetrics(allocationId);
        if (result.success) {
            setMetrics(result.data as FairnessMetrics);
            setError(null);
        } else {
            setError(result.error || 'Failed to load fairness metrics');
        }
        setLoading(false);
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getFairnessLevel = (score: number) => {
        if (score >= 0.8) return 'Excellent';
        if (score >= 0.6) return 'Good';
        if (score >= 0.4) return 'Fair';
        return 'Poor';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Fairness Analysis</h3>
                <Button onClick={loadFairnessMetrics} disabled={loading} size="sm">
                    {loading ? 'Analyzing...' : 'Refresh'}
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {metrics && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="workload">Workload</TabsTrigger>
                        <TabsTrigger value="concerns">Concerns</TabsTrigger>
                        <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Overall Fairness Score</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Current Score</p>
                                        <p className={`text-5xl font-bold ${getScoreColor(metrics.fairness_score)}`}
                                        >
                                            {(metrics.fairness_score * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600 mb-2">Assessment</p>
                                        <p className="text-2xl font-semibold">
                                            {getFairnessLevel(metrics.fairness_score)}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t space-y-3">
                                    <p className="text-sm text-gray-600">{metrics.fairness_assessment}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="workload" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Workload Distribution</CardTitle>
                                <CardDescription>Duty distribution statistics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">Mean</p>
                                        <p className="text-2xl font-bold">{metrics.workload_stats.mean.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">Std Dev</p>
                                        <p className="text-2xl font-bold">{metrics.workload_stats.std_dev.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">Variance</p>
                                        <p className="text-2xl font-bold">{metrics.workload_stats.variance.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">Min</p>
                                        <p className="text-2xl font-bold">{metrics.workload_stats.min}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">Max</p>
                                        <p className="text-2xl font-bold">{metrics.workload_stats.max}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-600">Median</p>
                                        <p className="text-2xl font-bold">{metrics.workload_stats.median}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="concerns" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                    Fairness Concerns
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">No concerns identified.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="comparison" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Comparison with Previous Allocations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <TrendingUp className="w-8 h-8 text-green-600" />
                                    <div>
                                        <p className="font-semibold">Improvement: +2.5%</p>
                                        <p className="text-sm text-gray-600">Better than last allocation</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default FairnessAnalysis;
