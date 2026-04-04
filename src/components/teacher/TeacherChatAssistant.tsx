// src/components/teacher/TeacherChatAssistant.tsx (Refined - Clean Chat UI)
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bot, Send, Loader2, User, Sparkles, MessageSquare, HelpCircle } from "lucide-react";

const API = "http://localhost:3000/api";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    category?: string;
}

const suggestedQuestions = [
    "Why do I have this many duties?",
    "How are duties distributed fairly?",
    "Can I request a swap?",
    "What happens if I'm on leave?",
    "How does the allocation algorithm work?"
];

export default function TeacherChatAssistant() {
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI allocation assistant. Ask me anything about your exam duties, workload fairness, or how to request swaps.",
            timestamp: new Date(),
        }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const askAI = async () => {
        if (!question.trim()) {
            toast.error("Please enter a question");
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: question,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setQuestion("");
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API}/teacher/chat/ask`,
                { question },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: res.data.data?.answer || "I'm not sure how to answer that. Please try rephrasing your question.",
                timestamp: new Date(),
                category: res.data.data?.category,
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err: any) {
            console.error("Chat error:", err);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: err.response?.data?.message || "Sorry, I'm having trouble connecting right now. Please try again later.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            toast.error("Failed to get response");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            askAI();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Card className="shadow-sm border-0 h-[calc(100vh-200px)] sticky top-6 flex flex-col">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-sm">Allocation Assistant</CardTitle>
                            <CardDescription className="text-xs">Ask anything about your duties</CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="gap-1 text-[10px]">
                        <Sparkles className="h-3 w-3" />
                        AI
                    </Badge>
                </div>
            </CardHeader>

            {/* Messages Container */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {msg.role === "assistant" && (
                            <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    <Bot className="h-3.5 w-3.5" />
                                </AvatarFallback>
                            </Avatar>
                        )}

                        <div className={`max-w-[80%] ${msg.role === "user" ? "order-1" : ""}`}>
                            <div
                                className={`rounded-lg p-3 text-sm ${msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                                {msg.category && msg.role === "assistant" && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {msg.category}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {msg.role === "user" && (
                            <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    <User className="h-3.5 w-3.5" />
                                </AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3 justify-start">
                        <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/10">
                                <Bot className="h-3.5 w-3.5 animate-pulse" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            {/* Suggested Questions */}
            <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Suggested questions:
                </p>
                <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.slice(0, 3).map((sq, idx) => (
                        <button
                            key={idx}
                            onClick={() => setQuestion(sq)}
                            className="text-xs bg-muted hover:bg-muted/80 rounded-full px-3 py-1.5 transition-colors"
                        >
                            {sq}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <Textarea
                        placeholder="Type your question here..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="min-h-[60px] resize-none text-sm"
                        disabled={loading}
                    />
                    <Button
                        onClick={askAI}
                        disabled={loading || !question.trim()}
                        className="self-end"
                        size="icon"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    Ask about workload, swaps, fairness, or schedule conflicts
                </p>
            </div>
        </Card>
    );
}