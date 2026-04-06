import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface DutyRow {
  _id: string;
  status: string;
  exam: {
    subject: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_number: string;
  } | null;
}

export default function TeacherDuties() {
  const { user } = useAuth();
  const [duties, setDuties] = useState<DutyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchDuties = async () => {
      try {
        // 1. Get teacher by email (Removed /api)
        const teacherRes = await axios.get(`${API}/teachers/email/${user.email}`);
        const teacherData = teacherRes.data;

        // 2. Fetch all allocations from the correct endpoint
        // Based on your server.js, allocations are likely here:
        const dutiesRes = await axios.get(`${API}/auto-allocate`);

        // 3. Filter the allocations for THIS specific teacher
        // We check both the teacher object and the email for safety
        const myDuties = dutiesRes.data.filter((d: any) => 
          d.teacher_id === teacherData._id || 
          d.teacher?.email === user.email ||
          d.teacher === user.email // Depending on how your scheduler saves it
        );

        setDuties(myDuties);
      } catch (error) {
        console.error('Failed to fetch duties:', error);
        toast.error('Failed to load your duties');
      } finally {
        setLoading(false);
      }
    };
    fetchDuties();
  }, [user]);

  const statusColor = (s: string) => {
    if (s === 'assigned') return 'bg-primary/10 text-primary border-primary/20';
    if (s === 'accepted') return 'bg-success/10 text-success border-success/20';
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
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {duties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No duties assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              duties.map(d => (
                <TableRow key={d._id}>
                  <TableCell className="font-medium">{d.exam?.subject || '—'}</TableCell>
                  <TableCell>{d.exam?.exam_date ? new Date(d.exam.exam_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.exam?.start_time?.slice(0, 5)} – {d.exam?.end_time?.slice(0, 5)}
                  </TableCell>
                  <TableCell>{d.exam?.room_number}</TableCell>
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