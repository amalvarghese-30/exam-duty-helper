import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Edit3, Lock, Unlock, CheckCircle2, XCircle, Clock, User } from 'lucide-react';

interface AuditEntry {
    _id: string;
    user_name: string;
    user_email?: string;
    action: string;
    resource_type: string;
    resource_id: string;
    changes?: {
        before: Record<string, any>;
        after: Record<string, any>;
    };
    context?: string;
    createdAt: string;
    status?: string;
}

interface AuditTrailViewerProps {
    allocation: any;
    institution: any;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
    allocation,
    institution
}) => {
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
    const [filterType, setFilterType] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadAuditTrail();
    }, [allocation, institution]);

    useEffect(() => {
        filterEntries();
    }, [filterType, entries]);

    const loadAuditTrail = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch audit history for this allocation
            const response = await fetch(
                `/api/allocations/${allocation._id || allocation.id}/audit-history`
            );

            if (!response.ok) {
                if (response.status === 404) {
                    setEntries([]);
                    return;
                }
                throw new Error('Failed to load audit trail');
            }

            const data = await response.json();
            setEntries(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error('Error loading audit trail:', error);
            // Don't show error if it's 404 (no history yet)
            if (!(error instanceof Error && error.message.includes('404'))) {
                setError(error instanceof Error ? error.message : 'Failed to load audit trail');
            }
        } finally {
            setLoading(false);
        }
    };

    const filterEntries = () => {
        if (filterType === 'all') {
            setFilteredEntries(entries);
        } else {
            setFilteredEntries(entries.filter((e) => e.action === filterType));
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'allocation_locked':
            case 'allocation_lock':
                return <Lock className="h-4 w-4 text-orange-600" />;
            case 'allocation_unlocked':
            case 'allocation_unlock':
                return <Unlock className="h-4 w-4 text-blue-600" />;
            case 'allocation_updated':
            case 'allocation_approved':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'allocation_rejected':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Edit3 className="h-4 w-4 text-gray-600" />;
        }
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            allocation_locked: '🔒 Locked',
            allocation_lock: '🔒 Locked',
            allocation_unlocked: '🔓 Unlocked',
            allocation_unlock: '🔓 Unlocked',
            allocation_updated: '✏️ Updated',
            allocation_approved: '✅ Approved',
            allocation_rejected: '❌ Rejected',
            allocation_created: '➕ Created',
            swap_requested: '🔄 Swap Requested',
            swap_approved: '✅ Swap Approved',
            swap_rejected: '❌ Swap Rejected'
        };
        return labels[action] || action;
    };

    const getActionColor = (action: string) => {
        if (action.includes('lock')) return 'bg-orange-50 border-orange-200';
        if (action.includes('unlock')) return 'bg-blue-50 border-blue-200';
        if (action.includes('approved') || action.includes('created')) return 'bg-green-50 border-green-200';
        if (action.includes('rejected')) return 'bg-red-50 border-red-200';
        return 'bg-gray-50 border-gray-200';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
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

    const uniqueActions = ['all', ...new Set(entries.map((e) => e.action))];

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle>Allocation History</CardTitle>
                    <CardDescription>
                        Complete audit trail of all changes to this allocation
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

            {/* Filters */}
            {entries.length > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-2 flex-wrap">
                            {uniqueActions.map((action) => (
                                <button
                                    key={action}
                                    onClick={() => setFilterType(action)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterType === action
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {action === 'all' ? 'All Actions' : getActionLabel(action)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Showing {filteredEntries.length} of {entries.length} entries
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Timeline */}
            {filteredEntries.length > 0 ? (
                <div className="space-y-3">
                    {filteredEntries.map((entry, idx) => (
                        <Card
                            key={entry._id}
                            className={`border-2 cursor-pointer transition-all hover:shadow-md ${getActionColor(entry.action)}`}
                            onClick={() => setExpandedId(expandedId === entry._id ? null : entry._id)}
                        >
                            <CardContent className="pt-6">
                                {/* Timeline Header */}
                                <div className="flex items-start gap-4 mb-3">
                                    {/* Timeline Dot */}
                                    <div className="flex flex-col items-center">
                                        <div className="h-3 w-3 rounded-full bg-current mt-1" />
                                        {idx < filteredEntries.length - 1 && (
                                            <div className="w-0.5 h-12 bg-gray-300 mt-1" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(entry.action)}
                                                <span className="font-semibold text-gray-900">
                                                    {getActionLabel(entry.action)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(entry.createdAt)}
                                            </span>
                                        </div>

                                        {/* User Info */}
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                                            <User className="h-3 w-3" />
                                            <span>{entry.user_name || 'System'}</span>
                                            {entry.user_email && <span className="text-gray-400">({entry.user_email})</span>}
                                        </div>

                                        {/* Additional Context */}
                                        {entry.context && (
                                            <p className="text-xs text-gray-700 mt-2 p-2 bg-white rounded border border-gray-200">
                                                {entry.context}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Detailed Changes (Expandable) */}
                                {expandedId === entry._id && entry.changes && (
                                    <div className="mt-4 pt-4 border-t space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Before */}
                                            <div>
                                                <h5 className="font-medium text-xs text-gray-700 mb-2 uppercase">Before</h5>
                                                <div className="bg-red-50 p-3 rounded text-xs font-mono text-gray-700 border border-red-200 max-h-32 overflow-y-auto">
                                                    {Object.entries(entry.changes.before || {}).map(([key, value]) => (
                                                        <div key={key} className="break-words">
                                                            <span className="text-red-700">{key}:</span> {JSON.stringify(value)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* After */}
                                            <div>
                                                <h5 className="font-medium text-xs text-gray-700 mb-2 uppercase">After</h5>
                                                <div className="bg-green-50 p-3 rounded text-xs font-mono text-gray-700 border border-green-200 max-h-32 overflow-y-auto">
                                                    {Object.entries(entry.changes.after || {}).map(([key, value]) => (
                                                        <div key={key} className="break-words">
                                                            <span className="text-green-700">{key}:</span> {JSON.stringify(value)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No allocation changes recorded yet</p>
                        <p className="text-xs text-gray-500 mt-2">Changes will appear here once the allocation is modified</p>
                    </CardContent>
                </Card>
            )}

            {/* Refresh Button */}
            <div className="text-center">
                <button
                    onClick={loadAuditTrail}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                    ↻ Refresh History
                </button>
            </div>
        </div>
    );
};
