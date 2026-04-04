// src/components/admin/phase3/AllocationManagement.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AllocationService from '@/services/phase3/AllocationService';
import { AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Allocation {
    _id: string;
    exam_id: string;
    status: string;
    created_by: string;
    metrics: {
        total_duties: number;
        assigned_duties: number;
        average_fairness_score: number;
    };
}

interface AllocationManagementProps {
    onSelectAllocation?: (allocationId: string) => void;
}

export const AllocationManagement: React.FC<AllocationManagementProps> = ({ onSelectAllocation }) => {
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null);

    useEffect(() => {
        loadAllocations();
    }, []);

    const loadAllocations = async () => {
        setLoading(true);
        const result = await AllocationService.getAllocations();
        if (result.success) {
            setAllocations(result.data?.allocations || []);
            setError(null);
        } else {
            setError(result.error || 'Failed to load allocations');
        }
        setLoading(false);
    };

    const handleSelectAllocation = (allocationId: string) => {
        setSelectedAllocation(allocationId);
        if (onSelectAllocation) {
            onSelectAllocation(allocationId);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-500';
            case 'pending_review':
                return 'bg-yellow-500';
            case 'draft':
                return 'bg-gray-500';
            case 'active':
                return 'bg-blue-500';
            case 'completed':
                return 'bg-purple-500';
            default:
                return 'bg-slate-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'pending_review':
                return <Clock className="w-4 h-4" />;
            case 'active':
                return <Zap className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Allocation Management</h2>
                <Button onClick={loadAllocations} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allocations.map((allocation) => (
                    <Card
                        key={allocation._id}
                        className={`cursor-pointer transition-all ${selectedAllocation === allocation._id ? 'ring-2 ring-blue-500' : ''
                            }`}
                        onClick={() => handleSelectAllocation(allocation._id)}
                    >
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Allocation #{allocation._id.substring(0, 8)}
                            </CardTitle>
                            <CardDescription>Exam: {allocation.exam_id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Status</span>
                                <Badge
                                    className={`${getStatusColor(allocation.status)} text-white flex items-center gap-1`}
                                >
                                    {getStatusIcon(allocation.status)}
                                    {allocation.status}
                                </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Total Duties:</span>
                                    <span className="font-semibold">{allocation.metrics.total_duties}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Assigned:</span>
                                    <span className="font-semibold">{allocation.metrics.assigned_duties}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Fairness Score:</span>
                                    <span className="font-semibold">
                                        {(allocation.metrics.average_fairness_score * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectAllocation(allocation._id);
                                    }}
                                >
                                    View Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {allocations.length === 0 && !loading && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No allocations found. Create a new one to get started.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AllocationManagement;