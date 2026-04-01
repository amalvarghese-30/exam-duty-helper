import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DragDropTeacher {
    _id: string;
    name: string;
    department: string;
    duties_assigned: number;
    is_on_leave: boolean;
}

interface DragDropExam {
    _id: string;
    subject: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_number: string;
    assigned_teacher?: string;
    assigned_teacher_name?: string;
}

interface DragDropAllocationPanelProps {
    teachers: DragDropTeacher[];
    exams: DragDropExam[];
    institution: any;
    onSave?: (allocations: any[]) => Promise<void>;
}

export const DragDropAllocationPanel: React.FC<DragDropAllocationPanelProps> = ({
    teachers = [],
    exams = [],
    institution,
    onSave,
}) => {
    const [allocations, setAllocations] = useState<Map<string, string>>(
        new Map(exams.filter((e) => e.assigned_teacher).map((e) => [e._id, e.assigned_teacher!]))
    );
    const [draggedTeacher, setDraggedTeacher] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleTeacherDragStart = (e: React.DragEvent, teacherId: string) => {
        e.dataTransfer.effectAllowed = 'copy';
        setDraggedTeacher(teacherId);
        const teacher = teachers.find((t) => t._id === teacherId);
        if (teacher && teacher.is_on_leave) {
            e.dataTransfer.setData('warning', 'Teacher is on leave - drag anyway?');
        }
    };

    const handleExamDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
    };

    const handleExamDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    };

    const handleExamDrop = (e: React.DragEvent, examId: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');

        if (draggedTeacher) {
            const newAllocations = new Map(allocations);
            newAllocations.set(examId, draggedTeacher);
            setAllocations(newAllocations);
        }
        setDraggedTeacher(null);
    };

    const handleRemoveAssignment = (examId: string) => {
        const newAllocations = new Map(allocations);
        newAllocations.delete(examId);
        setAllocations(newAllocations);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            const allocationData = Array.from(allocations.entries()).map(([examId, teacherId]) => ({
                exam_id: examId,
                teacher_id: teacherId,
                institution_id: institution._id,
            }));

            if (onSave) {
                await onSave(allocationData);
            } else {
                // Fallback: call API directly
                const response = await fetch('/api/allocations/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        institution_id: institution._id,
                        manual_allocations: allocationData,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to save allocations');
                }
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error saving allocations');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setAllocations(
            new Map(exams.filter((e) => e.assigned_teacher).map((e) => [e._id, e.assigned_teacher!]))
        );
        setError(null);
        setSuccess(false);
    };

    // Calculate statistics
    const allocatedExams = allocations.size;
    const totalExams = exams.length;
    const unallocatedExams = totalExams - allocatedExams;

    // Get teacher duty counts with manual allocations
    const teacherDutyCounts = new Map<string, number>();
    teachers.forEach((t) => {
        teacherDutyCounts.set(t._id, t.duties_assigned);
    });
    allocations.forEach((teacherId) => {
        teacherDutyCounts.set(teacherId, (teacherDutyCounts.get(teacherId) || 0) + 1);
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle>Manual Duty Allocation</CardTitle>
                    <CardDescription>
                        Drag teachers to exams to create custom duty assignments
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Statistics */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-sm text-gray-600">Allocated</div>
                            <div className="text-2xl font-bold text-blue-600">{allocatedExams}</div>
                            <div className="text-xs text-gray-500">of {totalExams} exams</div>
                        </div>
                        <div className="text-center p-3 bg-amber-50 rounded">
                            <div className="text-sm text-gray-600">Unallocated</div>
                            <div className="text-2xl font-bold text-amber-600">{unallocatedExams}</div>
                            <div className="text-xs text-gray-500">pending assignment</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                            <div className="text-sm text-gray-600">Capacity</div>
                            <div className="text-2xl font-bold text-green-600">
                                {teachers.length}
                            </div>
                            <div className="text-xs text-gray-500">available teachers</div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={saving || allocatedExams === 0}
                                className="flex-1"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleReset}
                                disabled={saving}
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Messages */}
            {success && (
                <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        ✓ Allocations saved successfully
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
            )}

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Teachers Column */}
                <Card>
                    <CardHeader>
                        <CardTitle>Teachers (Drag Source)</CardTitle>
                        <CardDescription>
                            Drag a teacher to an exam below to assign the duty
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {teachers.map((teacher) => {
                                const dutyCount = teacherDutyCounts.get(teacher._id) || 0;
                                return (
                                    <div
                                        key={teacher._id}
                                        draggable
                                        onDragStart={(e) => handleTeacherDragStart(e, teacher._id)}
                                        className={`p-3 rounded border-2 cursor-move transition-all ${draggedTeacher === teacher._id
                                                ? 'border-blue-500 bg-blue-50 opacity-75'
                                                : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-md'
                                            } ${teacher.is_on_leave ? 'opacity-50' : ''}`}
                                    >
                                        <div className="font-semibold text-sm">{teacher.name}</div>
                                        <div className="text-xs text-gray-600">
                                            {teacher.department}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                                {dutyCount} duties
                                            </Badge>
                                            {teacher.is_on_leave && (
                                                <Badge variant="destructive" className="text-xs">
                                                    On Leave
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Exams Column */}
                <Card>
                    <CardHeader>
                        <CardTitle>Exams (Drop Target)</CardTitle>
                        <CardDescription>
                            Drop a teacher here to assign them to the exam
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {exams.map((exam) => {
                                const assignedTeacherId = allocations.get(exam._id);
                                const assignedTeacher = teachers.find((t) => t._id === assignedTeacherId);

                                return (
                                    <div
                                        key={exam._id}
                                        onDragOver={handleExamDragOver}
                                        onDragLeave={handleExamDragLeave}
                                        onDrop={(e) => handleExamDrop(e, exam._id)}
                                        className={`p-3 rounded border-2 border-dashed transition-all ${assignedTeacher
                                                ? 'border-green-300 bg-green-50'
                                                : 'border-gray-300 bg-white hover:border-blue-400'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm">{exam.subject}</div>
                                        <div className="text-xs text-gray-600 mb-2">
                                            {exam.exam_date} • {exam.start_time}-{exam.end_time} •
                                            Room {exam.room_number}
                                        </div>
                                        {assignedTeacher ? (
                                            <div className="flex items-center justify-between">
                                                <Badge className="bg-green-600 text-white text-xs">
                                                    ✓ {assignedTeacher.name}
                                                </Badge>
                                                <button
                                                    onClick={() => handleRemoveAssignment(exam._id)}
                                                    className="text-xs text-gray-500 hover:text-red-600 underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400 italic">
                                                Drop teacher here
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
