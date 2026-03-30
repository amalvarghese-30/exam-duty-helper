import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    AlertTriangle,
    Loader2,
    CheckCircle2,
    UserCheck,
    Clock,
    AlertCircle
} from 'lucide-react';
import type { EmergencyReplacement } from '@/types/phase3-types';

interface EmergencyHandlerPanelProps {
    allocation: any;
    onReplacementApplied: () => void;
}

interface UnavailableTeacher {
    _id: string;
    name: string;
    email: string;
    department: string;
    unavailable_from: string;
    unavailable_to: string;
    duties_count: number;
    immediate_duties: Array<{ exam_name: string; date: string; time: string }>;
}

interface Replacement {
    duty_id: string;
    current_teacher: string;
    suggested_replacements: Array<{
        teacher_id: string;
        teacher_name: string;
        qualification_match: number;
        workload_delta: number;
        fairness_delta: number;
        availability: 'available' | 'constrained' | 'unavailable';
    }>;
}

export const EmergencyHandlerPanel: React.FC<EmergencyHandlerPanelProps> = ({
    allocation,
    onReplacementApplied
}) => {
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [unavailableTeachers, setUnavailableTeachers] = useState<UnavailableTeacher[]>([]);
    const [replacements, setReplacements] = useState<Replacement[]>([]);
    const [selectedReplacements, setSelectedReplacements] = useState<{
        [key: string]: string;
    }>({});

    // Load emergency data on mount
    useEffect(() => {
        loadEmergencyData();
    }, [allocation._id]);

    const loadEmergencyData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/phase3/emergency/scan?allocation_id=${allocation._id}`
            );

            if (!response.ok) {
                throw new Error('Failed to scan for emergencies');
            }

            const data = await response.json();

            if (data.success) {
                setUnavailableTeachers(data.data.unavailable_teachers || []);
                setReplacements(data.data.replacements || []);
                // Initialize selection with first suggestion for each
                const initial: { [key: string]: string } = {};
                (data.data.replacements || []).forEach((r: Replacement) => {
                    if (r.suggested_replacements.length > 0) {
                        initial[r.duty_id] = r.suggested_replacements[0].teacher_id;
                    }
                });
                setSelectedReplacements(initial);
            }
        } catch (error) {
            console.error('Failed to load emergency data:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to scan for emergencies'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleApplyReplacement = async (dutyId: string) => {
        const selectedTeacherId = selectedReplacements[dutyId];
        if (!selectedTeacherId) {
            setError('Please select a replacement teacher');
            return;
        }

        try {
            setApplying(true);
            setError(null);

            const response = await fetch(
                `/api/phase3/emergency/apply-replacement`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        allocation_id: allocation._id,
                        duty_id: dutyId,
                        replacement_teacher_id: selectedTeacherId,
                        reason: 'Emergency replacement due to teacher unavailability'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to apply replacement');
            }

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setReplacements((prev) => prev.filter((r) => r.duty_id !== dutyId));
                setTimeout(() => setSuccess(false), 3000);
                onReplacementApplied();
            } else {
                setError(data.error || 'Failed to apply replacement');
            }
        } catch (error) {
            console.error('Failed to apply replacement:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to apply replacement'
            );
        } finally {
            setApplying(false);
        }
    };

    const handleBatchApplyReplacements = async () => {
        const replacementList = Object.entries(selectedReplacements).map(
            ([dutyId, teacherId]) => ({
                duty_id: dutyId,
                replacement_teacher_id: teacherId
            })
        );

        if (replacementList.length === 0) {
            setError('No replacements selected');
            return;
        }

        try {
            setApplying(true);
            setError(null);

            const response = await fetch(
                `/api/phase3/emergency/batch-apply-replacements`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        allocation_id: allocation._id,
                        replacements: replacementList,
                        reason: 'Batch emergency replacements'
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to batch apply replacements');
            }

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setReplacements([]);
                setSelectedReplacements({});
                setTimeout(() => setSuccess(false), 3000);
                onReplacementApplied();
            } else {
                setError(data.error || 'Failed to batch apply replacements');
            }
        } catch (error) {
            console.error('Failed to batch apply replacements:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to batch apply replacements'
            );
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    if (unavailableTeachers.length === 0 && replacements.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <div className="text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-gray-600">No emergencies detected</p>
                        <p className="text-xs text-gray-500 mt-1">All teachers are available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Status Alert */}
            <Alert className="bg-orange-50 border-orange-200">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                    <strong>{unavailableTeachers.length}</strong> teacher(s) unavailable · <strong>{replacements.length}</strong> replacement(s) needed
                </AlertDescription>
            </Alert>

            {error && (
                <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Replacements applied successfully!
                    </AlertDescription>
                </Alert>
            )}

            {/* Unavailable Teachers List */}
            {unavailableTeachers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Unavailable Teachers</CardTitle>
                        <CardDescription>
                            Teachers who cannot fulfill their duties
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {unavailableTeachers.map((teacher) => (
                                <div
                                    key={teacher._id}
                                    className="p-3 border rounded-lg bg-orange-50 border-orange-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold text-sm">{teacher.name}</div>
                                            <div className="text-xs text-gray-600">
                                                {teacher.department} · {teacher.email}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Clock className="h-3.5 w-3.5 text-orange-600" />
                                                <span className="text-xs text-orange-700">
                                                    Unavailable{' '}
                                                    {new Date(teacher.unavailable_from).toLocaleDateString()} →{' '}
                                                    {new Date(teacher.unavailable_to).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-orange-100">
                                            {teacher.duties_count} duties
                                        </Badge>
                                    </div>

                                    {/* Affected Duties */}
                                    {teacher.immediate_duties.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-orange-200 space-y-1">
                                            {teacher.immediate_duties.map((duty, idx) => (
                                                <div key={idx} className="text-xs text-gray-600">
                                                    • {duty.exam_name} ({duty.date} at {duty.time})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Replacement Suggestions */}
            {replacements.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Replacement Suggestions</CardTitle>
                        <CardDescription>
                            Select replacement teachers for unavailable duties
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {replacements.map((replacement, idx) => (
                            <div key={replacement.duty_id} className="p-3 border rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold text-sm">
                                        Duty #{idx + 1}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                        Current: {replacement.current_teacher}
                                    </span>
                                </div>

                                {/* Replacement Options */}
                                <RadioGroup
                                    value={selectedReplacements[replacement.duty_id] || ''}
                                    onValueChange={(value) =>
                                        setSelectedReplacements((prev) => ({
                                            ...prev,
                                            [replacement.duty_id]: value
                                        }))
                                    }
                                >
                                    <div className="space-y-2">
                                        {replacement.suggested_replacements.map((suggestion) => (
                                            <div
                                                key={suggestion.teacher_id}
                                                className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded"
                                            >
                                                <RadioGroupItem
                                                    value={suggestion.teacher_id}
                                                    id={`${replacement.duty_id}-${suggestion.teacher_id}`}
                                                    className="mt-1"
                                                />
                                                <Label
                                                    htmlFor={`${replacement.duty_id}-${suggestion.teacher_id}`}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <div className="font-medium text-sm">
                                                        {suggestion.teacher_name}
                                                    </div>
                                                    <div className="text-xs text-gray-600 space-y-1 mt-1">
                                                        <div>
                                                            Qualification Match:{' '}
                                                            <span className="font-semibold">
                                                                {(suggestion.qualification_match * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div>
                                                            Workload Impact:{' '}
                                                            <span
                                                                className={
                                                                    suggestion.workload_delta > 0
                                                                        ? 'text-red-600'
                                                                        : 'text-green-600'
                                                                }
                                                            >
                                                                {suggestion.workload_delta > 0 ? '+' : ''}
                                                                {suggestion.workload_delta}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            Fairness Impact:{' '}
                                                            <span
                                                                className={
                                                                    suggestion.fairness_delta > 0
                                                                        ? 'text-green-600'
                                                                        : 'text-red-600'
                                                                }
                                                            >
                                                                {suggestion.fairness_delta > 0 ? '+' : ''}
                                                                {suggestion.fairness_delta}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Label>
                                                <Badge variant="outline" className="mt-1">
                                                    {suggestion.availability === 'available' && (
                                                        <span className="text-green-600">Available</span>
                                                    )}
                                                    {suggestion.availability === 'constrained' && (
                                                        <span className="text-yellow-600">Constrained</span>
                                                    )}
                                                    {suggestion.availability === 'unavailable' && (
                                                        <span className="text-red-600">Busy</span>
                                                    )}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>

                                {/* Individual Apply Button */}
                                <Button
                                    size="sm"
                                    onClick={() => handleApplyReplacement(replacement.duty_id)}
                                    disabled={
                                        !selectedReplacements[replacement.duty_id] || applying
                                    }
                                    className="w-full mt-2"
                                >
                                    {applying ? (
                                        <>
                                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                            Applying...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="mr-2 h-3.5 w-3.5" />
                                            Apply This Replacement
                                        </>
                                    )}
                                </Button>
                            </div>
                        ))}

                        {/* Batch Apply Button */}
                        {replacements.length > 1 && (
                            <div className="pt-4 border-t">
                                <Button
                                    onClick={handleBatchApplyReplacements}
                                    disabled={Object.keys(selectedReplacements).length === 0 || applying}
                                    className="w-full"
                                >
                                    {applying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Applying All...
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Apply All {replacements.length} Replacements
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default EmergencyHandlerPanel;
