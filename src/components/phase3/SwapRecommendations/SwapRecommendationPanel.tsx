import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, AlertCircle, Zap, ArrowRight, TrendingUp } from 'lucide-react';

interface SwapRecommendation {
    teacher_a: { name: string; id: string; current_duties: number };
    teacher_b: { name: string; id: string; current_duties: number };
    fairness_improvement_percent: number;
    reason: string;
    constraint_compliance: boolean;
}

interface SwapRecommendationsData {
    current_fairness: number;
    overloaded_teachers: Array<any>;
    underloaded_teachers: Array<any>;
    top_swap_recommendations: SwapRecommendation[];
    total_potential_improvement: number;
}

interface SwapRecommendationPanelProps {
    allocation: any;
    institution: any;
    onSwapApplied: () => void;
}

export const SwapRecommendationPanel: React.FC<SwapRecommendationPanelProps> = ({
    allocation,
    institution,
    onSwapApplied
}) => {
    const [loading, setLoading] = useState(true);
    const [swaps, setSwaps] = useState<SwapRecommendation[]>([]);
    const [data, setData] = useState<SwapRecommendationsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [applying, setApplying] = useState<string | null>(null);
    const [selectedSwaps, setSelectedSwaps] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadSwapRecommendations();
    }, [allocation, institution]);

    const loadSwapRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);
            setSwaps([]);

            const response = await fetch('/api/swaps/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institution_id: institution._id || institution.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load swap recommendations');
            }

            const result = await response.json();
            if (result.data && result.data.top_swap_recommendations) {
                setData(result.data);
                setSwaps(result.data.top_swap_recommendations || []);
            }
        } catch (error) {
            console.error('Error loading swaps:', error);
            setError(error instanceof Error ? error.message : 'Failed to load swap recommendations');
        } finally {
            setLoading(false);
        }
    };

    const handleApplySwap = async (index: number, swap: SwapRecommendation) => {
        try {
            setApplying(`${index}`);
            setError(null);

            const response = await fetch('/api/swaps/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institution_id: institution._id || institution.id,
                    teacher_a_id: swap.teacher_a.id,
                    teacher_b_id: swap.teacher_b.id,
                    type: 'auto_recommended',
                    reason: swap.reason,
                    fairness_improvement: swap.fairness_improvement_percent
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create swap request');
            }

            // Remove from list and refresh
            const newSwaps = swaps.filter((_, i) => i !== index);
            setSwaps(newSwaps);
            onSwapApplied();
        } catch (error) {
            console.error('Error applying swap:', error);
            setError(error instanceof Error ? error.message : 'Failed to apply swap');
        } finally {
            setApplying(null);
        }
    };

    const handleBatchApply = async () => {
        const selectedIndices = Array.from(selectedSwaps).sort((a, b) => b - a); // reverse to avoid index shifts
        for (const idx of selectedIndices) {
            await handleApplySwap(idx, swaps[idx]);
        }
        setSelectedSwaps(new Set());
    };

    const toggleSwapSelection = (index: number) => {
        const newSelected = new Set(selectedSwaps);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedSwaps(newSelected);
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

    return (
        <div className="space-y-4">
            {/* Header Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                Swap Recommendations
                            </CardTitle>
                            <CardDescription>
                                Auto-generated swaps to improve fairness
                            </CardDescription>
                        </div>
                        <Button
                            onClick={loadSwapRecommendations}
                            variant="outline"
                            size="sm"
                        >
                            ↻ Refresh
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

            {/* Fairness Metrics */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-blue-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Current Fairness</p>
                                <p className="text-3xl font-bold text-blue-600">{data.current_fairness.toFixed(1)}%</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Potential Improvement</p>
                                <div className="flex items-center justify-center gap-1">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    <p className="text-3xl font-bold text-green-600">+{data.total_potential_improvement.toFixed(1)}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-1">Available Swaps</p>
                                <p className="text-3xl font-bold text-purple-600">{swaps.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Swap Cards */}
            {swaps.length > 0 ? (
                <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {swaps.map((swap, idx) => (
                            <Card key={idx} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Teacher A */}
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900">{swap.teacher_a.name}</div>
                                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                {swap.teacher_a.current_duties} duties
                                            </Badge>
                                            {swap.teacher_a.current_duties > 5 && (
                                                <p className="text-xs text-red-600 mt-1">Overloaded</p>
                                            )}
                                        </div>

                                        {/* Swap Arrow */}
                                        <div className="flex flex-col items-center gap-2">
                                            <ArrowRight className="h-5 w-5 text-gray-400" />
                                            <Badge className="bg-green-600">
                                                +{swap.fairness_improvement_percent.toFixed(1)}%
                                            </Badge>
                                        </div>

                                        {/* Teacher B */}
                                        <div className="flex-1 text-right">
                                            <div className="font-semibold text-gray-900">{swap.teacher_b.name}</div>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {swap.teacher_b.current_duties} duties
                                            </Badge>
                                            {swap.teacher_b.current_duties < 3 && (
                                                <p className="text-xs text-blue-600 mt-1">Available capacity</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 ml-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedSwaps.has(idx)}
                                                onChange={() => toggleSwapSelection(idx)}
                                                className="w-5 h-5 rounded border-gray-300"
                                            />
                                            <Button
                                                onClick={() => handleApplySwap(idx, swap)}
                                                disabled={applying === `${idx}`}
                                                size="sm"
                                                className="gap-1"
                                            >
                                                {applying === `${idx}` ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                                Apply
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    {swap.reason && (
                                        <div className="mt-3 text-xs text-gray-600 p-2 bg-gray-50 rounded">
                                            <span className="font-medium">Why:</span> {swap.reason}
                                        </div>
                                    )}

                                    {/* Constraint Warning */}
                                    {!swap.constraint_compliance && (
                                        <Alert className="mt-3 border-yellow-200 bg-yellow-50 py-2">
                                            <AlertCircle className="h-3 w-3 text-yellow-600" />
                                            <AlertDescription className="text-xs text-yellow-700">
                                                May violate constraints - review before approval
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Batch Apply Button */}
                    {selectedSwaps.size > 0 && (
                        <Button
                            onClick={handleBatchApply}
                            className="w-full gap-2"
                            size="lg"
                        >
                            <Check className="h-4 w-4" />
                            Apply {selectedSwaps.size} Selected Swaps
                        </Button>
                    )}
                </>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <div className="text-gray-400 text-4xl mb-2">✓</div>
                        <p className="text-gray-600">No swap recommendations available</p>
                        <p className="text-xs text-gray-500 mt-2">Current allocation is fairly balanced</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
