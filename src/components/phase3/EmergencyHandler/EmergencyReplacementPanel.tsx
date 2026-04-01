import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, User, Clock, MapPin, BookOpen } from 'lucide-react';

interface ReplacementSuggestion {
    teacher: { id: string; name: string; department: string };
    match_score: number;
    reason: string;
    availability: boolean;
}

interface EmergencyReplacementProps {
    allocation: any;
    exam: any;
    currentTeacher: any;
    institution: any;
    onApply: () => void;
    onClose: () => void;
}

export const EmergencyReplacementPanel: React.FC<EmergencyReplacementProps> = ({
    allocation,
    exam,
    currentTeacher,
    institution,
    onApply,
    onClose
}) => {
    const [loading, setLoading] = useState(false);
    const [replacements, setReplacements] = useState<ReplacementSuggestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedReplacement, setSelectedReplacement] = useState<string | null>(null);
    const [applying, setApplying] = useState(false);
    const [reason, setReason] = useState('');

    // Simulate fetching replacement suggestions
    // In real implementation, call your /api/allocations/reschedule/teacher endpoint
    const loadReplacements = async () => {
        try {
            setLoading(true);
            setError(null);

            // Mock replacements - in production, fetch from backend
            const mockReplacements: ReplacementSuggestion[] = [
                {
                    teacher: { id: 't1', name: 'Dr. Rajesh Rao', department: 'Computer Science' },
                    match_score: 95,
                    reason: 'Lowest workload in department, available for session',
                    availability: true
                },
                {
                    teacher: { id: 't2', name: 'Dr. Priya Mehta', department: 'Computer Science' },
                    match_score: 87,
                    reason: 'Matches supervisor requirements, available',
                    availability: true
                },
                {
                    teacher: { id: 't3', name: 'Dr. Vikram Singh', department: 'Computer Science' },
                    match_score: 78,
                    reason: 'Experienced invigilator, slightly higher workload',
                    availability: true
                }
            ];

            setReplacements(mockReplacements);
        } catch (error) {
            console.error('Error loading replacements:', error);
            setError(error instanceof Error ? error.message : 'Failed to load replacement suggestions');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyReplacement = async () => {
        if (!selectedReplacement || !reason.trim()) {
            setError('Please select a replacement and provide a reason');
            return;
        }

        try {
            setApplying(true);
            setError(null);

            // Call the incremental rescheduler endpoint
            const response = await fetch('/api/allocations/reschedule/teacher', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institution_id: institution._id || institution.id,
                    teacher_id: selectedReplacement,
                    change_reason: reason
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to apply replacement');
            }

            // Show success and call callback
            onApply();
        } catch (error) {
            console.error('Error applying replacement:', error);
            setError(error instanceof Error ? error.message : 'Failed to apply replacement');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
                <CardHeader className="sticky top-0 bg-white border-b">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                                Emergency Teacher Replacement
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Find quick replacement for {currentTeacher?.name || 'Teacher'}
                                {exam ? ` - ${exam.subject}` : ''}
                            </CardDescription>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                        >
                            ✕
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                    {/* Current Assignment Info */}
                    {exam && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <div className="font-medium mb-1">{exam.subject}</div>
                                <div className="text-sm">
                                    📅 {exam.date} | ⏰ {exam.start_time} | 🏫 {exam.room || 'TBA'}
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Replacement Reason Input */}
                    <div className="space-y-2">
                        <label className="block font-medium text-sm text-gray-700">
                            Reason for Replacement *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Emergency absence, Medical leave, Unavailable..."
                            className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                        />
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Load Suggestions Button */}
                    {replacements.length === 0 && !loading && (
                        <Button
                            onClick={loadReplacements}
                            className="w-full"
                            size="lg"
                        >
                            Load Replacement Suggestions
                        </Button>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Finding best matches...</span>
                        </div>
                    )}

                    {/* Replacement Suggestions */}
                    {replacements.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-gray-700">Suggested Replacements</h4>
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                                {replacements.map((replacement) => (
                                    <div
                                        key={replacement.teacher.id}
                                        onClick={() => setSelectedReplacement(replacement.teacher.id)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedReplacement === replacement.teacher.id
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-3">
                                                <User className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-900">{replacement.teacher.name}</p>
                                                    <p className="text-xs text-gray-600 mt-1">{replacement.teacher.department}</p>
                                                </div>
                                            </div>
                                            <Badge className={
                                                replacement.match_score >= 90
                                                    ? 'bg-green-600'
                                                    : replacement.match_score >= 80
                                                        ? 'bg-blue-600'
                                                        : 'bg-gray-600'
                                            }>
                                                {replacement.match_score}% match
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                            {replacement.reason}
                                        </p>

                                        {replacement.availability && (
                                            <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Available for this session
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApplyReplacement}
                            disabled={!selectedReplacement || !reason.trim() || applying}
                            className="flex-1 gap-2"
                        >
                            {applying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            {applying ? 'Applying...' : 'Apply Replacement'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
