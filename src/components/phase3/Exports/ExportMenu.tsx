import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    Download,
    AlertCircle,
    CheckCircle2,
    FileSpreadsheet,
    FileText,
    Calendar
} from 'lucide-react';

interface ExportPanelProps {
    allocation: any;
    onExportStarted?: () => void;
    onExportCompleted?: () => void;
}

interface ExportOptions {
    include_teacher_assignments: boolean;
    include_exam_details: boolean;
    include_statistics: boolean;
    include_fairness_report: boolean;
    excel: boolean;
    pdf: boolean;
    ics: boolean;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
    allocation,
    onExportStarted,
    onExportCompleted
}) => {
    const [exporting, setExporting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [options, setOptions] = useState<ExportOptions>({
        include_teacher_assignments: true,
        include_exam_details: true,
        include_statistics: true,
        include_fairness_report: true,
        excel: true,
        pdf: false,
        ics: false
    });

    const handleExport = async (format: 'excel' | 'pdf' | 'ics') => {
        try {
            setExporting(format);
            setError(null);
            setSuccess(false);
            onExportStarted?.();

            const endpoint = `/api/phase3/exports/${format}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    allocation_id: allocation._id,
                    options,
                    format
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to export as ${format.toUpperCase()}`);
            }

            // Get filename from Content-Disposition header or generate one
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `allocation-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : format === 'excel' ? 'xlsx' : 'ics'}`;

            if (contentDisposition) {
                const matches = contentDisposition.match(/filename="?(.+)"?/);
                if (matches && matches[1]) {
                    filename = matches[1];
                }
            }

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
            onExportCompleted?.();
        } catch (error) {
            console.error(`Failed to export as ${format}:`, error);
            setError(
                error instanceof Error
                    ? error.message
                    : `Failed to export as ${format.toUpperCase()}`
            );
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">What to Include</CardTitle>
                    <CardDescription>
                        Select which data to include in exports
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="include_assignments"
                            checked={options.include_teacher_assignments}
                            onCheckedChange={(checked) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    include_teacher_assignments: checked === true
                                }))
                            }
                        />
                        <Label htmlFor="include_assignments" className="cursor-pointer">
                            <div className="font-medium text-sm">Teacher Assignments</div>
                            <div className="text-xs text-gray-600">
                                Which exams each teacher is assigned to
                            </div>
                        </Label>
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="include_exam_details"
                            checked={options.include_exam_details}
                            onCheckedChange={(checked) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    include_exam_details: checked === true
                                }))
                            }
                        />
                        <Label htmlFor="include_exam_details" className="cursor-pointer">
                            <div className="font-medium text-sm">Exam Details</div>
                            <div className="text-xs text-gray-600">
                                Date, time, duration, and venue information
                            </div>
                        </Label>
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="include_stats"
                            checked={options.include_statistics}
                            onCheckedChange={(checked) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    include_statistics: checked === true
                                }))
                            }
                        />
                        <Label htmlFor="include_stats" className="cursor-pointer">
                            <div className="font-medium text-sm">Statistics</div>
                            <div className="text-xs text-gray-600">
                                Workload distribution and allocation metrics
                            </div>
                        </Label>
                    </div>

                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="include_fairness"
                            checked={options.include_fairness_report}
                            onCheckedChange={(checked) =>
                                setOptions((prev) => ({
                                    ...prev,
                                    include_fairness_report: checked === true
                                }))
                            }
                        />
                        <Label htmlFor="include_fairness" className="cursor-pointer">
                            <div className="font-medium text-sm">Fairness Report</div>
                            <div className="text-xs text-gray-600">
                                Comprehensive fairness analysis and recommendations
                            </div>
                        </Label>
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
                    <AlertDescription className="text-green-800">
                        Export completed successfully!
                    </AlertDescription>
                </Alert>
            )}

            {/* Excel Export */}
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                        Export as Excel Spreadsheet
                    </CardTitle>
                    <CardDescription>
                        Download allocation data in .xlsx format
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">
                        Create a detailed Excel file with multiple sheets for different data views.
                        Perfect for analysis, sharing with stakeholders, or archival.
                    </p>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-600">Includes:</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                            <li>✓ Teacher-Exam assignments with dates/times</li>
                            <li>✓ Department workload summary</li>
                            <li>✓ Allocation statistics and metrics</li>
                            <li>✓ Fairness score breakdown</li>
                            <li>✓ Conflict resolution log (if applicable)</li>
                        </ul>
                    </div>
                    <Button
                        onClick={() => handleExport('excel')}
                        disabled={exporting === 'excel'}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {exporting === 'excel' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Excel...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Excel (.xlsx)
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* PDF Export */}
            <Card className="border-red-200 bg-red-50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-600" />
                        Export as PDF Report
                    </CardTitle>
                    <CardDescription>
                        Download allocation data in PDF format
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">
                        Create a professional PDF report suitable for printing and distribution.
                        Includes formatted tables, charts, and summary sections.
                    </p>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-600">Includes:</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                            <li>✓ Executive summary with allocation overview</li>
                            <li>✓ Formatted assignment tables by department</li>
                            <li>✓ Visualization of fairness metrics</li>
                            <li>✓ Workload distribution charts</li>
                            <li>✓ Compliance verification section</li>
                        </ul>
                    </div>
                    <Button
                        onClick={() => handleExport('pdf')}
                        disabled={exporting === 'pdf'}
                        className="w-full bg-red-600 hover:bg-red-700"
                    >
                        {exporting === 'pdf' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating PDF...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF Report
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* iCalendar Export */}
            <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        Export as Calendar (.ics)
                    </CardTitle>
                    <CardDescription>
                        Add exam duties to calendar applications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">
                        Download as iCalendar format (.ics) to import duty schedules into Outlook,
                        Google Calendar, Apple Calendar, or other calendar applications.
                    </p>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-600">Each duty includes:</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                            <li>✓ Exam name and course code</li>
                            <li>✓ Date, time, and duration</li>
                            <li>✓ Venue/location information</li>
                            <li>✓ Event notification reminders</li>
                            <li>✓ Invigilator duties description</li>
                        </ul>
                    </div>
                    <Button
                        onClick={() => handleExport('ics')}
                        disabled={exporting === 'ics'}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        {exporting === 'ics' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Calendar...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Calendar (.ics)
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-gray-600 mt-2">
                        💡 <strong>Tip:</strong> Import this file into your calendar app to get
                        notifications for each duty
                    </p>
                </CardContent>
            </Card>

            {/* Info Section */}
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="text-sm">Export Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-gray-600">
                    <p>
                        <strong>File Size:</strong> Excel files typically range from 50-200 KB,
                        PDF reports 100-300 KB, and ICS files under 50 KB.
                    </p>
                    <p>
                        <strong>Frequency:</strong> You can export updated allocations at any time.
                        Each export includes the current state of the allocation.
                    </p>
                    <p>
                        <strong>Privacy:</strong> All exports are generated on-demand and contain
                        only the data selected above.
                    </p>
                    <p>
                        <strong>Compatibility:</strong> Excel files work with Microsoft Office,
                        Google Sheets, and LibreOffice. PDFs are universal. ICS works with all
                        major calendar applications.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default ExportPanel;
