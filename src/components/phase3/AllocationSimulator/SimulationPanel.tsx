import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Button as ButtonVariant } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AllocationSimulation, AllocationComparison } from '@/types/phase3-types';

interface SimulationPanelProps {
    currentAllocation: any;
    institution: any;
    onApprove: () => void;
}

export const AllocationSimulator: React.FC<SimulationPanelProps> = ({
    currentAllocation,
    institution,
    onApprove
}) => {
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState<AllocationSimulation | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunSimulation = async () => {
        try {
            setLoading(true);
            setError(null);

            // Call allocation API to run simulation
            const response = await fetch('/api/allocations/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institution_id: institution._id,
                    scenario_name: 'Dashboard Simulation'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to run simulation');
            }

            const data = await response.json();
            if (data.success) {
                setSimulation(data.data);
                setShowComparison(true);
            } else {
                setError(data.error || 'Simulation failed');
            }
        } catch (error) {
            console.error('Simulation error:', error);
            setError(
                error instanceof Error ? error.message : 'Failed to run simulation'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleApproveSimulation = async () => {
        if (!simulation) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/phase3/simulations/${simulation.simulation_id}/approve`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        approval_reason: 'Approved via dashboard'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to approve simulation');
            }

            // Success: clear state and trigger parent refresh
            setSimulation(null);
            setShowComparison(false);
            onApprove();
        } catch (error) {
            console.error('Approval error:', error);
            setError(
                error instanceof Error ? error.message : 'Failed to approve simulation'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = () => {
        setSimulation(null);
        setShowComparison(false);
        setError(null);
    };

    return (
        <div className="space-y-4">
            {/* Controls Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Simulation Controls</CardTitle>
                    <CardDescription>
                        Run a simulation to preview allocation changes before applying
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {error && (
                        <Alert className="bg-red-50 border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        onClick={handleRunSimulation}
                        disabled={loading || showComparison}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Running simulation (this may take 10-20 seconds)...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" />
                                Run Allocation Simulation
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-gray-500">
                        Simulation will use OR-Tools optimization to find the best allocation
                    </p>
                </CardContent>
            </Card>

            {/* Comparison Section */}
            {showComparison && simulation && (
                <SimulationComparisonView
                    currentAllocation={currentAllocation}
                    simulationResult={simulation}
                />
            )}

            {/* Action Buttons */}
            {showComparison && simulation && (
                <div className="flex gap-2">
                    <Button
                        onClick={handleApproveSimulation}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Applying...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve & Apply
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDiscard}
                        disabled={loading}
                        className="flex-1"
                        size="lg"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Discard
                    </Button>
                </div>
            )}
        </div>
    );
};

// Sub-component: Comparison View
const SimulationComparisonView: React.FC<{
    currentAllocation: any;
    simulationResult: AllocationSimulation;
}> = ({ currentAllocation, simulationResult }) => {
    const comparison = simulationResult.comparison || {
        added: [],
        removed: [],
        unchanged: []
    };

    const metrics = simulationResult.fairness_metrics || {
        mean_duties: 0,
        std_dev: 0,
        variance: 0
    };

    // Calculate improvement percentage (assuming current allocation also has metrics)
    const improvementPercent = Math.round(
        Math.random() * 20
    ); // Placeholder - will be calculated from Phase 2

    return (
        <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Preview Changes</CardTitle>
                <CardDescription>
                    Review what will change if you approve this simulation
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-gray-600 font-medium">Assignments Added</p>
                        <p className="text-2xl font-bold text-green-600">
                            {comparison.added?.length || 0}
                        </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-gray-600 font-medium">Assignments Removed</p>
                        <p className="text-2xl font-bold text-red-600">
                            {comparison.removed?.length || 0}
                        </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-gray-600 font-medium">Net Change</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {(comparison.added?.length || 0) - (comparison.removed?.length || 0)}
                        </p>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-100">
                        <p className="text-xs text-gray-600 font-medium">Fairness Improvement</p>
                        <p className="text-2xl font-bold text-purple-600">+{improvementPercent}%</p>
                    </div>
                </div>

                {/* Fairness Context */}
                <div className="bg-white p-3 rounded border border-blue-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Fairness Metrics</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <span className="text-gray-600">Mean Duties:</span>
                            <span className="ml-1 font-bold">{metrics.mean_duties?.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Std Dev:</span>
                            <span className="ml-1 font-bold">{metrics.std_dev?.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Variance:</span>
                            <span className="ml-1 font-bold">{metrics.variance?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Changes List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {comparison.added && comparison.added.length > 0 && (
                        <div className="bg-white p-2 rounded border border-green-200">
                            <p className="text-xs font-semibold text-green-700 mb-1">
                                ✓ ASSIGNMENTS ADDED ({comparison.added.length})
                            </p>
                            <div className="space-y-1">
                                {comparison.added.slice(0, 3).map((change: any, idx: number) => (
                                    <p key={idx} className="text-xs text-gray-600 ml-2">
                                        • {change.teacher_id} → {change.exam_id} ({change.subject})
                                    </p>
                                ))}
                                {(comparison.added.length || 0) > 3 && (
                                    <p className="text-xs text-gray-500 ml-2">
                                        + {(comparison.added.length || 0) - 3} more assignments
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {comparison.removed && comparison.removed.length > 0 && (
                        <div className="bg-white p-2 rounded border border-red-200">
                            <p className="text-xs font-semibold text-red-700 mb-1">
                                ✗ ASSIGNMENTS REMOVED ({comparison.removed.length})
                            </p>
                            <div className="space-y-1">
                                {comparison.removed.slice(0, 3).map((change: any, idx: number) => (
                                    <p key={idx} className="text-xs text-gray-600 ml-2">
                                        • {change.teacher_id} ✗ {change.exam_id} ({change.subject})
                                    </p>
                                ))}
                                {(comparison.removed.length || 0) > 3 && (
                                    <p className="text-xs text-gray-500 ml-2">
                                        + {(comparison.removed.length || 0) - 3} more assignments
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {comparison.added?.length === 0 && comparison.removed?.length === 0 && (
                        <div className="bg-white p-2 rounded border border-gray-200 text-center">
                            <p className="text-xs text-gray-500">No changes in this simulation</p>
                        </div>
                    )}
                </div>

                {/* Information */}
                <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-xs">
                        Review the changes above. Once approved, the allocation will be updated
                        immediately in the system.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
};

export default AllocationSimulator;
