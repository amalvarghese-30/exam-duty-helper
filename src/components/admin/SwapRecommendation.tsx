import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ModuleHero from '@/components/ModuleHero';
import { toast } from 'sonner';
import { RefreshCw, Shuffle, Sparkles } from 'lucide-react';

const API = 'http://localhost:5000';

interface SwapRecommendationRow {
  teacherA: {
    id: string;
    name: string;
    email: string;
    currentLoad: number;
    currentExam: string;
    currentDate: string;
  };
  teacherB: {
    id: string;
    name: string;
    email: string;
    currentLoad: number;
    currentExam: string;
    currentDate: string;
  };
  impactScore: number;
  rationale: string;
}

export default function SwapRecommendation() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SwapRecommendationRow[]>([]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/auto-allocate/swap-recommendations`);
      setRows(res.data.recommendations || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load swap recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleHero
        eyebrow="Swap Recommendation Module"
        title="Smart Duty Swap Suggestions"
        description="Suggests low-risk swaps that improve fairness while respecting subject constraints, leave dates, and date-level scheduling conflicts."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          {loading ? 'Calculating recommendations...' : `${rows.length} recommendation(s) ready`}
        </div>
        <Button variant="outline" onClick={fetchRecommendations} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recommended Swaps</CardTitle>
          <CardDescription>Ranked by projected fairness improvement impact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-muted-foreground dark:border-slate-700 dark:bg-slate-900/60">
              No valid swap suggestions found. Try running AI allocation again to create a broader duty distribution.
            </div>
          ) : (
            rows.map((row, idx) => (
              <article key={`${row.teacherA.id}-${row.teacherB.id}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <Shuffle className="h-4 w-4 text-indigo-600" />
                    Swap #{idx + 1}
                  </div>
                  <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
                    Impact Score {row.impactScore}
                  </Badge>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <SwapTeacherCard
                    title="Teacher A"
                    name={row.teacherA.name}
                    email={row.teacherA.email}
                    exam={row.teacherA.currentExam}
                    date={row.teacherA.currentDate}
                    load={row.teacherA.currentLoad}
                  />
                  <SwapTeacherCard
                    title="Teacher B"
                    name={row.teacherB.name}
                    email={row.teacherB.email}
                    exam={row.teacherB.currentExam}
                    date={row.teacherB.currentDate}
                    load={row.teacherB.currentLoad}
                  />
                </div>

                <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <span className="font-semibold text-slate-900 dark:text-white">Why this swap: </span>
                  {row.rationale}
                </p>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SwapTeacherCard({
  title,
  name,
  email,
  exam,
  date,
  load,
}: {
  title: string;
  name: string;
  email: string;
  exam: string;
  date: string;
  load: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{name}</p>
      <p className="text-xs text-muted-foreground">{email}</p>
      <div className="mt-3 text-sm text-slate-700 dark:text-slate-200">
        <p><span className="font-medium">Current Exam:</span> {exam}</p>
        <p><span className="font-medium">Date:</span> {new Date(date).toLocaleDateString()}</p>
        <p><span className="font-medium">Current Load:</span> {load} duties</p>
      </div>
    </div>
  );
}
