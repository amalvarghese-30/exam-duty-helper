import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { TeacherDashboardService } from '@/services/TeacherDashboardService';

interface Duty {
  exam_id: string;
  subject_name: string;
  date: string;
  time_from: string;
  time_to: string;
  room: string;
  duty_types: string[];
  status: string;
}

export default function TeacherDuties() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDuties = async () => {
      try {
        const response = await TeacherDashboardService.getTeacherDuties();
        if (response.success && response.data) {
          setDuties(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch duties:', error);
        // Don't show error toast - just set empty array
        setDuties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDuties();
  }, [user]);

  const statusColor = (s: string) => {
    if (s === 'Upcoming') return 'bg-primary/10 text-primary border-primary/20';
    if (s === 'Completed') return 'bg-success/10 text-success border-success/20';
    if (s === 'accepted') return 'bg-green-100 text-green-800';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <div className="py-8 text-center text-muted-foreground">Loading duties...</div>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in">
      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Duty Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No duties assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              duties.map((d, idx) => (
                <TableRow key={d.exam_id || idx}>
                  <TableCell className="font-medium">{d.subject_name || '—'}</TableCell>
                  <TableCell>{d.date ? new Date(d.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.time_from?.slice(0, 5)} – {d.time_to?.slice(0, 5)}
                  </TableCell>
                  <TableCell>{d.room || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {d.duty_types.map((type, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{type}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(d.status)}>{d.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}