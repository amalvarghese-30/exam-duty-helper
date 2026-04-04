import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, TrendingUp, Shield, AlertCircle, Loader2 } from "lucide-react";

interface RiskPrediction {
    overload_probability?: number;
    risk_level?: string;
    risk_factors?: string[];
    recommendations?: string[];
    confidence_score?: number;
    [key: string]: any;
}

interface SimulationRiskPanelProps {
    riskPrediction?: RiskPrediction | string | null;
    loading?: boolean;
}

export default function SimulationRiskPanel({ riskPrediction, loading = false }: SimulationRiskPanelProps) {
    if (loading) {
        return (
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        AI Risk Forecast
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!riskPrediction) return null;

    // Handle string response from API
    const prediction = typeof riskPrediction === "string"
        ? { analysis: riskPrediction }
        : riskPrediction;

    const getRiskColor = (level?: string) => {
        switch (level?.toLowerCase()) {
            case "critical": return "text-red-600 bg-red-50 border-red-200";
            case "high": return "text-orange-600 bg-orange-50 border-orange-200";
            case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
            case "low": return "text-green-600 bg-green-50 border-green-200";
            default: return "text-blue-600 bg-blue-50 border-blue-200";
        }
    };

    const getRiskIcon = (level?: string) => {
        switch (level?.toLowerCase()) {
            case "critical": return <AlertCircle className="h-5 w-5 text-red-600" />;
            case "high": return <AlertTriangle className="h-5 w-5 text-orange-600" />;
            case "medium": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case "low": return <Shield className="h-5 w-5 text-green-600" />;
            default: return <TrendingUp className="h-5 w-5 text-blue-600" />;
        }
    };

    const probability = prediction.overload_probability ?? 50;
    const riskLevel = prediction.risk_level ?? "medium";
    const riskColor = getRiskColor(riskLevel);

    return (
        <Card className="shadow-card">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {getRiskIcon(riskLevel)}
                        <CardTitle className="text-base">AI Risk Forecast</CardTitle>
                    </div>
                    <Badge className={riskColor}>
                        {riskLevel.toUpperCase()} RISK
                    </Badge>
                </div>
                <CardDescription>
                    Predictive analysis for this allocation scenario
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Overload Probability Gauge */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Overload Probability</span>
                        <span className="font-semibold">{probability}%</span>
                    </div>
                    <Progress value={probability} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                    </div>
                </div>

                {/* Confidence Score */}
                {prediction.confidence_score && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">AI Confidence</span>
                        <span className="font-mono">{(prediction.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                )}

                {/* Risk Factors */}
                {prediction.risk_factors && prediction.risk_factors.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Risk Factors</p>
                        <ul className="space-y-1">
                            {prediction.risk_factors.map((factor: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-red-500">•</span>
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* AI Analysis (string fallback) */}
                {prediction.analysis && !prediction.risk_factors && (
                    <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-sm whitespace-pre-wrap">{prediction.analysis}</p>
                    </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <p className="text-sm font-medium text-green-600">Recommendations</p>
                        <ul className="space-y-1">
                            {prediction.recommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-green-500">✓</span>
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="text-xs text-muted-foreground border-t pt-3 mt-2">
                    ⚠️ This is an AI-generated prediction. Actual results may vary.
                    Use as guidance for decision-making.
                </div>
            </CardContent>
        </Card>
    );
}