import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Save, RotateCcw, Plus, Trash2, Settings } from 'lucide-react';

interface DepartmentPolicy {
    department: string;
    max_duties_per_day: number;
    min_gap_between_duties_hours: number;
    supervisor_eligible: boolean;
    cross_department_allowed: boolean;
    priority_subjects: string[];
    role_restrictions: Record<string, string[]>;
    min_duties_weekly: number;
    max_duties_weekly: number;
}

interface DepartmentPolicyEditorProps {
    institution: any;
    onDone: (updated: boolean) => void;
}

export const DepartmentPolicyEditor: React.FC<DepartmentPolicyEditorProps> = ({
    institution,
    onDone
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [policies, setPolicies] = useState<DepartmentPolicy[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<DepartmentPolicy | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newSubject, setNewSubject] = useState('');

    useEffect(() => {
        loadPolicies();
    }, [institution]);

    const loadPolicies = async () => {
        try {
            setLoading(true);
            setError(null);

            // Mock data - in production, fetch from backend
            const mockPolicies: DepartmentPolicy[] = [
                {
                    department: 'Computer Science',
                    max_duties_per_day: 3,
                    min_gap_between_duties_hours: 2,
                    supervisor_eligible: true,
                    cross_department_allowed: false,
                    priority_subjects: ['Data Structures', 'Algorithms', 'Programming'],
                    role_restrictions: {
                        supervisor: ['Senior Faculty'],
                        invigilator: ['All']
                    },
                    min_duties_weekly: 2,
                    max_duties_weekly: 8
                },
                {
                    department: 'Mathematics',
                    max_duties_per_day: 2,
                    min_gap_between_duties_hours: 3,
                    supervisor_eligible: true,
                    cross_department_allowed: true,
                    priority_subjects: ['Calculus', 'Algebra'],
                    role_restrictions: {
                        supervisor: ['Senior Faculty', 'HOD'],
                        invigilator: ['All']
                    },
                    min_duties_weekly: 1,
                    max_duties_weekly: 6
                }
            ];

            setPolicies(mockPolicies);
            setSelectedPolicy(mockPolicies[0]);
        } catch (error) {
            console.error('Error loading policies:', error);
            setError(error instanceof Error ? error.message : 'Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePolicy = (field: keyof DepartmentPolicy, value: any) => {
        if (!selectedPolicy) return;

        const updated = { ...selectedPolicy, [field]: value };
        setSelectedPolicy(updated);

        // Update in list
        setPolicies(
            policies.map((p) =>
                p.department === selectedPolicy.department ? updated : p
            )
        );
    };

    const handleAddSubject = () => {
        if (!newSubject.trim() || !selectedPolicy) return;

        const updated = {
            ...selectedPolicy,
            priority_subjects: [...selectedPolicy.priority_subjects, newSubject.trim()]
        };
        setSelectedPolicy(updated);
        setPolicies(
            policies.map((p) =>
                p.department === selectedPolicy.department ? updated : p
            )
        );
        setNewSubject('');
    };

    const handleRemoveSubject = (subject: string) => {
        if (!selectedPolicy) return;

        const updated = {
            ...selectedPolicy,
            priority_subjects: selectedPolicy.priority_subjects.filter((s) => s !== subject)
        };
        setSelectedPolicy(updated);
        setPolicies(
            policies.map((p) =>
                p.department === selectedPolicy.department ? updated : p
            )
        );
    };

    const handleSavePolicies = async () => {
        try {
            setSaving(true);
            setError(null);

            // In production, save to backend
            // const response = await fetch(`/api/policies/${institution._id}`, {
            //   method: 'PUT',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ policies })
            // });

            // Simulate save delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log('Policies saved:', policies);
            onDone(true);
        } catch (error) {
            console.error('Error saving policies:', error);
            setError(error instanceof Error ? error.message : 'Failed to save policies');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        loadPolicies();
        setIsEditing(false);
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
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Department Policy Editor
                    </CardTitle>
                    <CardDescription>
                        Configure duty allocation constraints for each department
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Department List */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Departments</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {policies.map((policy) => (
                            <button
                                key={policy.department}
                                onClick={() => setSelectedPolicy(policy)}
                                className={`w-full text-left p-2 rounded border-2 transition-all ${selectedPolicy?.department === policy.department
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-medium text-sm">{policy.department}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Max {policy.max_duties_per_day} duties/day
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Policy Editor */}
                {selectedPolicy && (
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{selectedPolicy.department} Policy</CardTitle>
                                {!isEditing && (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        size="sm"
                                        variant="outline"
                                    >
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Max Duties Per Day */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Duties Per Day
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={selectedPolicy.max_duties_per_day}
                                        onChange={(e) =>
                                            handleUpdatePolicy('max_duties_per_day', parseInt(e.target.value))
                                        }
                                        className="w-full p-2 border rounded-lg"
                                    />
                                ) : (
                                    <div className="text-lg font-bold text-gray-900">
                                        {selectedPolicy.max_duties_per_day}
                                    </div>
                                )}
                            </div>

                            {/* Min Gap Between Duties */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Gap Between Duties (hours)
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        min="0.5"
                                        step="0.5"
                                        max="8"
                                        value={selectedPolicy.min_gap_between_duties_hours}
                                        onChange={(e) =>
                                            handleUpdatePolicy(
                                                'min_gap_between_duties_hours',
                                                parseFloat(e.target.value)
                                            )
                                        }
                                        className="w-full p-2 border rounded-lg"
                                    />
                                ) : (
                                    <div className="text-lg font-bold text-gray-900">
                                        {selectedPolicy.min_gap_between_duties_hours} hours
                                    </div>
                                )}
                            </div>

                            {/* Weekly Duty Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Min Duties/Week
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={selectedPolicy.min_duties_weekly}
                                            onChange={(e) =>
                                                handleUpdatePolicy('min_duties_weekly', parseInt(e.target.value))
                                            }
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-lg font-bold text-gray-900">
                                            {selectedPolicy.min_duties_weekly}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Duties/Week
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={selectedPolicy.max_duties_weekly}
                                            onChange={(e) =>
                                                handleUpdatePolicy('max_duties_weekly', parseInt(e.target.value))
                                            }
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-lg font-bold text-gray-900">
                                            {selectedPolicy.max_duties_weekly}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-2 p-3 bg-gray-50 rounded border">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPolicy.supervisor_eligible}
                                        onChange={(e) =>
                                            handleUpdatePolicy('supervisor_eligible', e.target.checked)
                                        }
                                        disabled={!isEditing}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Supervisor Eligible
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedPolicy.cross_department_allowed}
                                        onChange={(e) =>
                                            handleUpdatePolicy('cross_department_allowed', e.target.checked)
                                        }
                                        disabled={!isEditing}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Cross-Department Allocation Allowed
                                    </span>
                                </label>
                            </div>

                            {/* Priority Subjects */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Priority Subjects
                                </label>
                                <div className="flex gap-2 flex-wrap mb-3">
                                    {selectedPolicy.priority_subjects.map((subject) => (
                                        <Badge
                                            key={subject}
                                            variant="outline"
                                            className="flex items-center gap-1"
                                        >
                                            {subject}
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleRemoveSubject(subject)}
                                                    className="ml-1 text-red-600 hover:text-red-800"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                                {isEditing && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newSubject}
                                            onChange={(e) => setNewSubject(e.target.value)}
                                            placeholder="Add subject..."
                                            className="flex-1 p-2 border rounded-lg text-sm"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleAddSubject();
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleAddSubject}
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSavePolicies}
                                        disabled={saving}
                                        className="flex-1"
                                    >
                                        {saving ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-1" />
                                        )}
                                        {saving ? 'Saving...' : 'Save All Policies'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
