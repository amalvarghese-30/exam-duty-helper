import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AllocationManagement from './AllocationManagement';
import FairnessAnalysis from './FairnessAnalysis';
import SimulationManager from './SimulationManager';
import ExportManager from './ExportManager';
import { BarChart3, DollarSign, Settings, Download, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Phase3Dashboard: React.FC = () => {
    const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold tracking-tight">Phase 3: Advanced Allocation Management</h1>
                <p className="text-gray-600 mt-2">
                    Intelligent automation, fairness analytics, simulations, and advanced features
                </p>
            </div>

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
                    <AllocationManagement />
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
