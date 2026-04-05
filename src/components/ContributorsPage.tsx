// src/components/ContributorsPage.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Code2, Brain, Layout, Database, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const teamContributions = [
    {
        member: 'Athira',
        contribution: 'AI Scheduler Engine (allocation pipeline, constraint engine integration, NLP rule parsing)',
        icon: <Brain className="h-5 w-5 text-purple-500" />,
        role: 'Lead AI Engineer'
    },
    {
        member: 'Amal',
        contribution: 'Leave Management Module (teacher leave validation + backend API)',
        icon: <Database className="h-5 w-5 text-blue-500" />,
        role: 'Backend Developer'
    },
    {
        member: 'Member 3',
        contribution: 'Teacher Dashboard API (stats, duties, availability integration)',
        icon: <Layout className="h-5 w-5 text-green-500" />,
        role: 'API Developer'
    },
    {
        member: 'Member 4',
        contribution: 'Admin Dashboard Metrics (allocation overview + exam statistics APIs)',
        icon: <Code2 className="h-5 w-5 text-orange-500" />,
        role: 'Full Stack Developer'
    },
    {
        member: 'Member 5',
        contribution: 'NLP Policy Parser Integration (Gemini-based rule conversion to constraints)',
        icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
        role: 'AI Engineer'
    },
    {
        member: 'Member 6',
        contribution: 'Swap Recommendation Module (duty swap suggestion backend logic)',
        icon: <Shuffle className="h-5 w-5 text-indigo-500" />,
        role: 'Backend Developer'
    },
    {
        member: 'Member 7',
        contribution: 'Fairness Analytics Module (workload distribution analysis)',
        icon: <TrendingUp className="h-5 w-5 text-emerald-500" />,
        role: 'Data Analyst'
    },
    {
        member: 'Member 8',
        contribution: 'Simulation Risk Prediction Panel (allocation simulation interface)',
        icon: <Activity className="h-5 w-5 text-rose-500" />,
        role: 'Frontend Developer'
    },
    {
        member: 'Member 9',
        contribution: 'Conversational Rule Editor UI (natural-language rule input interface)',
        icon: <MessageSquare className="h-5 w-5 text-cyan-500" />,
        role: 'UI/UX Developer'
    },
    {
        member: 'Member 10',
        contribution: 'Teacher AI Chat Assistant (teacher explanation chatbot integration)',
        icon: <Bot className="h-5 w-5 text-violet-500" />,
        role: 'AI Integration Specialist'
    },
    {
        member: 'Member 11',
        contribution: 'Allocation Simulation Dashboard (simulation result visualization)',
        icon: <BarChart3 className="h-5 w-5 text-teal-500" />,
        role: 'Frontend Developer'
    },
];

// Import missing icons
import { Shuffle, TrendingUp, Activity, MessageSquare, Bot, BarChart3 } from 'lucide-react';

export default function ContributorsPage() {
    const navigate = useNavigate();
    const { role } = useAuth();

    const handleBack = () => {
        if (role === 'admin') {
            navigate('/admin');
        } else if (role === 'teacher') {
            navigate('/teacher');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-6 gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Button>

                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <Users className="h-4 w-4" />
                        Interactive Portfolio
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300 mb-4">
                        Project Contributors
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        The brilliant minds behind <strong className="text-primary">Exam Duty Helper</strong>.
                        A specialized AI-driven platform for optimizing academic infrastructure.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                        <span className="px-3 py-1 text-sm bg-muted rounded-full">Module Owners</span>
                        <span className="px-3 py-1 text-sm bg-muted rounded-full">Lead Developers</span>
                        <span className="px-3 py-1 text-sm bg-muted rounded-full">System Architects</span>
                    </div>
                </div>

                {/* Video Section */}
                <Card className="mb-12 shadow-lg border-0 overflow-hidden">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">System Walkthrough</CardTitle>
                        <CardDescription>
                            A comprehensive demonstration of the AI scheduler and dashboard features
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-xl">
                            <iframe
                                className="w-full h-full"
                                title="Exam Duty Helper Demo"
                                src="https://www.youtube.com/embed/REPLACE_WITH_YOUR_VIDEO_ID"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                        <p className="text-center text-sm text-muted-foreground mt-4">
                            🎥 Replace <code className="bg-muted px-1 rounded">REPLACE_WITH_YOUR_VIDEO_ID</code> with your actual YouTube video ID
                        </p>
                    </CardContent>
                </Card>

                {/* Contributions Grid */}
                <div className="mb-12">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">Implementation Breakdown</h2>
                        <p className="text-muted-foreground">Full mapping of technical ownership across the project lifecycle</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamContributions.map((item, idx) => (
                            <Card key={idx} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary">
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h3 className="font-semibold text-lg">{item.member}</h3>
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{item.role}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{item.contribution}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t pt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Strategic Learning Initiative @ PCE
                        <a
                            href="https://www.pce.ac.in"
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline ml-2"
                        >
                            Official Institution Portal
                        </a>
                    </p>
                </footer>
            </div>
        </div>
    );
}