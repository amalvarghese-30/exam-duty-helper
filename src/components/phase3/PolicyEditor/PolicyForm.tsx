import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DepartmentPolicy } from '@/types/phase3-types';

interface PolicyEditorPanelProps {
    institution: any;
    onSave: () => void;
}

export const PolicyEditorPanel: React.FC<PolicyEditorPanelProps> = ({
    institution,
    onSave
}) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedDept, setSelectedDept] = useState<string>('');
    const [policies, setPolicies] = useState<Partial<DepartmentPolicy> | null>(null);

    const [formData, setFormData] = useState({
        max_daily_duties: 3,
        max_weekly_duties: 10,
        min_gap_hours: 2,
        cross_department_eligible: true,
        seniority_multiplier: 1.2
    });

    // Load policies when department is selected
    useEffect(() => {
        if (selectedDept) {
            loadPolicies(selectedDept);
        }
    }, [selectedDept]);

    const loadPolicies = async (deptId: string) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/phase3/policies/${deptId}`);

            if (!response.ok) {
                throw new Error('Failed to load policies');
            }

            const data = await response.json();

            if (data.success) {
                setPolicies(data.data);
                setFormData({
                    max_daily_duties: data.data.max_daily_duties || 3,
                    max_weekly_duties: data.data.max_weekly_duties || 10,
                    min_gap_hours: data.data.min_gap_hours || 2,
                    cross_department_eligible: data.data.cross_department_eligible !== false,
                    seniority_multiplier: data.data.seniority_multiplier || 1.2
                });
            }
        } catch (error) {
            console.error('Failed to load policies:', error);
            setError(error instanceof Error ? error.message : 'Failed to load policies');
            // Use defaults
            setFormData({
                max_daily_duties: 3,
                max_weekly_duties: 10,
                min_gap_hours: 2,
                cross_department_eligible: true,
                seniority_multiplier: 1.2
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedDept) {
            setError('Please select a department');
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const response = await fetch(
                `/api/phase3/policies/${selectedDept}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save policies');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            onSave();
        } catch (error) {
            console.error('Failed to save policies:', error);
            setError(error instanceof Error ? error.message : 'Failed to save policies');
        } finally {
            setSaving(false);
        }
    };

    // Mock departments - in production, fetch from institution
    const departments = [
        { id: 'cs', name: 'Computer Science', abbr: 'CS' },
        { id: 'math', name: 'Mathematics', abbr: 'MATH' },
        { id: 'science', name: 'Science', abbr: 'SCIENCE' },
        { id: 'english', name: 'English', abbr: 'ENG' }
    ];

    return (
        <div className="space-y-4">
            {/* Department Selector */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Select Department</CardTitle>
                    <CardDescription>Choose which department's policies to configure</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                        {departments.map((dept) => (
                            <Button
                                key={dept.id}
                                variant={selectedDept === dept.id ? 'default' : 'outline'}
                                onClick={() => setSelectedDept(dept.id)}
                                className="w-full justify-start"
                            >
                                <div>
                                    <div className="font-semibold">{dept.name}</div>
                                    <div className="text-xs opacity-75">{dept.abbr}</div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Alerts */}
            {error && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">Policies saved successfully!</AlertDescription>
                </Alert>
            )}

            {selectedDept && !loading && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Policy Configuration</CardTitle>
                        <CardDescription>
                            Set constraints for {departments.find((d) => d.id === selectedDept)?.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Max Daily Duties */}
                        <div>
                            <Label htmlFor="max_daily" className="text-sm font-medium">
                                Max Duties per Day
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    id="max_daily"
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={formData.max_daily_duties}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            max_daily_duties: parseInt(e.target.value) || 1
                                        })
                                    }
                                    className="flex-1"
                                />
                                <Badge variant="outline">Current: {formData.max_daily_duties}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                Teachers cannot have more than this many duties on a single day
                            </p>
                        </div>

                        {/* Max Weekly Duties */}
                        <div>
                            <Label htmlFor="max_weekly" className="text-sm font-medium">
                                Max Duties per Week
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    id="max_weekly"
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.max_weekly_duties}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            max_weekly_duties: parseInt(e.target.value) || 1
                                        })
                                    }
                                    className="flex-1"
                                />
                                <Badge variant="outline">Current: {formData.max_weekly_duties}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                Teachers cannot exceed this many duties in a calendar week
                            </p>
                        </div>

                        {/* Min Gap Between Duties */}
                        <div>
                            <Label htmlFor="min_gap" className="text-sm font-medium">
                                Min Gap Between Duties (hours)
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    id="min_gap"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.min_gap_hours}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            min_gap_hours: parseFloat(e.target.value) || 0
                                        })
                                    }
                                    className="flex-1"
                                />
                                <Badge variant="outline">Current: {formData.min_gap_hours}h</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                Minimum hours between two consecutive duties for the same teacher
                            </p>
                        </div>

                        {/* Seniority Multiplier */}
                        <div>
                            <Label htmlFor="seniority" className="text-sm font-medium">
                                Seniority Workload Multiplier
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    id="seniority"
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    value={formData.seniority_multiplier}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            seniority_multiplier: parseFloat(e.target.value) || 1.0
                                        })
                                    }
                                    className="flex-1"
                                />
                                <Badge variant="outline">x{formData.seniority_multiplier.toFixed(1)}</Badge>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                Senior teachers get this multiplier of duties (e.g., 1.2x = 20% more)
                            </p>
                        </div>

                        {/* Cross Department Eligible */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                            <input
                                type="checkbox"
                                id="cross_dept"
                                checked={formData.cross_department_eligible}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        cross_department_eligible: e.target.checked
                                    })
                                }
                                className="w-4 h-4"
                            />
                            <div>
                                <Label htmlFor="cross_dept" className="font-medium cursor-pointer">
                                    Allow Cross-Department Assignments
                                </Label>
                                <p className="text-xs text-gray-600 mt-1">
                                    Teachers from this department can be assigned exams from other departments
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                            <Button
                                onClick={handleSave}
                                disabled={saving || loading}
                                className="flex-1"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Policies
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedDept('')}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {selectedDept && loading && (
                <Card>
                    <CardContent className="flex items-center justify-center h-20">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PolicyEditorPanel;
