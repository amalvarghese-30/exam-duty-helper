// src/components/teacher/TeacherAvailability.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarDays } from 'lucide-react';

const API = "http://localhost:3000/api";

interface LeaveDate {
  _id: string;
  leave_date: string;
  reason: string;
}

export default function TeacherAvailability() {
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTeacherAndLeave = async () => {
      try {
        // Get teacher by email - Use the correct endpoint
        const teacherRes = await axios.get(`${API}/teacher/email/${user.email}`);
        const tid = teacherRes.data._id;
        setTeacherId(tid);

        // Also store in localStorage for other components
        localStorage.setItem('teacherId', tid);
        localStorage.setItem('userEmail', user.email);

        // Fetch leave dates
        const leaveRes = await axios.get(`${API}/teacher-leave/${tid}`);
        setLeaveDates(leaveRes.data);
      } catch (error: any) {
        console.error('Failed to fetch teacher data:', error);
        if (error.response?.status === 404) {
          console.log('Teacher profile not found for email:', user.email);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherAndLeave();
  }, [user]);

  const addLeave = async () => {
    if (!teacherId || !newDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      const response = await axios.post(`${API}/teacher-leave`, {
        teacher_id: teacherId,
        leave_date: newDate,
        reason: newReason,
      });

      setLeaveDates([...leaveDates, response.data]);
      setNewDate('');
      setNewReason('');
      toast.success('Leave date added');
    } catch (error: any) {
      console.error('Failed to add leave:', error);
      toast.error(error.response?.data?.error || 'Failed to add leave date');
    }
  };

  const removeLeave = async (id: string) => {
    try {
      await axios.delete(`${API}/teacher-leave/${id}`);
      setLeaveDates(leaveDates.filter(l => l._id !== id));
      toast.success('Leave date removed');
    } catch (error: any) {
      console.error('Failed to remove leave:', error);
      toast.error(error.response?.data?.error || 'Failed to remove leave date');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Add Leave Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label>Reason (optional)</Label>
              <Input
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder="Personal leave"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addLeave}>
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">My Leave Dates</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveDates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No leave dates registered.</p>
          ) : (
            <div className="space-y-2">
              {leaveDates.map(l => (
                <div key={l._id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(l.leave_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {l.reason && <p className="text-xs text-muted-foreground">{l.reason}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLeave(l._id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}