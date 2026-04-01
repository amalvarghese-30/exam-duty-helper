import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lightbulb, Brain, AlertCircle, CheckCircle2, Copy, RefreshCw } from 'lucide-react';

interface AllocationDecision {
    exam_id: string;
    subject: string;
    assigned_teacher: string;
    reason?: string;
    confidence: number;
    constraints_met: string[];
    constraints_violated?: string[];
}

interface AllocationExplainerPanelProps {
    decision: AllocationDecision;
    institution?: any;
    onExplanationReceived?: (explanation: string) => void;
}

export const AllocationExplainerPanel: React.FC<AllocationExplainerPanelProps> = ({
    decision,
    institution,
    onExplanationReceived,
}) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerateExplanation = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Call explainability API
            const response = await fetch('/api/allocations/explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exam_id: decision.exam_id,
                    teacher_id: decision.assigned_teacher,
                    subject: decision.subject,
                    institution_id: institution?._id,
                    constraints_met: decision.constraints_met,
                    constraints_violated: decision.constraints_violated || [],
                    confidence: decision.confidence,
                }),
            });

            if (!response.ok) {
                // Fallback: generate static explanation
                const fallbackExplanation =
                    `This teacher was selected for ${decision.subject} based on:\n\n` +
                    `✓ Constraints Met:\n${decision.constraints_met
                        .map((c) => `  • ${c}`)
                        .join('\n')}\n\n` +
                    `Confidence Score: ${(decision.confidence * 100).toFixed(1)}%\n\n` +
                    (decision.constraints_violated && decision.constraints_violated.length > 0
                        ? `⚠ Soft Constraints Relaxed:\n${decision.constraints_violated
                            .map((c) => `  • ${c}`)
                            .join('\n')}`
                        : 'All soft constraints were satisfied.');

                setExplanation(fallbackExplanation);
            } else {
                const data = await response.json();
                setExplanation(data.explanation);
            }

            if (onExplanationReceived && explanation) {
                onExplanationReceived(explanation);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error generating explanation');
            // Fallback explanation
            const fallbackExplanation =
                `This teacher was selected for ${decision.subject} based on:\n\n` +
                `✓ Constraints Met:\n${decision.constraints_met
                    .map((c) => `  • ${c}`)
                    .join('\n')}\n\n` +
                `Confidence Score: ${(decision.confidence * 100).toFixed(1)}%`;

            setExplanation(fallbackExplanation);
        } finally {
            setLoading(false);
        }
    }, [decision, institution, onExplanationReceived, explanation]);

    const handleCopyExplanation = () => {
        if (explanation) {
            navigator.clipboard.writeText(explanation);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-500" />
                        AI Allocation Explanation
                    </CardTitle>
                    <CardDescription>
                        Understand why this teacher was selected for this exam
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Allocation Summary */}
            <Card>
                <CardContent className="p-4">
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-600">Exam Subject</div>
                                <div className="text-lg font-semibold">{decision.subject}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Assigned Teacher</div>
                                <div className="text-lg font-semibold">{decision.assigned_teacher}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-gray-600 mb-2">Confidence Score</div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${decision.confidence > 0.8
                                                ? 'bg-green-500'
                                                : decision.confidence > 0.6
                                                    ? 'bg-yellow-500'
                                                    : 'bg-orange-500'
                                            }`}
                                        style={{ width: `${decision.confidence * 100}%` }}
                                    />
                                </div>
                                <div className="text-sm font-semibold mt-1">
                                    {(decision.confidence * 100).toFixed(1)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600 mb-2">Constraints</div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-green-700 bg-green-50">
                                        ✓ {decision.constraints_met.length} met
                                    </Badge>
                                    {decision.constraints_violated && decision.constraints_violated.length > 0 && (
                                        <Badge variant="outline" className="text-amber-700 bg-amber-50">
                                            ⚠ {decision.constraints_violated.length} relaxed
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Constraints Met */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">✓ Hard Constraints Met</CardTitle>
                    <CardDescription>
                        All required conditions for this allocation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {decision.constraints_met.map((constraint, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-2 bg-green-50 rounded">
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-700">{constraint}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Constraints Violated (if any) */}
            {decision.constraints_violated && decision.constraints_violated.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="text-base text-amber-900">
                            ⚠ Soft Constraints Relaxed
                        </CardTitle>
                        <CardDescription className="text-amber-800">
                            These preferences were adjusted for optimal allocation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {decision.constraints_violated.map((constraint, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded">
                                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-900">{constraint}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Generated Explanation */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            <CardTitle className="text-base">AI Explanation</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerateExplanation}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                    <CardDescription>
                        AI-powered reasoning for this allocation decision
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <Alert className="border-amber-200 bg-amber-50">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                                Could not connect to AI service. Showing structured explanation instead.
                            </AlertDescription>
                        </Alert>
                    )}

                    {!explanation && !loading && (
                        <div className="text-center py-6 text-gray-500">
                            <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Click "Generate" to get AI-powered explanation</p>
                        </div>
                    )}

                    {explanation && (
                        <div className="relative">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 whitespace-pre-wrap text-sm font-mono leading-relaxed">
                                {explanation}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={handleCopyExplanation}
                            >
                                {copied ? '✓ Copied' : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className="ml-2 text-gray-600">Generating explanation...</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="text-sm text-blue-900 space-y-2">
                        <div className="font-semibold mb-2">💡 Tips for interpreting explanations:</div>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>High confidence (>80%) indicates strong reasons for selection</li>
                            <li>Relaxed constraints show trade-offs made for fairness</li>
                            <li>Hard constraints (marked ✓) are always enforced</li>
                            <li>Use this to build trust in the allocation system</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
