import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    BarChart3,
    Shuffle,
    Settings,
    AlertCircle,
    HelpCircle,
    Download,
    Zap,
    Users,
    Lock,
    Activity
} from 'lucide-react';

import { SimulationDashboard } from './AllocationSimulator/SimulationDashboard';
import { FairnessAnalyticsDashboard } from './FairnessAnalytics/FairnessAnalyticsDashboard';
import { SwapRecommendationPanel } from './SwapRecommendations/SwapRecommendationPanel';
import { DepartmentPolicyEditor } from './PolicyEditor/DepartmentPolicyEditor';
import { EmergencyReplacementPanel } from './EmergencyHandler/EmergencyReplacementPanel';
import { AuditTrailViewer } from './AuditTrail/AuditTrailViewer';
import { TeacherWorkloadDashboard } from './TeacherDashboard/TeacherWorkloadDashboard';
import { DutyCalendar } from './CalendarView/DutyCalendar';
import { DragDropAllocationPanel } from './ManualAllocation/DragDropAllocationPanel';
import { AllocationExplainerPanel } from './Explainability/AllocationExplainerPanel';

interface AdminDashboardRedesignedProps {
    currentAllocation: any;
    institution: any;
    user: any;
}

export const AdminDashboardRedesigned: React.FC<AdminDashboardRedesignedProps> = ({
    currentAllocation,
    institution,
    user
}) => {
    const [activeTab, setActiveTab] = useState('simulator');
    const [loading, setLoading] = useState(false);
    const [allocationMetrics, setAllocationMetrics] = useState(null);
    const [systemStatus, setSystemStatus] = useState('healthy');

    useEffect(() => {
        // Load allocation metrics on mount
        loadMetrics();
    }, [currentAllocation]);

    const loadMetrics = async () => {
        try {
            setLoading(true);
            // Fetch from Phase 2 backend
            const response = await fetch(
                `/api/phase3/analytics/${currentAllocation._id}`
            );
            const data = await response.json();
            setAllocationMetrics(data);

            // Determine system status based on fairness score
            if (data.fairness_score >= 75) {
                setSystemStatus('healthy');
            } else if (data.fairness_score >= 60) {
                setSystemStatus('caution');
            } else {
                setSystemStatus('critical');
            }
        } catch (error) {
            console.error('Failed to load metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-50 border-green-200';
            case 'caution': return 'bg-yellow-50 border-yellow-200';
            case 'critical': return 'bg-red-50 border-red-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const getStatusIcon = () => {
        switch (systemStatus) {
            case 'healthy': return '✅';
            case 'caution': return '⚠️';
            case 'critical': return '🚨';
            default: return 'ℹ️';
        }
    };

    return (
        <div className="w-full space-y-6 p-6">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Allocation Intelligence Center</h1>
                        <p className="text-gray-600 mt-1">
                            {institution?.name} • {currentAllocation?.exam_season || 'Current Allocation'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Last updated</p>
                        <p className="text-sm font-mono">
                            {currentAllocation?.updated_at
                                ? new Date(currentAllocation.updated_at).toLocaleDateString()
                                : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Card */}
            {allocationMetrics && (
                <Card className={`border-l-4 ${getStatusColor(systemStatus)}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getStatusIcon()}</span>
                                <div>
                                    <CardTitle className="text-lg">
                                        Fairness Score: {allocationMetrics.fairness_score}/100
                                    </CardTitle>
                                    <CardDescription>
                                        {allocationMetrics.fairness_assessment} •
                                        {allocationMetrics.overloaded_teachers?.length > 0 &&
                                            ` ${allocationMetrics.overloaded_teachers.length} overloaded teachers`}
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-sm">
                                {allocationMetrics.fairness_assessment.toUpperCase()}
                            </Badge>
                        </div>
                    </CardHeader>
                    {allocationMetrics.overloaded_teachers?.length > 0 && (
                        <CardContent>
                            <Alert className="bg-yellow-50 border-yellow-200">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    {allocationMetrics.overloaded_teachers[0].name} and {allocationMetrics.overloaded_teachers.length - 1} others are overloaded.
                                    Use Swap Recommendations to rebalance.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    )}
                </Card>
            )}

            {/* Quick Stats */}
            {allocationMetrics && (
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Avg Workload</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{allocationMetrics.workload_stats?.mean.toFixed(1)}</p>
                            <p className="text-xs text-gray-600">duties/teacher</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Workload Variance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{allocationMetrics.workload_stats?.variance.toFixed(2)}</p>
                            <p className="text-xs text-gray-600">lower = fairer</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Overloaded</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-red-600">
                                {allocationMetrics.overloaded_teachers?.length || 0}
                            </p>
                            <p className="text-xs text-gray-600">teachers</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {(allocationMetrics.patterns?.length || 0) + (allocationMetrics.overloaded_teachers?.length || 0) + (allocationMetrics.underloaded_teachers?.length || 0)}
                            </p>
                            <p className="text-xs text-gray-600">detected</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-7 w-full">
                    <TabsTrigger value="simulator" className="gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Simulate</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                    <TabsTrigger value="swaps" className="gap-2">
                        <Shuffle className="w-4 h-4" />
                        <span className="hidden sm:inline">Swaps</span>
                    </TabsTrigger>
                    <TabsTrigger value="emergency" className="gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="hidden sm:inline">Emergency</span>
                    </TabsTrigger>
                    <TabsTrigger value="policies" className="gap-2">
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Policies</span>
                    </TabsTrigger>
                    <TabsTrigger value="workload" className="gap-2">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Workload</span>
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="gap-2">
                        <Lock className="w-4 h-4" />
                        <span className="hidden sm:inline">Audit</span>
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: SIMULATOR */}
                <TabsContent value="simulator" className="space-y-4">
                    <SimulationDashboard
                        currentAllocation={currentAllocation}
                        institution={institution}
                        onApply={() => {
                            loadMetrics();
                            setActiveTab('analytics');
                        }}
                    />
                </TabsContent>

                {/* TAB 2: ANALYTICS */}
                <TabsContent value="analytics" className="space-y-4">
                    <FairnessAnalyticsDashboard
                        currentAllocation={currentAllocation}
                        institution={institution}
                    />
                </TabsContent>

                {/* TAB 3: SWAPS */}
                <TabsContent value="swaps" className="space-y-4">
                    <SwapRecommendationPanel
                        allocation={currentAllocation}
                        institution={institution}
                        onSwapApplied={() => {
                            loadMetrics();
                        }}
                    />
                </TabsContent>

                {/* TAB 4: EMERGENCY */}
                <TabsContent value="emergency" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                Emergency Teacher Replacement
                            </CardTitle>
                            <CardDescription>
                                Handle teacher unavailability and find immediate replacements
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <EmergencyReplacementPanel
                                allocation={currentAllocation}
                                exam={null}
                                currentTeacher={null}
                                institution={institution}
                                onApply={() => {
                                    loadMetrics();
                                }}
                                onClose={() => setActiveTab('analytics')}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 5: POLICIES */}
                <TabsContent value="policies" className="space-y-4">
                    <DepartmentPolicyEditor
                        institution={institution}
                        onDone={(updated) => {
                            if (updated) {
                                loadMetrics();
                                setActiveTab('analytics');
                            }
                        }}
                    />
                </TabsContent>

                {/* TAB 6: WORKLOAD */}
                <TabsContent value="workload" className="space-y-4">
                    <TeacherWorkloadDashboard
                        institution={institution}
                        user={user}
                    />
                </TabsContent>

                {/* TAB 7: AUDIT TRAIL */}
                <TabsContent value="audit" className="space-y-4">
                    <AuditTrailViewer
                        allocation={currentAllocation}
                        institution={institution}
                    />
                </TabsContent>
            </Tabs>

            {/* Footer */}
            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <p>Phase 3: Intelligent Automation & Analytics</p>
                            <p className="text-xs mt-1">Powered by OR-Tools Optimization + Google Gemini AI</p>
                        </div>
                        <Button variant="ghost" size="sm">
                            View Documentation
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboardRedesigned;
