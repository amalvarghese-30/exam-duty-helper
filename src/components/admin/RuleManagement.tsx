import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ModuleHero from '@/components/ModuleHero';
import { WandSparkles, Save, PlayCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface PolicyData {
  rulesText: string;
  autoRunOnExamChange: boolean;
  updatedAt?: string;
  lastTriggeredAt?: string;
}

export default function RuleManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [policy, setPolicy] = useState<PolicyData>({
    rulesText: '',
    autoRunOnExamChange: false,
  });

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/auto-allocate/policy`);
      setPolicy({
        rulesText: res.data.rulesText || '',
        autoRunOnExamChange: !!res.data.autoRunOnExamChange,
        updatedAt: res.data.updatedAt,
        lastTriggeredAt: res.data.lastTriggeredAt,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load rule policy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const savePolicy = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/auto-allocate/policy`, {
        rulesText: policy.rulesText,
        autoRunOnExamChange: policy.autoRunOnExamChange,
      });
      toast.success('Dynamic rule policy updated');
      fetchPolicy();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const runAutomatedNow = async () => {
    setRunning(true);
    try {
      const res = await axios.post(`${API}/auto-allocate/run-automated`);
      toast.success(res.data.message || 'Automated allocation completed');
      fetchPolicy();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Automated run failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-10 text-center text-muted-foreground">Loading policy...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleHero
        eyebrow="Dynamic Rule Management"
        title="Policy-Controlled Automated Allocation"
        description="Maintain one central policy for scheduling logic and optionally trigger automated allocation whenever exam data changes."
      />

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WandSparkles className="h-5 w-5 text-primary" />
            Scheduling Policy
          </CardTitle>
          <CardDescription>Update rules once and apply everywhere.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="rules">Rule Text</Label>
            <Textarea
              id="rules"
              rows={10}
              className="bg-card"
              value={policy.rulesText}
              onChange={(e) => setPolicy((prev) => ({ ...prev, rulesText: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">Automated Duty Assignment</p>
              <p className="text-sm text-muted-foreground">
                When enabled, exam create/update/delete actions automatically trigger fresh duty assignment.
              </p>
            </div>
            <Switch
              checked={policy.autoRunOnExamChange}
              onCheckedChange={(checked) => setPolicy((prev) => ({ ...prev, autoRunOnExamChange: checked }))}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={savePolicy} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Policy'}
            </Button>
            <Button variant="outline" onClick={runAutomatedNow} disabled={running}>
              <PlayCircle className="mr-2 h-4 w-4" />
              {running ? 'Running...' : 'Run Automated Allocation Now'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {policy.updatedAt && <Badge variant="outline">Policy Updated: {new Date(policy.updatedAt).toLocaleString()}</Badge>}
            {policy.lastTriggeredAt && <Badge variant="outline">Last Automated Run: {new Date(policy.lastTriggeredAt).toLocaleString()}</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
