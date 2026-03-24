import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Wand2, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';

const API = "http://localhost:5000";

interface Allocation {
  _id: string;
  teacher_id: string;
  exam_id: string;
  status: string;
  teacher?: { name: string; department: string };
  exam?: { subject: string; exam_date: string; start_time: string; end_time: string; room_number: string };
}

export default function DutyAllocation() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'calendar'>('table');

  const fetchAllocations = async () => {
    try {
      const res = await axios.get(`${API}/auto-allocate/`);
      setAllocations(res.data);
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
      toast.error('Failed to load allocations');
    }
  };

  useEffect(() => { fetchAllocations(); }, []);

  const runAllocation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auto-allocate/`);
      toast.success(response.data.message || `${response.data.allocated || 0} duties allocated successfully!`);
      fetchAllocations();
    } catch (err: any) {
      console.error('Allocation failed:', err);
      toast.error(err.response?.data?.error || 'Allocation failed');
    }
    setLoading(false);
  };

  const clearAllocations = async () => {
    try {
      await axios.delete(`${API}/auto-allocate/clear`);
      toast.success('All allocations cleared');
      fetchAllocations();
    } catch (err: any) {
      console.error('Failed to clear allocations:', err);
      toast.error(err.response?.data?.error || 'Failed to clear allocations');
    }
  };

  const statusColor = (s: string) => {
    if (s === 'assigned') return 'bg-primary/10 text-primary border-primary/20';
    if (s === 'accepted') return 'bg-success/10 text-success border-success/20';
    if (s === 'on_leave') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-muted text-muted-foreground';
  };

  // Calendar view
  const calendarData = allocations.reduce<Record<string, Allocation[]>>((acc, a) => {
    const date = a.exam?.exam_date || '';
    if (!acc[date]) acc[date] = [];
    acc[date].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button onClick={runAllocation} disabled={loading}>
            <Wand2 className="h-4 w-4 mr-2" />
            {loading ? 'Allocating...' : 'AI Auto-Allocate'}
          </Button>
          <Button variant="outline" onClick={clearAllocations}>
            <RefreshCw className="h-4 w-4 mr-2" /> Clear All
          </Button>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button variant={view === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setView('table')}>Table</Button>
          <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setView('calendar')}>
            <CalendarIcon className="h-4 w-4 mr-1" /> Calendar
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No allocations yet. Click "AI Auto-Allocate" to assign duties.
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map(a => (
                  <TableRow key={a._id}>
                    <TableCell className="font-medium">{a.teacher?.name || '—'}</TableCell>
                    <TableCell>{a.exam?.subject || '—'}</TableCell>
                    <TableCell>{a.exam?.exam_date ? new Date(a.exam.exam_date).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.exam?.start_time?.slice(0, 5)} – {a.exam?.end_time?.slice(0, 5)}
                    </TableCell>
                    <TableCell>{a.exam?.room_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(a.status)}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(calendarData).sort().map(([date, allocs]) => (
            <Card key={date} className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allocs.map(a => (
                  <div key={a._id} className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{a.exam?.subject}</p>
                      <p className="text-xs text-muted-foreground">{a.teacher?.name} • {a.exam?.room_number}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {a.exam?.start_time?.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {Object.keys(calendarData).length === 0 && (
            <Card className="col-span-full shadow-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                No allocations to display in calendar view.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}