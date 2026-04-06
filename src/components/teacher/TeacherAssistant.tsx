import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ModuleHero from '@/components/ModuleHero';
import { toast } from 'sonner';
import { Bot, Send, UserRound, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

export default function TeacherAssistant() {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [facts, setFacts] = useState<{ totalDuties: number; upcomingDuties: number; fairnessScore: number; averageDuties: number } | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'I can explain your next duty, workload fairness, and how leave impacts allocation. Ask me anything about your duty schedule.',
    },
  ]);

  const askAssistant = async (inputQuestion?: string) => {
    const text = (inputQuestion ?? question).trim();
    if (!text || !user?.email) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auto-allocate/teacher-assistant`, {
        email: user.email,
        question: text,
      });

      setFacts(res.data.quickFacts || null);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.answer || 'No response generated.' }]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Assistant is unavailable right now');
      setMessages((prev) => [...prev, { role: 'assistant', text: 'I could not fetch your data right now. Please try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <ModuleHero
        eyebrow="Teacher Explanation Assistant"
        title="Personal Duty Guidance"
        description="Ask schedule questions in plain language and receive clear explanations based on your actual assigned duties."
      />

      {facts && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact title="Total Duties" value={String(facts.totalDuties)} />
          <Fact title="Upcoming Duties" value={String(facts.upcomingDuties)} />
          <Fact title="Fairness Score" value={`${facts.fairnessScore}/100`} />
          <Fact title="Team Avg Duties" value={String(facts.averageDuties)} />
        </div>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Assistant Chat
          </CardTitle>
          <CardDescription>Try: "When is my next duty?", "Is my workload fair?", "How does leave affect assignment?"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-6 ${msg.role === 'user' ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900' : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                    {msg.role === 'user' ? <UserRound className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') askAssistant();
              }}
              placeholder="Ask about your duties, fairness, or leave impact..."
              className="bg-card"
            />
            <Button onClick={() => askAssistant()} disabled={loading} className="bg-slate-900 text-white hover:bg-slate-800">
              <Send className="mr-2 h-4 w-4" />
              {loading ? 'Thinking...' : 'Ask'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {['When is my next duty?', 'Is my workload fair?', 'How does leave impact my assignments?'].map((prompt) => (
              <Badge
                key={prompt}
                variant="outline"
                className="cursor-pointer border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => askAssistant(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({ title, value }: { title: string; value: string }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
