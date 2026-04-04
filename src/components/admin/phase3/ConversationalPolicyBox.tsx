import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wand2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const API = "http://localhost:3000/api";

interface ParsedRule {
    type?: string;
    value?: any;
    teacher_name?: string;
    department?: string;
    [key: string]: any;
}

export default function ConversationalPolicyBox() {
    const [ruleText, setRuleText] = useState("");
    const [parsedRule, setParsedRule] = useState<ParsedRule | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitRule = async () => {
        if (!ruleText.trim()) {
            toast.error("Please enter a rule");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(`${API}/policy/parse`, { text: ruleText });

            if (res.data.success) {
                setParsedRule(res.data.parsed_constraints?.[0] || res.data.parsed_rule);
                toast.success("Rule parsed successfully!");
            } else {
                setError(res.data.error || "Failed to parse rule");
                toast.error("Rule parsing failed");
            }
        } catch (err: any) {
            console.error("Rule parsing error:", err);
            setError(err.response?.data?.error || err.message || "Failed to connect to server");
            toast.error("Rule parsing failed");
        } finally {
            setLoading(false);
        }
    };

    const applyRule = async () => {
        if (!parsedRule) return;

        toast.info("Rule would be applied to next allocation");
        // In production, this would call an API to save the rule
        // await axios.post(`${API}/policies/temporary`, parsedRule);
    };

    const getRuleTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            max_duties_per_day: "Max Duties Per Day",
            no_same_department: "No Same Department",
            prefer_senior_teachers: "Prefer Senior Teachers",
            avoid_teacher: "Avoid Teacher",
            prefer_department: "Prefer Department",
            fairness_target: "Fairness Target"
        };
        return labels[type] || type;
    };

    const examples = [
        "No teacher should have more than 3 duties per day",
        "Teachers should not invigilate exams from their own department",
        "Avoid assigning Dr. Smith on Mondays",
        "Senior teachers with more than 10 years experience should get priority",
        "Distribute duties fairly across all departments within 20% variance"
    ];

    return (
        <Card className="shadow-card border-primary/20">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Conversational Rule Editor</CardTitle>
                </div>
                <CardDescription>
                    Write allocation rules in plain English — AI converts them automatically
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Rule Input */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Your Rule</label>
                    <Textarea
                        placeholder="Example: Avoid assigning Smith on Mondays"
                        value={ruleText}
                        onChange={(e) => setRuleText(e.target.value)}
                        className="min-h-[100px] resize-y"
                        disabled={loading}
                    />
                </div>

                {/* Example Suggestions */}
                <div>
                    <p className="text-xs text-muted-foreground mb-2">Try these examples:</p>
                    <div className="flex flex-wrap gap-2">
                        {examples.slice(0, 3).map((example, idx) => (
                            <button
                                key={idx}
                                onClick={() => setRuleText(example)}
                                className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1 transition-colors"
                            >
                                {example.length > 40 ? example.substring(0, 40) + "..." : example}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button onClick={submitRule} disabled={loading} className="flex-1">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Parsing...
                            </>
                        ) : (
                            <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Parse with AI
                            </>
                        )}
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                            <div className="text-sm text-destructive">{error}</div>
                        </div>
                    </div>
                )}

                {/* Parsed Result */}
                {parsedRule && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">AI Parsed Rule</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                {getRuleTypeLabel(parsedRule.type || "custom")}
                            </Badge>
                        </div>

                        <pre className="text-xs bg-background rounded p-3 overflow-x-auto font-mono">
                            {JSON.stringify(parsedRule, null, 2)}
                        </pre>

                        <Button onClick={applyRule} variant="outline" size="sm" className="w-full">
                            Apply This Rule to Next Allocation
                        </Button>
                    </div>
                )}

                {/* Info Note */}
                <div className="text-xs text-muted-foreground border-t pt-3 mt-2">
                    💡 Rules are temporary. They will be applied to the next allocation run.
                    To save permanently, use the Policy Editor tab.
                </div>
            </CardContent>
        </Card>
    );
}