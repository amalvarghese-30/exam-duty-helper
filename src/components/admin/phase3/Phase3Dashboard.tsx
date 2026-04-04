import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, DollarSign, Settings, Download, AlertCircle, Wand2, Lightbulb, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import AllocationManagement from './AllocationManagement';
import FairnessAnalysis from './FairnessAnalysis';
import SimulationManager from './SimulationManager';
import ExportManager from './ExportManager';
import ConversationalPolicyBox from './ConversationalPolicyBox';
import SimulationRiskPanel from './SimulationRiskPanel';
import AISwapAdvisorPanel from './AISwapAdvisorPanel';

export const Phase3Dashboard: React.FC = () => {
    const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
    const [simulationRisk, setSimulationRisk] = useState<any>(null);
    const [swapSuggestions, setSwapSuggestions] = useState<any>(null);

    // Mock function to load simulation risk - replace with actual API call
    const loadSimulationRisk = async (allocationId: string) => {
        try {
            // const response = await fetch(`/api/phase3/analytics/${allocationId}/risk`);
            // const data = await response.json();
            // setSimulationRisk(data);

            // Mock data for demonstration
            setSimulationRisk({
                overload_probability: 35,
                risk_level: "low",
                risk_factors: [
                    "Low workload variance across teachers",
                    "No critical conflicts detected",
                    "All constraints satisfied"
                ],
                recommendations: [
                    "Current allocation looks balanced",
                    "Monitor workload as new exams are added"
                ],
                confidence_score: 0.85
            });
        } catch (error) {
            console.error("Failed to load risk prediction:", error);
        }
    };

    // Mock function to load swap suggestions
    const loadSwapSuggestions = async (allocationId: string) => {
        try {
            // const response = await fetch(`/api/phase3/swaps/${allocationId}/ai-suggestions`);
            // const data = await response.json();
            // setSwapSuggestions(data);

            // Mock data for demonstration
            setSwapSuggestions([
                {
                    swap_id: "swap_1",
                    teacher_from: "Dr. Rajesh Kumar",
                    teacher_to: "Dr. Priya Sharma",
                    exam: "Data Structures",
                    reasoning: "Dr. Sharma has lower workload (4 duties vs 8 duties) and is qualified for this exam",
                    expected_improvement: 12.5,
                    feasibility: "high"
                },
                {
                    swap_id: "swap_2",
                    teacher_from: "Dr. Vikram Singh",
                    teacher_to: "Dr. Anjali Mehta",
                    exam: "Calculus",
                    reasoning: "Department balance would improve by assigning Mathematics department teacher",
                    expected_improvement: 8.3,
                    feasibility: "medium"
                }
            ]);
        } catch (error) {
            console.error("Failed to load swap suggestions:", error);
        }
    };

    // Handle allocation selection
    const handleAllocationSelect = (allocationId: string) => {
        setSelectedAllocationId(allocationId);
        loadSimulationRisk(allocationId);
        loadSwapSuggestions(allocationId);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Phase 3: Advanced Allocation Management</h1>
                <p className="text-gray-600 mt-2">
                    Intelligent automation, fairness analytics, simulations, and advanced features
                </p>
            </div>

            {/* AI Panels Row - Top Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ConversationalPolicyBox />
                <SimulationRiskPanel riskPrediction={simulationRisk} />
            </div>

            {/* AI Swap Advisor Panel */}
            <AISwapAdvisorPanel
                aiSuggestions={swapSuggestions}
                onApplySwap={async (swapId) => {
                    toast.success(`Swap ${swapId} applied successfully`);
                    // Refresh data after swap
                    if (selectedAllocationId) {
                        await loadSwapSuggestions(selectedAllocationId);
                        await loadSimulationRisk(selectedAllocationId);
                    }
                }}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Allocations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8</div>
                        <p className="text-xs text-gray-500">+2 this week</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Fairness Score (Avg)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">78.5%</div>
                        <p className="text-xs text-gray-500">Excellent</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Active Simulations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-gray-500">Running optimizations</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">2</div>
                        <p className="text-xs text-gray-500">Awaiting review</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="allocations" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="allocations" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Allocations</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="fairness"
                        disabled={!selectedAllocationId}
                        className="flex items-center gap-2"
                    >
                        <DollarSign className="w-4 h-4" />
                        <span className="hidden sm:inline">Fairness</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="simulations"
                        disabled={!selectedAllocationId}
                        className="flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Simulations</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="exports"
                        disabled={!selectedAllocationId}
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exports</span>
                    </TabsTrigger>
                    <TabsTrigger value="help" className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Help</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="allocations">
                    <AllocationManagement onSelectAllocation={handleAllocationSelect} />
                </TabsContent>

                <TabsContent value="fairness">
                    {selectedAllocationId ? (
                        <FairnessAnalysis allocationId={selectedAllocationId} />
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        Select an allocation from the Allocations tab to view fairness analysis
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="simulations">
                    {selectedAllocationId ? (
                        <SimulationManager allocationId={selectedAllocationId} />
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        Select an allocation from the Allocations tab to run simulations
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="exports">
                    {selectedAllocationId ? (
                        <ExportManager allocationId={selectedAllocationId} />
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        Select an allocation from the Allocations tab to export data
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="help">
                    <Card>
                        <CardHeader>
                            <CardTitle>Phase 3 Features Guide</CardTitle>
                            <CardDescription>Learn about advanced allocation management</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Wand2 className="h-4 w-4 text-primary" />
                                        Conversational Rule Editor
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Write allocation rules in plain English. AI converts them to constraints automatically.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        AI Risk Prediction
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Get predictive analysis of overload probability and fairness risks before applying changes.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                                        Smart Swap Recommendations
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        AI-powered swap suggestions to improve workload distribution and fairness.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">📊 Allocations</h4>
                                    <p className="text-sm text-gray-600">
                                        View, create, and manage duty allocations with full lifecycle management
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">⚖️ Fairness Analysis</h4>
                                    <p className="text-sm text-gray-600">
                                        Analyze fairness metrics across all teachers and identify imbalances
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">🔄 Simulations</h4>
                                    <p className="text-sm text-gray-600">
                                        Run what-if scenarios and optimize allocations before implementation
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">📥 Exports</h4>
                                    <p className="text-sm text-gray-600">
                                        Export allocations in multiple formats (Excel, PDF, iCalendar)
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Phase3Dashboard;