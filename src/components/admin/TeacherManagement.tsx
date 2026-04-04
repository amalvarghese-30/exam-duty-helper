import { useEffect, useState } from "react";
import axios from "axios";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  department: string;
  subject: string;
  availability_status?: string;
}

const API = "http://localhost:3000/api/teacher";

export default function TeacherManagement() {

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    subject: ""
  });

  // FETCH teachers
  const fetchTeachers = async () => {
    try {
      const res = await axios.get(API);
      setTeachers(res.data);
    } catch (err) {
      toast.error("Failed to fetch teachers");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // SAVE teacher
  const handleSave = async () => {

    if (!form.name || !form.email || !form.subject) {
      toast.error("Name, email and subject required");
      return;
    }

    try {

      if (editing) {

        await axios.put(`${API}/${editing._id}`, form);
        toast.success("Teacher updated");

      } else {

        await axios.post(API, form);
        toast.success("Teacher added");

      }

      setDialogOpen(false);
      setEditing(null);

      setForm({
        name: "",
        email: "",
        department: "",
        subject: ""
      });

      fetchTeachers();

    } catch {
      toast.error("Operation failed");
    }
  };

  // DELETE teacher
  const handleDelete = async (id: string) => {

    try {

      await axios.delete(`${API}/${id}`);
      toast.success("Teacher removed");
      fetchTeachers();

    } catch {
      toast.error("Delete failed");
    }
  };

  // EDIT teacher
  const openEdit = (t: Teacher) => {

    setEditing(t);

    setForm({
      name: t.name,
      email: t.email,
      department: t.department,
      subject: t.subject
    });

    setDialogOpen(true);
  };

  // NEW teacher
  const openNew = () => {

    setEditing(null);

    setForm({
      name: "",
      email: "",
      department: "",
      subject: ""
    });

    setDialogOpen(true);
  };

  // SEARCH filter
  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.department.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Search teachers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>

      </div>


      {/* TABLE */}
      <Card className="shadow-card overflow-hidden">

        <Table>

          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>


          <TableBody>

            {filtered.length === 0 ? (

              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No teachers found
                </TableCell>
              </TableRow>

            ) : (

              filtered.map(t => (

                <TableRow key={t._id}>

                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>{t.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t.subject}
                    </Badge>
                  </TableCell>

                  <TableCell>

                    <div className="flex gap-1">

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(t._id)}
                        className="text-destructive"
                      >
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


      {/* DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

        <DialogContent>

          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Teacher" : "Add Teacher"}
            </DialogTitle>
          </DialogHeader>


          <div className="space-y-4">

            <div>
              <Label>Full Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
              />
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Data Structures"
              />
            </div>

            <div className="flex justify-end gap-2">

              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleSave}>
                {editing ? "Update" : "Add"} Teacher
              </Button>

            </div>

          </div>

        </DialogContent>

      </Dialog>

    </div>
  );
}