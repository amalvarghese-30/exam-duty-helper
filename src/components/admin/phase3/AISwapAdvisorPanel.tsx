import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Zap, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SwapSuggestion {
    swap_id?: string;
    teacher_from?: string;
    teacher_to?: string;
    exam?: string;
    reasoning?: string;
    expected_improvement?: number;
    feasibility?: string;
    [key: string]: any;
}

interface AISwapAdvisorPanelProps {
    aiSuggestions?: SwapSuggestion[] | string | null;
    loading?: boolean;
    onApplySwap?: (swapId: string) => void;
}

export default function AISwapAdvisorPanel({
    aiSuggestions,
    loading = false,
    onApplySwap
}: AISwapAdvisorPanelProps) {
    const [applying, setApplying] = useState<string | null>(null);

    if (loading) {
        return (
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        AI Swap Recommendations
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!aiSuggestions) return null;

    // Handle string response
    if (typeof aiSuggestions === "string") {
        return (
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-base">AI Swap Recommendations</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg bg-muted/50 p-4">
                        <p className="text-sm whitespace-pre-wrap">{aiSuggestions}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Handle array of suggestions
    const suggestions = Array.isArray(aiSuggestions) ? aiSuggestions : [aiSuggestions];

    if (suggestions.length === 0) {
        return (
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-base">AI Swap Recommendations</CardTitle>
                    </div>
                    <CardDescription>No swap opportunities identified at this time</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4 text-muted-foreground text-sm">
                        The allocation appears well-balanced. Check back after changes.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleApply = async (swapId: string) => {
        setApplying(swapId);
        if (onApplySwap) {
            await onApplySwap(swapId);
        } else {
            toast.info("Swap application would be processed here");
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setApplying(null);
    };

    const getFeasibilityColor = (feasibility?: string) => {
        switch (feasibility?.toLowerCase()) {
            case "high": return "bg-green-100 text-green-800 border-green-200";
            case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "low": return "bg-red-100 text-red-800 border-red-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <Card className="shadow-card">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-base">AI Swap Recommendations</CardTitle>
                </div>
                <CardDescription>
                    AI-suggested duty swaps to improve fairness
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {suggestions.map((suggestion, idx) => (
                    <div key={idx} className="rounded-lg border p-4 space-y-3">
                        {/* Swap Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{suggestion.teacher_from || suggestion.current_teacher_name || "Teacher A"}</span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{suggestion.teacher_to || suggestion.suggested_teacher_name || "Teacher B"}</span>
                            </div>
                            {suggestion.expected_improvement && (
                                <Badge className="bg-green-100 text-green-800">
                                    +{suggestion.expected_improvement}% fairness
                                </Badge>
                            )}
                            {suggestion.feasibility && (
                                <Badge variant="outline" className={getFeasibilityColor(suggestion.feasibility)}>
                                    {suggestion.feasibility} feasibility
                                </Badge>
                            )}
                        </div>

                        {/* Exam Info */}
                        {suggestion.exam && (
                            <div className="text-sm text-muted-foreground">
                                Exam: <span className="font-medium">{suggestion.exam}</span>
                            </div>
                        )}

                        {/* Reasoning */}
                        {suggestion.reasoning && (
                            <div className="text-sm bg-muted/50 rounded-lg p-3">
                                <span className="text-muted-foreground">Why this helps:</span>
                                <p className="mt-1">{suggestion.reasoning}</p>
                            </div>
                        )}

                        {/* Action Button */}
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => handleApply(suggestion.swap_id || `swap_${idx}`)}
                            disabled={applying === (suggestion.swap_id || `swap_${idx}`)}
                        >
                            {applying === (suggestion.swap_id || `swap_${idx}`) ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-3 w-3" />
                                    Apply Swap
                                </>
                            )}
                        </Button>
                    </div>
                ))}

                {/* Batch Apply (if multiple) */}
                {suggestions.length > 1 && (
                    <Button
                        variant="default"
                        className="w-full gap-2"
                        onClick={() => toast.info("Batch apply would apply all swaps in optimal order")}
                    >
                        <Zap className="h-4 w-4" />
                        Apply All {suggestions.length} Swaps
                    </Button>
                )}

                <div className="text-xs text-muted-foreground border-t pt-3 mt-2">
                    💡 Swaps are suggestions only. Each swap will be validated for constraints before applying.
                </div>
            </CardContent>
        </Card>
    );
}