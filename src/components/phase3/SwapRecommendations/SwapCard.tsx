import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, Zap, AlertCircle } from 'lucide-react';
import type { SwapRecommendation } from '@/types/phase3-types';

interface SwapRecommendationPanelProps {
    allocation: any;
    metrics: any;
    onSwapApplied: () => void;
}

export const SwapRecommendationPanel: React.FC<SwapRecommendationPanelProps> = ({
    allocation,
    metrics,
    onSwapApplied
}) => {
    const [loading, setLoading] = useState(false);
    const [swaps, setSwaps] = useState<SwapRecommendation[]>([]);
    const [applying, setApplying] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedSwaps, setSelectedSwaps] = useState<Set<string>>(new Set());
    const [totalImprovementPercent, setTotalImprovementPercent] = useState(0);

    useEffect(() => {
        loadSwaps();
    }, [allocation]);

    const loadSwaps = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/phase3/swaps/${allocation._id}?limit=15`);

            if (!response.ok) {
                throw new Error('Failed to load swaps');
            }

            const data = await response.json();

            if (data.success) {
                setSwaps(data.data.swaps || []);
                setTotalImprovementPercent(data.data.total_potential_improvement || 0);
            }
        } catch (error) {
            console.error('Failed to load swaps:', error);
            setError(error instanceof Error ? error.message : 'Failed to load swaps');
        } finally {
            setLoading(false);
        }
    };

    const handleApplySwap = async (swapId: string) => {
        try {
            setApplying(swapId);
            setError(null);

            const response = await fetch(
                `/api/phase3/swaps/${allocation._id}/${swapId}/apply`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'Applied via recommendation panel' })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to apply swap');
            }

            // Refresh swaps and metrics
            await loadSwaps();
            onSwapApplied();
        } catch (error) {
            console.error('Failed to apply swap:', error);
            setError(error instanceof Error ? error.message : 'Failed to apply swap');
        } finally {
            setApplying(null);
        }
    };

    const handleBatchApplySwaps = async () => {
        if (selectedSwaps.size === 0) return;

        try {
            setApplying('batch');
            setError(null);

            const response = await fetch(
                `/api/phase3/swaps/${allocation._id}/batch-apply`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        swap_ids: Array.from(selectedSwaps),
                        reason: 'Batch applied via recommendation panel'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to apply swaps');
            }

            setSelectedSwaps(new Set());
            await loadSwaps();
            onSwapApplied();
        } catch (error) {
            console.error('Failed to apply swaps:', error);
            setError(error instanceof Error ? error.message : 'Failed to apply swaps');
        } finally {
            setApplying(null);
        }
    };

    const toggleSwapSelection = (swapId: string) => {
        const newSelected = new Set(selectedSwaps);
        if (newSelected.has(swapId)) {
            newSelected.delete(swapId);
        } else {
            newSelected.add(swapId);
        }
        setSelectedSwaps(newSelected);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    if (swaps.length === 0) {
        return (
            <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                    <Zap className="h-12 w-12 text-green-600 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">No Swap Recommendations</p>
                    <p className="text-xs text-gray-600 mt-1">Your allocation is well-balanced!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {/* Information Banner */}
            <Alert className="bg-blue-50 border-blue-200">
                <Zap className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    Found {swaps.length} swap recommendation(s) with potential {totalImprovementPercent}% fairness
                    improvement. Apply individual swaps or select multiple for batch application.
                </AlertDescription>
            </Alert>

            {/* Batch Actions */}
            {selectedSwaps.size > 0 && (
                <Card className="border-blue-300 bg-blue-50">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {selectedSwaps.size} swap(s) selected
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Batch apply will optimize the order for best results
                                </p>
                            </div>
                            <Button
                                onClick={handleBatchApplySwaps}
                                disabled={applying === 'batch'}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {applying === 'batch' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        Apply {selectedSwaps.size} Swaps
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Swap Cards */}
            <div className="space-y-3">
                {swaps.map((swap) => (
                    <Card
                        key={swap.id}
                        className={`overflow-hidden cursor-pointer transition-all ${selectedSwaps.has(swap.id)
                                ? 'border-blue-500 border-l-4 bg-blue-50'
                                : 'hover:border-blue-200'
                            }`}
                        onClick={() => toggleSwapSelection(swap.id)}
                    >
                        <CardContent className="pt-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedSwaps.has(swap.id)}
                                        onChange={() => { }}
                                        className="w-4 h-4 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">Rebalance Workload</p>
                                        <p className="text-xs text-gray-600">
                                            {swap.improvement_percent.toFixed(1)}% fairness improvement
                                        </p>
                                    </div>
                                </div>
                                <Badge className="bg-green-100 text-green-800 border-0">
                                    Priority: {swap.priority.toFixed(0)}
                                </Badge>
                            </div>

                            {/* Teachers */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded mb-3">
                                {/* Overloaded */}
                                <div className="flex-1">
                                    <p className="text-xs text-gray-600 font-medium">OVERLOADED</p>
                                    <p className="font-semibold text-gray-900">{swap.overloaded.name}</p>
                                    <p className="text-sm text-red-600 font-bold">
                                        {swap.overloaded.duties} duties
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Reliability: {(swap.overloaded.reliability * 100).toFixed(0)}%
                                    </p>
                                </div>

                                {/* Arrow */}
                                <ArrowRight className="h-5 w-5 text-gray-400" />

                                {/* Underloaded */}
                                <div className="flex-1 text-right">
                                    <p className="text-xs text-gray-600 font-medium">UNDERLOADED</p>
                                    <p className="font-semibold text-gray-900">{swap.underloaded.name}</p>
                                    <p className="text-sm text-green-600 font-bold">
                                        {swap.underloaded.duties} duties
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Reliability: {(swap.underloaded.reliability * 100).toFixed(0)}%
                                    </p>
                                </div>
                            </div>

                            {/* Swappable Duties */}
                            {swap.swappable_duties && swap.swappable_duties.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                        Can swap ({swap.swappable_duties.length} exams):
                                    </p>
                                    <div className="space-y-1">
                                        {swap.swappable_duties.slice(0, 3).map((duty, idx) => (
                                            <p key={idx} className="text-xs text-gray-600 ml-2">
                                                • {duty.subject} (confidence: {(duty.swap_score * 100).toFixed(0)}%)
                                            </p>
                                        ))}
                                        {(swap.swappable_duties.length || 0) > 3 && (
                                            <p className="text-xs text-gray-500 ml-2">
                                                +{(swap.swappable_duties.length || 0) - 3} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplySwap(swap.id);
                                }}
                                disabled={applying === swap.id}
                                className="w-full"
                                size="sm"
                                variant={selectedSwaps.has(swap.id) ? 'default' : 'outline'}
                            >
                                {applying === swap.id ? (
                                    <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Applying...
                                    </>
                                ) : selectedSwaps.has(swap.id) ? (
                                    'Selected'
                                ) : (
                                    'Apply Single Swap'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Load More */}
            {swaps.length >= 15 && (
                <div className="text-center">
                    <Button variant="outline" size="sm" disabled>
                        Load More Recommendations
                    </Button>
                </div>
            )}
        </div>
    );
};

export default SwapRecommendationPanel;
