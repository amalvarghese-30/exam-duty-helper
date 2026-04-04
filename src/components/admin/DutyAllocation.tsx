import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Wand2,
  RefreshCw,
  Calendar as CalendarIcon,
  Info
} from 'lucide-react';
// import ConversationalPolicyBox from "@/components/admin/phase3/ConversationalPolicyBox";

const API = "http://localhost:3000/api";

interface Allocation {
  _id: string;
  teacher_id: string;
  exam_id: string;
  status: string;
  teacher?: {
    name: string;
    department: string;
  };
  exam?: {
    subject: string;
    exam_date: string;
    start_time: string;
    end_time: string;
    room_number: string;
  };
}

export default function DutyAllocation() {

  const [allocations, setAllocations] =
    useState<Allocation[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [view, setView] =
    useState<'table' | 'calendar'>('table');

  const [rulesText, setRulesText] =
    useState("");


  const fetchAllocations = async () => {

    try {

      const res =
        await axios.get(`${API}/auto-allocate/`);

      setAllocations(res.data);

    } catch {

      toast.error("Failed to load allocations");

    }
  };


  useEffect(() => {

    fetchAllocations();

  }, []);


  const runAllocation = async () => {

    setLoading(true);

    try {

      const response =
        await axios.post(
          `${API}/auto-allocate/`,
          {
            rules_text: rulesText
          }
        );

      toast.success(
        response.data.message ||
        "Allocation completed"
      );

      fetchAllocations();

    } catch (err: any) {

      toast.error(
        err.response?.data?.error ||
        "Allocation failed"
      );

    }

    setLoading(false);
  };


  const clearAllocations = async () => {

    try {

      await axios.delete(
        `${API}/auto-allocate/clear`
      );

      toast.success(
        "All allocations cleared"
      );

      fetchAllocations();

    } catch {

      toast.error(
        "Failed to clear allocations"
      );

    }
  };


  const statusColor = (s: string) => {

    if (s === "assigned")
      return "bg-primary/10 text-primary border-primary/20";

    if (s === "accepted")
      return "bg-success/10 text-success border-success/20";

    if (s === "on_leave")
      return "bg-warning/10 text-warning border-warning/20";

    return "bg-muted text-muted-foreground";
  };


  const calendarData =
    allocations.reduce<Record<string, Allocation[]>>(
      (acc, a) => {

        const date =
          a.exam?.exam_date || "";

        if (!acc[date])
          acc[date] = [];

        acc[date].push(a);

        return acc;

      }, {}
    );


  return (

    <div className="space-y-6 animate-fade-in">


      {/* ============================= */}
      {/* AI POLICY CARD (NEW UI) */}
      {/* ============================= */}

      <Card className="shadow-card">

        <CardHeader className="flex flex-row items-center gap-2">

          <Info className="w-5 h-5 text-blue-500" />

          <CardTitle>
            AI Allocation Policy
          </CardTitle>

        </CardHeader>


        <CardContent className="space-y-4">


          {/* STANDARD RULES */}

          <div className="bg-muted/40 rounded-lg p-4">

            <p className="font-semibold text-sm mb-2">

              Standard Rules (Always Active):

            </p>

            <ol className="list-decimal ml-5 text-sm text-muted-foreground space-y-1">

              <li>
                Teachers should not invigilate their own subject.
              </li>

              <li>
                Teachers on leave should not be assigned.
              </li>

              <li>
                Duties are distributed fairly among teachers.
              </li>

              <li>
                Avoid assigning teachers multiple times on same date.
              </li>

            </ol>

          </div>


          {/* SPECIAL INSTRUCTIONS TEXTBOX */}

          <div>

            <label className="text-sm font-medium">

              Special Instructions for this Cycle

            </label>

            <textarea
              placeholder="e.g., Senior faculty should only have morning duties. Avoid assigning new teachers on back-to-back days."
              value={rulesText}
              onChange={(e) =>
                setRulesText(e.target.value)
              }
              className="mt-2 w-full rounded-md border p-3 text-sm min-h-[110px]"
            />

          </div>


          {/* BUTTONS */}

          <div className="flex gap-2">

            <Button
              onClick={runAllocation}
              disabled={loading}
            >

              <Wand2 className="h-4 w-4 mr-2" />

              {loading
                ? "Allocating..."
                : "AI Auto-Allocate"}

            </Button>


            <Button
              variant="outline"
              onClick={clearAllocations}
            >

              <RefreshCw className="h-4 w-4 mr-2" />

              Clear All

            </Button>

          </div>

        </CardContent>

      </Card>


      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">

        <Button
          variant={
            view === "table"
              ? "default"
              : "ghost"
          }
          size="sm"
          onClick={() =>
            setView("table")
          }
        >
          Table
        </Button>

        <Button
          variant={
            view === "calendar"
              ? "default"
              : "ghost"
          }
          size="sm"
          onClick={() =>
            setView("calendar")
          }
        >

          <CalendarIcon className="h-4 w-4 mr-1" />

          Calendar

        </Button>

      </div>


      {/* ============================= */}
      {/* TABLE VIEW */}
      {/* ============================= */}

      {view === "table" ? (

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

                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >

                    No allocations yet. Click
                    "AI Auto-Allocate".

                  </TableCell>

                </TableRow>

              ) : (

                allocations.map(a => (

                  <TableRow key={a._id}>

                    <TableCell>

                      {a.teacher?.name || "—"}

                    </TableCell>

                    <TableCell>

                      {a.exam?.subject || "—"}

                    </TableCell>

                    <TableCell>

                      {a.exam?.exam_date
                        ? new Date(
                          a.exam.exam_date
                        ).toLocaleDateString()
                        : "—"}

                    </TableCell>

                    <TableCell>

                      {a.exam?.start_time?.slice(0, 5)}
                      –
                      {a.exam?.end_time?.slice(0, 5)}

                    </TableCell>

                    <TableCell>

                      {a.exam?.room_number}

                    </TableCell>

                    <TableCell>

                      <Badge
                        variant="outline"
                        className={statusColor(a.status)}
                      >
                        {a.status}
                      </Badge>

                    </TableCell>

                  </TableRow>

                ))

              )}

            </TableBody>

          </Table>

        </Card>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {Object.entries(calendarData)
            .sort()
            .map(([date, allocs]) => (

              <Card key={date}>

                <CardHeader>

                  <CardTitle className="text-sm">

                    {new Date(date)
                      .toLocaleDateString()}

                  </CardTitle>

                </CardHeader>

                <CardContent>

                  {allocs.map(a => (

                    <div
                      key={a._id}
                      className="text-sm"
                    >

                      {a.exam?.subject}

                    </div>

                  ))}

                </CardContent>

              </Card>

            ))}

        </div>

      )}

    </div>
  );
}