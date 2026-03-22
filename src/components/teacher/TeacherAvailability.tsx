import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, CalendarDays } from 'lucide-react';

interface LeaveDate {
  id: string;
  leave_date: string;
  reason: string;
}

export default function TeacherAvailability() {
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [leaveDates, setLeaveDates] = useState<LeaveDate[]>([]);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      setTeacherId(teacher.id);

      const { data } = await supabase.from('teacher_leave_dates').select('*').eq('teacher_id', teacher.id).order('leave_date');
      if (data) setLeaveDates(data);
    };
    fetch();
  }, [user]);

  const addLeave = async () => {
    if (!teacherId || !newDate) {
      toast.error('Please select a date');
      return;
    }
    const { error } = await supabase.from('teacher_leave_dates').insert({
      teacher_id: teacherId,
      leave_date: newDate,
      reason: newReason,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Leave date added');
    setNewDate('');
    setNewReason('');
    // Refetch
    const { data } = await supabase.from('teacher_leave_dates').select('*').eq('teacher_id', teacherId).order('leave_date');
    if (data) setLeaveDates(data);
  };

  const removeLeave = async (id: string) => {
    const { error } = await supabase.from('teacher_leave_dates').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    setLeaveDates(leaveDates.filter(l => l.id !== id));
    toast.success('Leave date removed');
  };

  if (!teacherId) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Your teacher profile is not linked yet. Please contact the Exam Cell.
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
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <Label>Reason (optional)</Label>
              <Input value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Personal leave" />
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
                <div key={l.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(l.leave_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {l.reason && <p className="text-xs text-muted-foreground">{l.reason}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLeave(l.id)} className="text-destructive hover:text-destructive">
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
