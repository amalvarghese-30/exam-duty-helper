import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
// Added Textarea and Label for the new rules section
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// CHECK THIS LINE AT THE TOP
import { Wand2, RefreshCw, Calendar as CalendarIcon, Info, Sparkles, Download } from 'lucide-react';

const API = "http://localhost:5000";

// Standard rules to display to the admin
const BASE_RULES = `1. Teachers should not invigilate their own subject.
2. Teachers on leave should not be assigned.
3. Distribute duties so each teacher gets approximately equal total duties.
4. Avoid assigning teachers multiple times on same date.`;

interface Allocation {
  _id: string;
  teacher_id: string;
  exam_id: string;
  status: string;
  class_name: string;
  teacher?: { name: string; department: string };
  exam?: { subject: string; class_name: string; exam_date: string; start_time: string; end_time: string; room_number: string };
}

export default function DutyAllocation() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'table' | 'calendar'>('table');
  
  // NEW STATE: For the admin's additional instructions
  const [additionalRules, setAdditionalRules] = useState("");

  const [aiExplanation, setAiExplanation] = useState("AI is ready to explain the logic...");

  const [showFullAiLogic, setShowFullAiLogic] = useState(false);

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
      // Create the full instruction string
      const finalRules = `${BASE_RULES}\n\nAdditional Instructions: ${additionalRules}`;

      // Call the API and pass the rules
      const response = await axios.post(`${API}/auto-allocate/`, { 
        rules: finalRules 
      });

      setAiExplanation(response.data.explanation);

      toast.success(response.data.message || 'Allocation successful!');
      fetchAllocations();
      setAdditionalRules(""); // Clear the text box after it's done
    } catch (err: any) {
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

  const downloadPDF = () => {
    const doc = new jsPDF();
    const classes = ["FY", "SY", "TY", "LY"];
    let currentY = 45; // Start data after the header

    // --- 1. COLLEGE HEADER (Text on Top) ---
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("PILLAI COLLEGE OF ENGINEERING", 105, 15, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Examination Duty Chart", 105, 28, { align: "center" });

    // Professional Horizontal Line
    doc.setLineWidth(0.5);
    doc.line(14, 32, 196, 32); 

    doc.setFontSize(10);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 38);

    // --- 2. CLASS SEPARATION LOGIC ---
    classes.forEach((className) => {
      // This is where the "Separating Class" magic happens
      const sectionData = allocations.filter(a => a.class_name === className);

      if (sectionData.length > 0) {
        // Check for page overflow before starting a new section
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }

        // Add the Section Sub-heading (e.g., CLASS: SY YEAR)
        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246); 
        doc.text(`CLASS: ${className}`, 14, currentY);

        // Create a table for JUST this class
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Teacher', 'Subject', 'Date', 'Time', 'Room']],
          body: sectionData.map(a => [
            a.teacher?.name || 'Unassigned',
            a.exam?.subject || '—',
            a.exam?.exam_date ? new Date(a.exam.exam_date).toLocaleDateString() : '—',
            `${a.exam?.start_time?.slice(0, 5)} - ${a.exam?.end_time?.slice(0, 5)}`,
            a.exam?.room_number || '—'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [31, 41, 55] },
          margin: { left: 14 },
        });

        // Update currentY so the next class starts below this table
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    });

    doc.save(`PCE_Exam_Duty_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const statusColor = (s: string) => {
    if (s === 'assigned') return 'bg-primary/10 text-primary border-primary/20';
    if (s === 'accepted') return 'bg-success/10 text-success border-success/20';
    if (s === 'on_leave') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-muted text-muted-foreground';
  };

  const handleRuleInput = (text: string) => {
    console.log("Admin entered scheduling rule:", text);
  };

  const calendarData = allocations.reduce<Record<string, Allocation[]>>((acc, a) => {
    const date = a.exam?.exam_date || '';
    if (!acc[date]) acc[date] = [];
    acc[date].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* NEW: AI Rule Configuration Section */}
      <Card className="shadow-sm border-primary/10 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            AI Allocation Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground bg-white/50 p-3 rounded border border-primary/10">
            <p className="font-semibold mb-1 text-primary">Standard Rules (Always Active):</p>
            <pre className="whitespace-pre-wrap font-sans leading-relaxed">
              {BASE_RULES}
            </pre>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additional-rules" className="text-xs font-semibold">
              Special Instructions for this Cycle
            </Label>
            <Textarea 
              id="additional-rules"
              placeholder="e.g., Exclude Dr. Kunal Sharma from invigilation"
              value={additionalRules}
              onChange={(e) => setAdditionalRules(e.target.value)}
              className="bg-white resize-none"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. ENHANCED AI REASONING CARD */}
      {aiExplanation && (
        <Card className="border-blue-200 bg-blue-50/30 shadow-sm transition-all duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-blue-800 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-blue-500" />
              AI ALLOCATION LOGIC
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFullAiLogic(!showFullAiLogic)}
              className="h-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700 text-xs font-semibold"
            >
              {showFullAiLogic ? "Hide Details" : "Show Reasoning"}
            </Button>
          </CardHeader>
          
          <CardContent>
            {/* Short Summary (Always Visible) */}
            <p className="text-sm text-blue-700 leading-relaxed font-medium">
              The AI has successfully balanced duties across available staff while preventing subject and schedule conflicts.
            </p>

            {/* Expandable Detailed Reasoning */}
            {showFullAiLogic && (
              <div className="mt-4 pt-4 border-t border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="prose prose-sm max-w-none text-blue-800/80">
                  {/* Split by newlines or use ReactMarkdown if you have it installed */}
                  {aiExplanation.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button onClick={runAllocation} disabled={loading} className="shadow-md">
            <Wand2 className="h-4 w-4 mr-2" />
            {loading ? 'AI Processing...' : 'Run AI Auto-Allocate'}
          </Button>
          <Button variant="outline" onClick={downloadPDF} disabled={allocations.length === 0}>
            <Download className="h-4 w-4 mr-2" /> Download PDF
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

      {/* Table and Calendar views remain the same as your code... */}
      {view === 'table' ? (
        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
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
                    No allocations yet. Configure rules and click "Run AI Auto-Allocate".
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map(a => (
                  <TableRow key={a._id}>
                    <TableCell className="font-medium">{a.teacher?.name || '—'}</TableCell>
                    <TableCell>{a.exam?.subject || '—'}</TableCell>
                    <TableCell className="font-bold text-blue-600">
                      {a.exam?.class_name || "N/A"}
                    </TableCell>
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
        /* Calendar view logic here... */
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
