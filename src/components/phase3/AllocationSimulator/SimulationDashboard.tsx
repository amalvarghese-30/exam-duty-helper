import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, Check, AlertCircle, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';

interface SimulationResult {
    allocated_duties: Record<string, any>;
    statistics: {
        allocated_exams: number;
        total_exams: number;
        success_rate_percent: number;
    };
    comparison: {
        current_allocated: number;
        simulated_allocated: number;
        improvement: number;
        improvement_percent: number;
    };
    conflicts: Array<any>;
}

interface SimulationDashboardProps {
    currentAllocation: any;
    institution: any;
    onApply: (result: SimulationResult) => void;
}

export const SimulationDashboard: React.FC<SimulationDashboardProps> = ({
    currentAllocation,
    institution,
    onApply
}) => {
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState<SimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    const handleRunSimulation = async () => {
        try {
            setLoading(true);
            setError(null);
            setShowComparison(false);

            const response = await fetch('/api/allocations/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institution_id: institution._id || institution.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to run simulation');
            }

            const data = await response.json();
            setSimulation(data);
            setShowComparison(true);
        } catch (error) {
            console.error('Simulation error:', error);
            setError(error instanceof Error ? error.message : 'Failed to run simulation');
        } finally {
            setLoading(false);
        }
    };

    const getImprovementColor = (percent: number) => {
        if (percent > 10) return 'text-green-600';
        if (percent > 5) return 'text-emerald-600';
        if (percent > 0) return 'text-blue-600';
        return 'text-gray-600';
    };

    const getImprovementBg = (percent: number) => {
        if (percent > 10) return 'bg-green-50 border-green-200';
        if (percent > 5) return 'bg-emerald-50 border-emerald-200';
        if (percent > 0) return 'bg-blue-50 border-blue-200';
        return 'bg-gray-50 border-gray-200';
    };

    return (
        <div className="space-y-4">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Simulation Center</CardTitle>
                            <CardDescription>
                                Test allocation strategies without saving to database
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleRunSimulation}
                            disabled={loading}
                            size="lg"
                            className="gap-2"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            {loading ? 'Simulating...' : 'Run Simulation'}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {/* Simulation Results */}
            {showComparison && simulation && (
                <div className="space-y-4">
                    {/* Improvement Summary */}
                    <div className={`rounded-lg border-2 p-6 ${getImprovementBg(simulation.comparison.improvement_percent)}`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Fairness Improvement */}
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Fairness Improvement</p>
                                <div className={`flex items-center gap-2 ${getImprovementColor(simulation.comparison.improvement_percent)}`}>
                                    {simulation.comparison.improvement_percent > 0 ? (
                                        <TrendingUp className="h-5 w-5" />
                                    ) : (
                                        <ArrowDown className="h-5 w-5" />
                                    )}
                                    <span className="text-2xl font-bold">
                                        {simulation.comparison.improvement_percent > 0 ? '+' : ''}{simulation.comparison.improvement_percent.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Allocations Improvement */}
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Additional Allocations</p>
                                <div className="flex items-center gap-2 text-blue-600">
                                    <ArrowUp className="h-5 w-5" />
                                    <span className="text-2xl font-bold">+{simulation.comparison.improvement}</span>
                                </div>
                            </div>

                            {/* Success Rate */}
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                <div className="text-2xl font-bold text-green-600">
                                    {simulation.statistics.success_rate_percent.toFixed(1)}%
                                </div>
                            </div>

                            {/* Conflicts Resolved */}
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-600">Conflicts</p>
                                <div className="text-2xl font-bold text-orange-600">
                                    {simulation.conflicts.length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Allocation Comparison</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Current Allocation */}
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">Current Allocation</h4>
                                    <div className="text-3xl font-bold text-gray-800">
                                        {simulation.comparison.current_allocated}
                                    </div>
                                    <p className="text-sm text-gray-600">exams allocated</p>
                                </div>

                                {/* Simulated Allocation */}
                                <div className="rounded-lg bg-green-50 p-4 border-2 border-green-200">
                                    <h4 className="font-semibold text-green-700 mb-2">Simulated Allocation</h4>
                                    <div className="text-3xl font-bold text-green-800">
                                        {simulation.comparison.simulated_allocated}
                                    </div>
                                    <p className="text-sm text-green-600">exams allocated</p>
                                </div>
                            </div>

                            {/* Statistics Grid */}
                            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Allocated Exams</p>
                                    <p className="text-lg font-bold">{simulation.statistics.allocated_exams}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Total Exams</p>
                                    <p className="text-lg font-bold">{simulation.statistics.total_exams}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase">Unallocated</p>
                                    <p className="text-lg font-bold text-orange-600">
                                        {simulation.statistics.total_exams - simulation.statistics.allocated_exams}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conflicts Section */}
                    {simulation.conflicts.length > 0 && (
                        <Card className="border-orange-200">
                            <CardHeader>
                                <CardTitle className="text-lg text-orange-700">
                                    Remaining Conflicts ({simulation.conflicts.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {simulation.conflicts.slice(0, 5).map((conflict, idx) => (
                                        <div key={idx} className="text-sm text-gray-600 p-2 bg-orange-50 rounded border border-orange-100">
                                            <span className="font-medium">{conflict.exam_id}</span> - {conflict.reason || 'Scheduling conflict'}
                                        </div>
                                    ))}
                                    {simulation.conflicts.length > 5 && (
                                        <p className="text-xs text-gray-500 p-2">
                                            +{simulation.conflicts.length - 5} more conflicts
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={() => onApply(simulation)}
                            className="flex-1 gap-2"
                            size="lg"
                        >
                            <Check className="h-4 w-4" />
                            Apply This Simulation
                        </Button>
                        <Button
                            onClick={() => {
                                setShowComparison(false);
                                setSimulation(null);
                            }}
                            variant="outline"
                            className="flex-1"
                            size="lg"
                        >
                            Discard & Run Again
                        </Button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!simulation && !loading && (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <div className="text-gray-400 mb-4 text-4xl">🧪</div>
                        <p className="text-gray-600">Run a simulation to compare with current allocation</p>
                        <p className="text-xs text-gray-500 mt-2">No data to save until you apply a result</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
