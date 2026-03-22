import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';

interface Exam {
  id: string;
  subject: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number: string;
  required_invigilators: number;
}

export default function ExamScheduleManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [form, setForm] = useState({
    subject: '', exam_date: '', start_time: '', end_time: '', room_number: '', required_invigilators: 1
  });

  const fetchExams = async () => {
    const { data } = await supabase.from('exam_schedules').select('*').order('exam_date');
    if (data) setExams(data);
  };

  useEffect(() => { fetchExams(); }, []);

  const handleSave = async () => {
    if (!form.subject || !form.exam_date || !form.start_time || !form.end_time) {
      toast.error('Please fill all required fields');
      return;
    }
    const payload = { ...form, required_invigilators: Number(form.required_invigilators) };
    if (editing) {
      const { error } = await supabase.from('exam_schedules').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Exam updated');
    } else {
      const { error } = await supabase.from('exam_schedules').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Exam added');
    }
    setDialogOpen(false);
    setEditing(null);
    fetchExams();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('exam_schedules').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Exam removed');
    fetchExams();
  };

  const openEdit = (e: Exam) => {
    setEditing(e);
    setForm({
      subject: e.subject, exam_date: e.exam_date, start_time: e.start_time,
      end_time: e.end_time, room_number: e.room_number, required_invigilators: e.required_invigilators
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ subject: '', exam_date: '', start_time: '', end_time: '', room_number: '', required_invigilators: 1 });
    setDialogOpen(true);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
      return {
        subject: obj['subject'] || obj['name'] || '',
        exam_date: obj['date'] || obj['exam_date'] || '',
        start_time: obj['start_time'] || obj['start'] || '09:00',
        end_time: obj['end_time'] || obj['end'] || '12:00',
        room_number: obj['room'] || obj['room_number'] || '',
        required_invigilators: parseInt(obj['invigilators'] || obj['required_invigilators'] || '1') || 1,
      };
    }).filter(r => r.subject && r.exam_date);

    if (rows.length === 0) {
      toast.error('No valid rows found. CSV needs: subject, date, start_time, end_time, room');
      return;
    }

    const { error } = await supabase.from('exam_schedules').insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`${rows.length} exams imported`);
    fetchExams();
    e.target.value = '';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Add Exam
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span><Upload className="h-4 w-4 mr-2" /> Import CSV</span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
        </div>
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Invigilators</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No exams scheduled. Add exams manually or import via CSV.
                </TableCell>
              </TableRow>
            ) : (
              exams.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.subject}</TableCell>
                  <TableCell>{new Date(e.exam_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">{e.start_time.slice(0,5)} – {e.end_time.slice(0,5)}</TableCell>
                  <TableCell>{e.room_number}</TableCell>
                  <TableCell>{e.required_invigilators}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Exam' : 'Add Exam'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics 101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Room</Label>
                <Input value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="Hall A" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Required Invigilators</Label>
              <Input type="number" min={1} value={form.required_invigilators} onChange={e => setForm({ ...form, required_invigilators: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Add'} Exam</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
