import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  availability_status: string;
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ name: '', email: '', department: '' });

  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('*').order('name');
    if (data) setTeachers(data);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (editing) {
      const { error } = await supabase.from('teachers').update(form).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Teacher updated');
    } else {
      const { error } = await supabase.from('teachers').insert(form);
      if (error) { toast.error(error.message); return; }
      toast.success('Teacher added');
    }
    setDialogOpen(false);
    setEditing(null);
    setForm({ name: '', email: '', department: '' });
    fetchTeachers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Teacher removed');
    fetchTeachers();
  };

  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({ name: t.name, email: t.email, department: t.department });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', department: '' });
    setDialogOpen(true);
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === 'available') return 'bg-success/10 text-success border-success/20';
    if (s === 'on_leave') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Add Teacher
        </Button>
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No teachers found. Add your first teacher to get started.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.email}</TableCell>
                  <TableCell>{t.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(t.availability_status)}>
                      {t.availability_status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive hover:text-destructive">
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
            <DialogTitle>{editing ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@university.edu" />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Computer Science" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Add'} Teacher</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
