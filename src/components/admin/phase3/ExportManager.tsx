import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import ExportService from '@/services/phase3/ExportService';
import { AlertCircle, FileText, Download, Eye } from 'lucide-react';

interface ExportManagerProps {
    allocationId: string;
}

interface ExportOption {
    id: string;
    type: 'excel' | 'pdf' | 'ics';
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const exportOptions: ExportOption[] = [
    {
        id: 'excel',
        type: 'excel',
        icon: <FileText className="w-6 h-6" />,
        title: 'Excel Export',
        description: 'Download allocation as spreadsheet',
        color: 'bg-green-50'
    },
    {
        id: 'pdf',
        type: 'pdf',
        icon: <FileText className="w-6 h-6" />,
        title: 'PDF Report',
        description: 'Generate comprehensive PDF report',
        color: 'bg-red-50'
    },
    {
        id: 'ics',
        type: 'ics',
        icon: <FileText className="w-6 h-6" />,
        title: 'Calendar (ICS)',
        description: 'Import to calendar application',
        color: 'bg-blue-50'
    }
];

export const ExportManager: React.FC<ExportManagerProps> = ({ allocationId }) => {
    const [exporting, setExporting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleExport = async (exportType: 'excel' | 'pdf' | 'ics') => {
        setExporting(exportType);
        setError(null);
        setSuccess(null);

        let result;
        const request = { allocation_id: allocationId };

        switch (exportType) {
            case 'excel':
                result = await ExportService.exportToExcel(request);
                break;
            case 'pdf':
                result = await ExportService.exportToPDF(request);
                break;
            case 'ics':
                result = await ExportService.exportToICS(request);
                break;
        }

        if (result.success) {
            setSuccess(`${exportType.toUpperCase()} export generated successfully!`);
            // Optionally trigger download
            if (result.data?.data?.download_url) {
                window.open(result.data.data.download_url, '_blank');
            }
        } else {
            setError(result.error || `Failed to export as ${exportType}`);
        }

        setExporting(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold">Export Allocation</h3>
                <p className="text-gray-600">Download allocation data in various formats</p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exportOptions.map((option) => (
                    <Card key={option.id} className={option.color}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {option.icon}
                                        {option.title}
                                    </CardTitle>
                                    <CardDescription>{option.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => handleExport(option.type)}
                                disabled={exporting !== null}
                                className="w-full"
                                variant={exporting === option.type ? 'default' : 'outline'}
                            >
                                {exporting === option.type ? (
                                    <>
                                        <div className="animate-spin mr-2 w-4 h-4 border-2 border-current border-r-transparent rounded-full" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                            <span className="text-sm">Include fairness report</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                            <span className="text-sm">Include statistics</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                            <span className="text-sm">Include teacher details</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4" />
                            <span className="text-sm">Include compliance information</span>
                        </label>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ExportManager;
